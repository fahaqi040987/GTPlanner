/**
 * AI PRD Generator component
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prdGenerationService } from '../../services/prdGenerationService';
import { useWorkspaceStore } from '../../stores/workspaceStore';

function AIPRDGenerator({ workspaceId, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();

  const [formData, setFormData] = useState({
    description: '',
    language: 'en',
    context: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setProgress('Initializing AI generation...');
    setError(null);

    try {
      setProgress('Analyzing your requirements...');
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress('Generating PRD structure...');
      const response = await prdGenerationService.generateAndSavePRD(
        workspaceId,
        formData.description,
        formData.language,
        formData.context
      );

      setProgress('Finalizing and saving PRD...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (response.data) {
        const result = response.data;
        setProgress(`PRD "${result.prd_title}" created successfully!`);

        // Redirect to the new PRD
        setTimeout(() => {
          navigate(`/workspace/${workspaceId}/prd/${result.prd_id}`);
        }, 1000);

        if (onSuccess) onSuccess(result);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to generate PRD. Please try again.'
      );
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      description: template
    }));
  };

  const quickTemplates = {
    'E-commerce Platform': 'Build a modern e-commerce platform with user authentication, product catalog, shopping cart, payment integration, order management, and admin dashboard. Should support multiple payment gateways and have mobile-responsive design.',
    'Task Management App': 'Create a collaborative task management application with features like project organization, task assignment, progress tracking, file sharing, team communication, deadline reminders, and reporting analytics. Should integrate with popular calendar services.',
    'Social Media Dashboard': 'Develop a social media analytics dashboard that aggregates data from multiple platforms, provides engagement insights, scheduling tools, content performance tracking, influencer collaboration features, and automated reporting.',
    'Healthcare Portal': 'Design a secure healthcare patient portal with appointment scheduling, medical records access, prescription refills, telemedicine consultation, billing information, and secure messaging with healthcare providers. Must be HIPAA compliant.',
    'Learning Management System': 'Build an online learning platform with course creation tools, student enrollment, progress tracking, quiz/exam modules, certificate generation, discussion forums, and analytics dashgers for instructors and administrators.'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            AI-Powered PRD Generator
          </h2>
          <p className="text-gray-600">
            Describe your product in plain language, and GTPlanner AI will generate a comprehensive PRD for workspace: <span className="font-semibold text-indigo-600">{currentWorkspace?.name}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isGenerating && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Generating PRD...</p>
                <p className="text-xs text-indigo-700 mt-1">{progress}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(quickTemplates).map(([name, template]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleQuickTemplate(template)}
                  disabled={isGenerating}
                  className="px-3 py-2 text-left text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Product Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              disabled={isGenerating}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="Describe your product, its features, target users, and key requirements in natural language..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about features, target audience, and key requirements for better results.
            </p>
          </div>

          {/* Language Selection */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              Output Language
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              disabled={isGenerating}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>

          {/* Additional Context */}
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700">
              Additional Context (Optional)
            </label>
            <textarea
              id="context"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              rows={3}
              disabled={isGenerating}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="Any additional context, constraints, or specific requirements..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isGenerating || !formData.description.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0.012 0l4-4m4 4V12a8 8 0 018 8 0 0 000-8V0c5.373 0 0 00-4-4m4 4V12a8 8 0 018 8 0 0 000-8z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate PRD with AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIPRDGenerator;