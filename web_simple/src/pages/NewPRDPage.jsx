/**
 * New PRD page — guided generation workflow (PRD v2.1.0)
 *
 * Step 1  Intake   — idea, tech preferences, LLM choice (admin preset or
 *                    personal override)
 * Step 2  Clarify  — LLM-generated questions; answer, skip, or regenerate
 * Step 3  Review   — per-section drafts (view/edit/regenerate) plus the four
 *                    mermaid diagrams (PRD v2.3.0)
 * Step 4  Finalize — assembles the document and navigates to it
 *
 * The workflow lives on the server, so leaving and coming back resumes
 * exactly where the user stopped (GET /current on mount).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { workflowAPI, llmConfigAPI } from '../services/api';
import Button from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import InputField from '../components/design-system/InputField';
import MermaidDiagram from '../components/MermaidDiagram';

const SECTIONS = [
  { key: 'requirements', label: 'Requirements' },
  { key: 'tech_stack', label: 'Tech Stack' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'implementation_plan', label: 'Implementation Plan' },
  { key: 'success_metrics', label: 'Success Metrics' },
];

const DIAGRAMS = [
  { key: 'workflow', label: 'Workflow' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'data_model', label: 'Data Model' },
  { key: 'api_sequence', label: 'API Sequence' },
];

const SECTION_LABELS = Object.fromEntries(
  [...SECTIONS.map((s) => [s.key, s.label]), ...DIAGRAMS.map((d) => [d.key, d.label])]
);

const STEP_INDICATORS = ['Intake', 'Questions', 'Review'];

function NewPRDPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [error, setError] = useState('');

  // Workflow state (server-persisted)
  const [workflow, setWorkflow] = useState(null);

  // Step 1 — intake form
  const [idea, setIdea] = useState('');
  const [techPrefs, setTechPrefs] = useState({ frontend: '', backend: '', database: '' });
  const [llmChoice, setLlmChoice] = useState('default');
  const [presets, setPresets] = useState([]);

  // Step 2 — clarify
  const [answers, setAnswers] = useState([]);
  const [questionFeedback, setQuestionFeedback] = useState('');

  // Step 3 — review
  const [activeTab, setActiveTab] = useState('requirements');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [sectionFeedback, setSectionFeedback] = useState('');
  const [activeDiagram, setActiveDiagram] = useState('workflow');
  const [editingDiagram, setEditingDiagram] = useState(false);
  const [diagramContent, setDiagramContent] = useState('');
  const [diagramFeedback, setDiagramFeedback] = useState('');

  const stepIndex = workflow
    ? { clarify: 1, review: 2 }[workflow.current_step] ?? 0
    : 0;

  useEffect(() => {
    resumeWorkflow();
    loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeWorkflow = async () => {
    try {
      const response = await workflowAPI.getCurrent();
      adoptWorkflow(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load your workflow');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await llmConfigAPI.getPublicPresets();
      setPresets(response.data);
    } catch {
      // Non-critical: picker falls back to "default (active preset)"
    }
  };

  const adoptWorkflow = (data) => {
    setWorkflow(data);
    setAnswers((data.clarifying_questions || []).map(
      (q, i) => data.clarifying_answers?.[i] || ''
    ));
    setActiveTab(SECTIONS[0].key);
    setActiveDiagram(DIAGRAMS[0].key);
    resetEditors();
  };

  const resetEditors = () => {
    setEditing(false);
    setEditingDiagram(false);
    setSectionFeedback('');
    setDiagramFeedback('');
    setEditContent('');
    setDiagramContent('');
  };

  const run = async (label, fn) => {
    setBusy(true);
    setBusyLabel(label);
    setError('');
    try {
      const response = await fn();
      if (response?.data) adoptWorkflow(response.data);
      return response?.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong — please retry');
      return null;
    } finally {
      setBusy(false);
      setBusyLabel('');
    }
  };

  // --- Step 1: intake ---

  const handleStart = async (e) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('Please describe what you want to build');
      return;
    }
    const tech_preferences = Object.fromEntries(
      Object.entries(techPrefs).filter(([, v]) => v.trim())
    );
    const llm_choice =
      llmChoice === 'default' ? null
        : llmChoice === 'personal' ? { use_personal: true }
          : { preset_id: Number(llmChoice) };

    const data = await run(
      'Starting workflow — generating clarifying questions…',
      () => workflowAPI.create({ idea, tech_preferences, llm_choice })
    );
    if (data) setIdea(data.idea);
  };

  // --- Step 2: clarify ---

  const handleSubmitAnswers = async () => {
    const filled = answers.filter((a) => a.trim());
    await run(
      'Generating section drafts — this can take a minute…',
      () => workflowAPI.submitAnswers(filled.length ? filled : ['(no answers)'])
    );
  };

  const handleSkipQuestions = async () => {
    await run('Generating section drafts…', () => workflowAPI.skipStep('clarify'));
  };

  const handleRegenerateQuestions = async () => {
    await run(
      'Regenerating questions…',
      () => workflowAPI.regenerateQuestions(questionFeedback.trim() || null)
    );
    setQuestionFeedback('');
  };

  // --- Step 3: review ---

  const handleSaveDraft = async () => {
    const data = await run('Saving…', () =>
      workflowAPI.updateDraft(activeTab, editContent)
    );
    if (data) setEditing(false);
  };

  const handleRegenerateSection = async () => {
    await run('Regenerating section…', () =>
      workflowAPI.regenerateSection(activeTab, sectionFeedback.trim() || null)
    );
    setSectionFeedback('');
    setEditing(false);
  };

  const handleSaveDiagram = async () => {
    const data = await run('Saving…', () =>
      workflowAPI.updateDiagram(activeDiagram, diagramContent)
    );
    if (data) setEditingDiagram(false);
  };

  const handleRegenerateDiagram = async () => {
    await run('Regenerating diagram…', () =>
      workflowAPI.regenerateDiagram(activeDiagram, diagramFeedback.trim() || null)
    );
    setDiagramFeedback('');
    setEditingDiagram(false);
  };

  // --- Step 4: finalize ---

  const handleFinalize = async () => {
    const data = await run('Saving your PRD…', () => workflowAPI.finalize());
    if (data?.document_id) {
      navigate(`/prd/${data.document_id}`);
    }
  };

  const handleStartOver = async () => {
    if (!window.confirm('Abandon this workflow and start over?')) return;
    await run('Discarding…', () => workflowAPI.deleteCurrent());
    setWorkflow(null);
    setIdea('');
  };

  // --- Render helpers ---

  const busyOverlay = busy && (
    <div className="flex items-center justify-center gap-sm p-lg mb-lg
                    bg-surface-container-low rounded-lg border border-outline-variant">
      <span className="inline-block w-5 h-5 border-2 border-secondary
                       border-t-transparent rounded-full animate-spin" />
      <span className="text-body-sm font-body-sm text-on-surface-variant">
        {busyLabel}
      </span>
    </div>
  );

  const errorBanner = error && (
    <div className="flex items-start gap-sm p-md mb-lg rounded-lg border
                    border-error-container/40 bg-error-container/20
                    text-on-error-container text-body-sm">
      <span className="material-symbols-outlined text-base">error</span>
      <span>{error}</span>
    </div>
  );

  const stepIndicator = (
    <div className="flex items-center gap-md mb-lg">
      {STEP_INDICATORS.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="text-outline">→</span>}
          <span className={`text-label-caps font-label-caps px-sm py-xs rounded-full ${
            i === stepIndex
              ? 'bg-secondary-container/30 text-on-secondary-container'
              : i < stepIndex
                ? 'text-secondary'
                : 'text-outline'
          }`}>
            {i + 1}. {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  // --- Step views ---

  const renderIntake = () => (
    <Card elevation="medium" padding="xl">
      <form onSubmit={handleStart} className="space-y-lg">
        <div>
          <label className="block text-label-caps font-label-caps
                            text-on-surface-variant uppercase tracking-widest mb-xs">
            Project Description <span className="text-error">*</span>
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full min-h-[160px] p-md bg-surface border border-outline-variant
                       rounded-lg text-body-md text-on-surface placeholder:text-outline
                       focus:outline-none focus:border-secondary focus:ring-1
                       focus:ring-secondary resize-y"
            placeholder="Describe what you want to build. Include the main features, target users, and any specific requirements…"
            required
          />
          <p className="text-body-sm text-on-surface-variant mt-xs">
            The AI will ask a few clarifying questions before drafting your PRD.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <InputField
            label="Frontend" name="frontend" value={techPrefs.frontend}
            placeholder="e.g., React" onChange={(e) =>
              setTechPrefs({ ...techPrefs, frontend: e.target.value })}
          />
          <InputField
            label="Backend" name="backend" value={techPrefs.backend}
            placeholder="e.g., FastAPI" onChange={(e) =>
              setTechPrefs({ ...techPrefs, backend: e.target.value })}
          />
          <InputField
            label="Database" name="database" value={techPrefs.database}
            placeholder="e.g., PostgreSQL" onChange={(e) =>
              setTechPrefs({ ...techPrefs, database: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-label-caps font-label-caps
                            text-on-surface-variant uppercase tracking-widest mb-xs">
            LLM to use
          </label>
          <select
            value={llmChoice}
            onChange={(e) => setLlmChoice(e.target.value)}
            className="w-full px-md py-3 bg-surface border border-outline-variant
                       rounded-lg text-body-md text-on-surface focus:outline-none
                       focus:border-secondary"
          >
            <option value="default">Default (active platform preset)</option>
            {presets.map((p) => (
              <option key={p.id} value={String(p.id)}>
                Preset: {p.name} ({p.model})
              </option>
            ))}
            <option value="personal">My personal LLM</option>
          </select>
          <p className="text-body-sm text-on-surface-variant mt-xs">
            Configure presets in Settings, or add a personal LLM there too.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className="w-full"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Start workflow
        </Button>
      </form>
    </Card>
  );

  const renderClarify = () => {
    const questions = workflow.clarifying_questions || [];
    return (
      <div className="space-y-lg">
        <Card elevation="medium" padding="xl">
          <h2 className="text-headline-md font-headline-md text-primary mb-md">
            A few questions before drafting
          </h2>
          {questions.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              No clarifying questions — continue to generate your drafts.
            </p>
          ) : (
            <div className="space-y-md">
              {questions.map((q, i) => (
                <div key={i}>
                  <label className="block text-body-md text-on-surface mb-xs">
                    {i + 1}. {q}
                  </label>
                  <textarea
                    value={answers[i] || ''}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setAnswers(next);
                    }}
                    className="w-full min-h-[64px] p-sm bg-surface border
                               border-outline-variant rounded-lg text-body-sm
                               text-on-surface focus:outline-none
                               focus:border-secondary focus:ring-1
                               focus:ring-secondary resize-y"
                    placeholder="Your answer (optional)"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card elevation="small" padding="md">
          <div className="flex flex-col md:flex-row md:items-center gap-sm">
            <input
              value={questionFeedback}
              onChange={(e) => setQuestionFeedback(e.target.value)}
              className="flex-1 px-md py-sm bg-surface border border-outline-variant
                         rounded-lg text-body-sm text-on-surface placeholder:text-outline
                         focus:outline-none focus:border-secondary"
              placeholder="Want different questions? e.g. 'Focus on mobile'"
            />
            <Button variant="outline" size="sm" onClick={handleRegenerateQuestions}
                    disabled={busy}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Regenerate questions
            </Button>
          </div>
        </Card>

        <div className="flex flex-col md:flex-row gap-sm">
          <Button variant="primary" size="lg" onClick={handleSubmitAnswers}
                  disabled={busy} className="flex-1">
            Generate section drafts
          </Button>
          <Button variant="outline" size="lg" onClick={handleSkipQuestions}
                  disabled={busy}>
            Skip questions
          </Button>
        </div>
      </div>
    );
  };

  const renderSectionPane = () => {
    const content = workflow.drafts?.[activeTab] || '';
    return (
      <Card elevation="medium" padding="xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-headline-md font-headline-md text-primary">
            {SECTION_LABELS[activeTab]}
          </h2>
          <div className="flex gap-xs">
            <Button
              variant="outline" size="sm"
              onClick={() => {
                setEditing(!editing);
                setEditContent(content);
              }}
            >
              <span className="material-symbols-outlined text-[16px]">
                {editing ? 'close' : 'edit'}
              </span>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-md">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[280px] p-md bg-surface border border-outline-variant
                         rounded-lg text-body-sm text-on-surface font-code-md
                         focus:outline-none focus:border-secondary focus:ring-1
                         focus:ring-secondary resize-y"
            />
            <Button variant="primary" size="sm" onClick={handleSaveDraft} disabled={busy}>
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save section
            </Button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content || '_No content yet_'}</ReactMarkdown>
          </div>
        )}

        <div className="mt-lg pt-md border-t border-outline-variant">
          <label className="block text-label-caps font-label-caps
                            text-on-surface-variant uppercase tracking-widest mb-xs">
            Regenerate with feedback (optional)
          </label>
          <div className="flex flex-col md:flex-row gap-sm">
            <input
              value={sectionFeedback}
              onChange={(e) => setSectionFeedback(e.target.value)}
              className="flex-1 px-md py-sm bg-surface border border-outline-variant
                         rounded-lg text-body-sm text-on-surface placeholder:text-outline
                         focus:outline-none focus:border-secondary"
              placeholder="e.g. 'Add offline support requirements'"
            />
            <Button variant="secondary" size="sm" onClick={handleRegenerateSection}
                    disabled={busy}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Regenerate
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderDiagramPane = () => {
    const source = workflow.diagrams?.[activeDiagram];
    return (
      <Card elevation="medium" padding="xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-headline-md font-headline-md text-primary">
            {SECTION_LABELS[activeDiagram]} diagram
          </h2>
          <Button
            variant="outline" size="sm"
            onClick={() => {
              setEditingDiagram(!editingDiagram);
              setDiagramContent(source || '');
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {editingDiagram ? 'close' : 'edit'}
            </span>
            {editingDiagram ? 'Cancel' : 'Edit source'}
          </Button>
        </div>

        {!source ? (
          <p className="text-body-md text-on-surface-variant mb-md">
            No {SECTION_LABELS[activeDiagram].toLowerCase()} diagram yet — regenerate
            it below or it may have failed validation.
          </p>
        ) : editingDiagram ? (
          <div className="space-y-md">
            <textarea
              value={diagramContent}
              onChange={(e) => setDiagramContent(e.target.value)}
              className="w-full min-h-[220px] p-md bg-surface border border-outline-variant
                         rounded-lg text-body-sm text-on-surface font-code-md
                         focus:outline-none focus:border-secondary focus:ring-1
                         focus:ring-secondary resize-y"
            />
            <Button variant="primary" size="sm" onClick={handleSaveDiagram} disabled={busy}>
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save diagram
            </Button>
          </div>
        ) : (
          <MermaidDiagram code={source} />
        )}

        <div className="mt-lg pt-md border-t border-outline-variant">
          <label className="block text-label-caps font-label-caps
                            text-on-surface-variant uppercase tracking-widest mb-xs">
            Regenerate with feedback (optional)
          </label>
          <div className="flex flex-col md:flex-row gap-sm">
            <input
              value={diagramFeedback}
              onChange={(e) => setDiagramFeedback(e.target.value)}
              className="flex-1 px-md py-sm bg-surface border border-outline-variant
                         rounded-lg text-body-sm text-on-surface placeholder:text-outline
                         focus:outline-none focus:border-secondary"
              placeholder="e.g. 'Show the mobile client too'"
            />
            <Button variant="secondary" size="sm" onClick={handleRegenerateDiagram}
                    disabled={busy}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Regenerate
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderReview = () => {
    const tabs = [...SECTIONS.map((s) => ({ ...s, kind: 'section' })),
      { key: 'diagrams', label: 'Diagrams', kind: 'diagrams' }];
    return (
      <div className="space-y-lg">
        <div className="flex flex-wrap gap-xs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                resetEditors();
              }}
              className={`px-md py-sm rounded-lg text-label-caps font-label-caps
                          transition-colors ${
                activeTab === tab.key
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'diagrams' ? (
          <>
            <div className="flex flex-wrap gap-xs">
              {DIAGRAMS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    setActiveDiagram(d.key);
                    resetEditors();
                  }}
                  className={`px-sm py-xs rounded-lg text-body-sm transition-colors ${
                    activeDiagram === d.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {d.label}
                  {workflow.diagrams?.[d.key]
                    ? ''
                    : ' (missing)'}
                </button>
              ))}
            </div>
            {renderDiagramPane()}
          </>
        ) : (
          renderSectionPane()
        )}

        <Card elevation="small" padding="md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
            <div>
              <h3 className="text-body-md text-on-surface">Happy with the result?</h3>
              <p className="text-body-sm text-on-surface-variant">
                Finalize to save this PRD to your documents.
              </p>
            </div>
            <div className="flex gap-sm">
              <Button variant="outline" size="sm" onClick={handleStartOver} disabled={busy}>
                Start over
              </Button>
              <Button variant="primary" onClick={handleFinalize} disabled={busy}>
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                Finalize PRD
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // --- Main render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-lg">
        <h1 className="text-headline-lg font-headline-lg text-primary">
          {workflow ? 'Continue your PRD' : 'Create New PRD'}
        </h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
          A guided workflow: describe your idea, answer a few questions, review
          section drafts and diagrams, finalize.
        </p>
      </div>

      {stepIndicator}
      {busyOverlay}
      {errorBanner}

      {!workflow && renderIntake()}
      {workflow?.current_step === 'clarify' && renderClarify()}
      {workflow?.current_step === 'review' && renderReview()}
    </div>
  );
}

export default NewPRDPage;
