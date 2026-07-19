# Enhanced PRD Workspace Design - Progress Indicators & Multi-Format Export

**Date:** 2025-01-19  
**Project:** GTPlanner  
**Goal:** Add progress indicators, interactive navigation, and multi-format download (.md + JSON) for PRD documents

## Overview

This design enhances the GTPlanner PRD generation experience with real-time progress feedback, interactive navigation menus, and flexible export options that support both human users and AI agents.

## Current State

### What Exists
- ✅ Basic PRD generation form (`NewPRDPage.jsx`)
- ✅ Simple loading state with spinner
- ✅ Basic navigation header (Dashboard, New PRD links)
- ✅ PRD display in dashboard cards and detail page
- ✅ Existing API returns structured JSON data
- ✅ OpenAI API integration for PRD generation

### What's Missing
- ❌ No detailed progress indicators during generation
- ❌ No interactive menu navigation
- ❌ No download functionality (export to .md or JSON)
- ❌ Limited agent-friendly export options
- ❌ Single download trigger point

## Design Approach: Enhanced PRD Workspace

### Core Features
1. **Progress Bar System** - Real-time feedback during PRD generation
2. **Interactive Navigation** - Dropdown menu with common actions
3. **Multi-Format Download** - Export to both .md and JSON formats
4. **Agent Integration** - Structured JSON format for AI agent processing

## User Interface Design

### Progress Bar Component

**Location:** `NewPRDPage.jsx` (PRD generation page)

**Visual Design:**
- Horizontal progress bar spanning form width
- Smooth transitions between progress stages
- Percentage indicator (0%, 25%, 50%, 75%, 100%)
- Status text below progress bar

**Progress Stages:**
- **0-20%:** "Connecting to AI service..."
- **20-40%:** "Analyzing your requirements..."
- **40-70%:** "Generating PRD structure..."
- **70-90%:** "Building tech stack recommendations..."
- **90-100%:** "Finalizing document..."

**States:**
- **Inactive:** Hidden before generation starts
- **Active:** Visible during generation with animated progress
- **Complete:** Shows success briefly, then navigates to result
- **Error:** Red progress bar with error message and retry option

### Dropdown Menu Component

**Location:** `Layout.jsx` (header navigation)

**Menu Structure:**
```
┌─────────────────────────┐
│ GTPlanner        ▼     │
├─────────────────────────┤
│ • Dashboard             │
│ • New PRD               │
│ • Export PRD    ▼       │
│   ├─ Download .md       │
│   └─ Download .json     │
│ • Settings              │
│ • Help                  │
│ ─────────────────────── │
│ user@email.com          │
│ [Logout]                │
└─────────────────────────┘
```

**Menu Behavior:**
- **Trigger:** Hover or click on menu icon
- **Context-sensitive:** "Export PRD" submenu only shows on PRD detail pages
- **Auto-close:** Closes after action selection or outside click
- **Mobile-responsive:** Adapts layout for smaller screens

### Download Buttons

**Dashboard Cards:**
- Small download icon (⬇️) on right side of each PRD card
- Hover reveals two mini-buttons: "Download .md" and "Download .json"
- Direct download - no confirmation dialogs

**Detail Page Header:**
- "Export" button next to Edit/Delete buttons
- Dropdown with format options: "Download as Markdown" and "Download as JSON"
- Icon indicators for file types

**Visual Feedback:**
- Brief "Downloading {filename}..." toast notification
- Success confirmation: "Downloaded {filename}"
- Error handling: "Download failed - please try again"

## Progress System Design

### State Management

**Component State (NewPRDPage.jsx):**
```javascript
const [progressState, setProgressState] = useState({
  progress: 0,           // 0-100
  status: '',            // Current stage text
  isGenerating: false,   // Overall generation state
  currentStage: 0,       // Current stage index
  error: null            // Error message if failed
});
```

### Progress Simulation Logic

Since OpenAI API doesn't provide real-time progress callbacks, we use **staged simulation**:

**Stages Configuration:**
```javascript
const progressStages = [
  { progress: 20, status: "Connecting to AI service...", delay: 2000 },
  { progress: 40, status: "Analyzing your requirements...", delay: 4000 },
  { progress: 70, status: "Generating PRD structure...", delay: 6000 },
  { progress: 90, status: "Building tech stack recommendations...", delay: 4000 },
  { progress: 100, status: "Finalizing document...", delay: 2000 }
];
```

**Timing Strategy:**
- Total estimated time: 18-24 seconds (sum of delays)
- Smooth transitions between stages
- **Early completion:** If API returns early, jump immediately to 100%
- **Late completion:** If API takes longer, extend final stage

### Error Handling

**API Errors:**
- Progress bar turns red (#EF4444)
- Status message: "Generation failed: {error}"
- Show "Try Again" button
- Keep form data intact for retry

**Network Issues:**
- Detect timeout or connection loss
- Show "Connection interrupted" message
- Offer "Retry" or "Start Over" options

**Validation Errors:**
- Immediate feedback (before progress starts)
- Show specific validation errors
- Don't start progress simulation until valid

## Download System Design

### File Formats

#### **Markdown (.md) Format**

**Content Structure:**
```markdown
# {PRD Title}

**Generated:** {YYYY-MM-DD HH:MM:SS} UTC  
**Word Count:** {count} words  
**PRD ID:** {id}

## Summary

{PRD summary content}

## Requirements

- {requirement 1}
- {requirement 2}
- {requirement 3}

## Technology Stack

### Frontend
- {tech 1}
- {tech 2}

### Backend
- {tech 1}
- {tech 2}

### Database
- {tech 1}
- {tech 2}

### DevOps
- {tech 1}
- {tech 2}

**Rationale:** {tech stack rationale}

## Infrastructure Recommendations

### Hardware Specifications
- **CPU:** {cpu_cores}
- **RAM:** {ram}
- **Disk:** {disk_space}

### Cloud Providers
{provider list with costs}

### Architecture
{architecture description}

### Data Stack
{data stack recommendations}

## Implementation Plan

1. {phase 1}
2. {phase 2}
3. {phase 3}

## Success Metrics

- {metric 1}
- {metric 2}
- {metric 3}
```

**Filename Format:** `prd-{sanitized-title}-{YYYY-MM-DD}-{id}.md`

#### **JSON Format**

**Structure:** Exact match to current `PRDResponse` schema

```json
{
  "id": 123,
  "title": "Project Title",
  "content": "Full markdown content",
  "tech_stack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL"],
    "devops": ["Docker", "Kubernetes"],
    "rationale": "Explanation of choices"
  },
  "recommendations": {
    "hardware_specs": { ... },
    "cloud_providers": [ ... ],
    "architecture": "Description",
    "data_stack": "Description",
    "estimated_cost": "Cost estimate"
  },
  "created_at": "2025-01-19T10:30:00Z",
  "updated_at": "2025-01-19T15:45:00Z"
}
```

**Filename Format:** `prd-{sanitized-title}-{YYYY-MM-DD}-{id}.json`

**Characteristics:**
- Pretty-printed with 2-space indentation
- UTF-8 encoding for international characters
- ISO 8601 timestamps
- Consistent data types (strings, arrays, objects)

### Download Implementation

**Client-Side Generation:**
```javascript
// Markdown generation
const generateMarkdown = (prd) => {
  const date = new Date().toISOString();
  const wordCount = prd.content.split(/\s+/).length;
  
  return `# ${prd.title}\n\n**Generated:** ${date}\n**Word Count:** ${wordCount}\n**PRD ID:** ${prd.id}\n\n${prd.content}`;
};

// JSON generation
const generateJSON = (prd) => {
  return JSON.stringify(prd, null, 2); // Pretty-printed
};
```

**Download Trigger:**
```javascript
const downloadFile = (content, filename, mimeType) => {
  // Create blob
  const blob = new Blob([content], { type: mimeType });
  
  // Create temporary URL
  const url = URL.createObjectURL(blob);
  
  // Create and trigger download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // Show feedback
  showToast(`Downloaded ${filename}`);
};
```

**Filename Sanitization:**
```javascript
const sanitizeFilename = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Spaces to hyphens
    .substring(0, 50);         // Limit length
};
```

## Agent Integration Design

### Structured Data Access

**API Endpoint (Already Exists):**
```
GET /api/documents/{id}
Response: {PRDResponse} (structured JSON)
```

**Agent Usage Patterns:**

**1. Direct API Query:**
```python
import requests

# Get PRD data
response = requests.get(
  'http://localhost:11211/api/documents/123',
  headers={'Authorization': 'Bearer {token}'}
)

prd_data = response.json()
# Process structured PRD data
```

**2. JSON Download Processing:**
```python
import json

# Load downloaded JSON file
with open('prd-project-name-2025-01-19-123.json', 'r') as f:
    prd = json.load(f)

# Access structured data
requirements = prd['requirements']
tech_stack = prd['tech_stack']
```

### Agent-Friendly Features

**Predictable Structure:**
- Consistent field names across all PRDs
- No nested conditional fields
- Required fields always present
- Optional fields have consistent types

**Data Completeness:**
- All PRD sections included in JSON
- No truncation or summarization
- Full tech stack details
- Complete infrastructure recommendations

**Parsing Simplicity:**
- Flat structure where possible
- Arrays for lists (easy iteration)
- ISO 8601 timestamps (standard parsing)
- UTF-8 encoding (international support)

## Component Structure

### New Components

**ProgressBar.jsx**
```javascript
/**
 * Reusable progress bar component
 */
function ProgressBar({ progress, status, error }) {
  // Renders horizontal progress bar with status text
  // Handles error states with red color
  // Smooth CSS transitions
}
```

**DropdownMenu.jsx**
```javascript
/**
 * Interactive dropdown navigation menu
 */
function DropdownMenu({ items, position }) {
  // Renders dropdown with icon trigger
  // Handles hover/click interactions
  // Context-sensitive menu items
}
```

**DownloadButton.jsx**
```javascript
/**
 * Download functionality component
 */
function DownloadButton({ prd, formats, onDownload }) {
  // Renders download button with format options
  // Handles file generation and download
  // Shows download feedback
}
```

**ExportMenu.jsx**
```javascript
/**
 * Export format selector menu
 */
function ExportMenu({ prd, trigger }) {
  // Renders format selection dropdown
  // Offers .md and .json options
  // Triggers appropriate download handler
}
```

### Modified Components

**Layout.jsx**
- Add `DropdownMenu` component to header
- Replace simple nav links with dropdown system
- Maintain current studio aesthetic

**NewPRDPage.jsx**
- Add `ProgressBar` component
- Implement progress simulation logic
- Add error states and retry functionality
- Keep current form structure intact

**DashboardPage.jsx**
- Add download buttons to PRD cards
- Implement hover or always-visible download icons
- Handle download feedback (toast notifications)

**PRDDetailPage.jsx**
- Add export functionality to header actions
- Integrate `ExportMenu` component
- Add download handlers for both formats

### File Organization

```
web_simple/src/
├── components/
│   ├── Layout.jsx (MODIFY - add dropdown)
│   ├── ProgressBar.jsx (NEW)
│   ├── DropdownMenu.jsx (NEW)
│   ├── DownloadButton.jsx (NEW)
│   ├── ExportMenu.jsx (NEW)
│   ├── ProtectedRoute.jsx (unchanged)
│   └── PRDEditForm.jsx (unchanged)
├── pages/
│   ├── DashboardPage.jsx (MODIFY - add downloads)
│   ├── NewPRDPage.jsx (MODIFY - add progress)
│   ├── PRDDetailPage.jsx (MODIFY - add export)
│   ├── LoginPage.jsx (unchanged)
│   └── App.jsx (unchanged)
├── services/
│   ├── api.js (MODIFY - add download helpers)
│   └── authStore.js (unchanged)
└── styles/
    └── (add new component styles)
```

## Data Flow

### PRD Generation Flow with Progress

```
User submits form
    ↓
Set progress state: { progress: 0, status: 'Starting...', isGenerating: true }
    ↓
Start progress simulation
    ↓
Stage 1: Update progress to 20%, status: "Connecting to AI service..."
    ↓
Wait 2 seconds (simulate API connection)
    ↓
Stage 2: Update progress to 40%, status: "Analyzing your requirements..."
    ↓
Wait 4 seconds (simulate analysis)
    ↓
Stage 3: Update progress to 70%, status: "Generating PRD structure..."
    ↓
Call OpenAI API (actual work happening here)
    ↓
If API returns early: Jump to 100%
If API takes longer: Extend final stage
    ↓
Stage 4: Update progress to 90%, status: "Building tech stack recommendations..."
    ↓
Wait 4 seconds (simulate tech stack processing)
    ↓
Stage 5: Update progress to 100%, status: "Finalizing document..."
    ↓
Wait 2 seconds (finalization)
    ↓
API response received
    ↓
Parse response, create PRD in database
    ↓
Navigate to PRD detail page
    ↓
Show success message
```

### Download Flow

```
User clicks download button
    ↓
Check format (md or json)
    ↓
Get current PRD data from props/query
    ↓
Generate file content:
  - Markdown: Format with headers, sections, metadata
  - JSON: Stringify existing PRD data
    ↓
Sanitize filename from PRD title
    ↓
Add date and ID to filename
    ↓
Create blob with appropriate MIME type
    ↓
Create temporary object URL
    ↓
Create invisible <a> element
    ↓
Trigger browser download
    ↓
Show "Downloaded {filename}" toast
    ↓
Clean up temporary URL
```

### Dropdown Navigation Flow

```
User hovers/clicks menu icon
    ↓
Show dropdown menu with items
    ↓
User hovers over "Export PRD"
    ↓
Show submenu: "Download .md", "Download .json"
    ↓
User clicks download option
    ↓
Execute download flow (above)
    ↓
Close dropdown menu
    ↓
Show download confirmation toast
```

## Implementation Details

### Progress Simulation Implementation

**Stage Management:**
```javascript
const useProgressSimulation = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const startProgress = async (apiCall) => {
    const stages = [
      { progress: 20, status: "Connecting to AI service...", delay: 2000 },
      { progress: 40, status: "Analyzing your requirements...", delay: 4000 },
      { progress: 70, status: "Generating PRD structure...", delay: 6000 },
      { progress: 90, status: "Building tech stack recommendations...", delay: 4000 },
      { progress: 100, status: "Finalizing document...", delay: 2000 }
    ];
    
    let currentStage = 0;
    
    // Process each stage
    const processStage = async () => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setProgress(stage.progress);
        setStatus(stage.status);
        
        await new Promise(resolve => setTimeout(resolve, stage.delay));
        currentStage++;
        await processStage();
      }
    };
    
    // Start simulation
    processStage();
    
    // Run actual API call in parallel
    try {
      const result = await apiCall();
      setProgress(100); // Jump to completion
      setStatus("Complete!");
      return result;
    } catch (error) {
      setProgress(0); // Reset on error
      setStatus(`Error: ${error.message}`);
      throw error;
    }
  };
  
  return { startProgress, progress, status };
};
```

### File Naming Convention

**Sanitization Rules:**
- Convert to lowercase
- Remove special characters except hyphens
- Replace spaces with hyphens
- Limit to 50 characters
- Append date and ID

**Examples:**
- Input: "E-commerce Platform Redesign"
- Output: `prd-ecommerce-platform-redesign-2025-01-19-123.md`

### Download Handler Implementation

**Service Layer:**
```javascript
// api.js additions
export const downloadHelpers = {
  generateMarkdown: (prd) => {
    const date = new Date().toISOString();
    const wordCount = prd.content?.split(/\s+/).filter(w => w.length > 0).length || 0;
    
    let markdown = `# ${prd.title}\n\n`;
    markdown += `**Generated:** ${date}\n`;
    markdown += `**Word Count:** ${wordCount}\n`;
    markdown += `**PRD ID:** ${prd.id}\n\n`;
    markdown += `${prd.content}\n\n`;
    
    if (prd.requirements?.length) {
      markdown += `## Requirements\n\n`;
      prd.requirements.forEach(req => {
        markdown += `- ${req}\n`;
      });
      markdown += `\n`;
    }
    
    if (prd.tech_stack) {
      markdown += `## Technology Stack\n\n`;
      // Add tech stack details
    }
    
    if (prd.recommendations) {
      markdown += `## Infrastructure Recommendations\n\n`;
      // Add infrastructure details
    }
    
    return markdown;
  },
  
  generateJSON: (prd) => {
    return JSON.stringify(prd, null, 2);
  },
  
  sanitizeFilename: (title, id) => {
    const sanitized = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const date = new Date().toISOString().split('T')[0];
    return `${sanitized}-${date}-${id}`;
  },
  
  downloadFile: (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
```

## Error Handling

### Progress Errors

**API Connection Errors:**
- Set progress bar to red color
- Show status: "Connection failed - retrying..."
- Automatic retry after 3 seconds
- Max 3 retry attempts before giving up

**API Response Errors:**
- Parse error message from API response
- Show user-friendly error: "Generation failed: {reason}"
- Keep form data intact for retry
- Highlight specific form fields if validation error

**Timeout Errors:**
- Detect requests taking > 60 seconds
- Show: "Taking longer than expected..."
- Offer: "Wait longer" or "Cancel" options

### Download Errors

**File Generation Errors:**
- Catch malformed PRD data
- Show: "Unable to generate file - PRD data incomplete"
- Don't trigger download

**Browser Download Errors:**
- Detect if download was blocked by browser
- Show: "Download blocked - please check browser permissions"
- Offer alternative: "Copy to clipboard" option

**Large File Handling:**
- Warn if file > 1MB: "Large file - may take longer to download"
- Split large downloads into chunks if needed

## Success Criteria

### Progress Indicators
- ✅ Progress bar appears during PRD generation
- ✅ Shows percentage (0-100%) during generation
- ✅ Status text changes meaningfully through stages
- ✅ Smooth transitions between progress stages
- ✅ Completes (100%) when API returns
- ✅ Shows appropriate error states
- ✅ Provides retry functionality

### Download Functionality
- ✅ Can download PRD as .md file
- ✅ Can download PRD as .json file
- ✅ Download works from dashboard cards
- ✅ Download works from detail page
- ✅ Download works from menu
- ✅ Files have proper naming convention
- ✅ Files contain complete PRD data
- ✅ Shows download confirmation feedback

### Navigation
- ✅ Dropdown menu appears on hover/click
- ✅ Menu shows all expected options
- ✅ Export submenu appears on PRD pages only
- ✅ Menu actions work correctly
- ✅ Menu closes after action selection

### Agent Integration
- ✅ JSON format matches API response schema
- ✅ JSON is properly formatted and parseable
- ✅ Required fields always present
- ✅ Consistent data types across PRDs
- ✅ Agents can query API for structured data
- ✅ Agents can process downloaded JSON files

## Technical Specifications

### Component Props

**ProgressBar:**
```javascript
<ProgressBar
  progress={number}        // 0-100
  status={string}          // Current status text
  error={string|null}      // Error message if failed
  complete={boolean}       // Show completion state
/>
```

**DropdownMenu:**
```javascript
<DropdownMenu
  items={Array}           // Menu items with labels, actions, icons
  position={'top'|'bottom'}
  context={string}        // Current page context
/>
```

**DownloadButton:**
```javascript
<DownloadButton
  prd={PRDObject}         // PRD data to export
  formats={['md'|'json']} // Available formats
  onDownload={function}   // Callback after download
/>
```

### CSS Considerations

**Progress Bar:**
- Smooth CSS transitions for progress width changes
- Color changes for error states
- Responsive width (mobile-friendly)

**Dropdown Menu:**
- Absolute positioning relative to trigger
- Z-index higher than page content
- Smooth fade-in/fade-out animations

**Download Buttons:**
- Hover effects on card buttons
- Active states during download
- Loading feedback if needed

## Implementation Phases

### Phase 1: Core Components (2-3 hours)
1. Create ProgressBar component
2. Create DropdownMenu component  
3. Create DownloadButton component
4. Create ExportMenu component
5. Add component styles

### Phase 2: Progress Integration (1-2 hours)
1. Modify NewPRDPage to use ProgressBar
2. Implement progress simulation logic
3. Add error states and retry
4. Test progress flow

### Phase 3: Navigation Integration (1 hour)
1. Modify Layout to use DropdownMenu
2. Configure menu items and actions
3. Test dropdown interactions
4. Verify context-sensitive behavior

### Phase 4: Download Integration (2 hours)
1. Modify DashboardPage to add download buttons
2. Modify PRDDetailPage to add export functionality
3. Implement file generation logic
4. Add download helpers to API service
5. Test all download flows

### Phase 5: Testing & Polish (1 hour)
1. End-to-end testing of complete flow
2. Test error scenarios
3. Verify agent JSON format
4. Mobile responsiveness testing
5. Performance optimization

**Total Estimated Time:** 6-8 hours

## Testing Checklist

### Progress System
- [ ] Progress bar appears when generation starts
- [ ] Progress updates through all stages
- [ ] Status text is meaningful and accurate
- [ ] Progress reaches 100% on completion
- [ ] Early completion jumps to 100% correctly
- [ ] Error states show red progress bar
- [ ] Retry functionality works correctly

### Download System
- [ ] Can download .md from dashboard card
- [ ] Can download .json from dashboard card
- [ ] Can download .md from detail page
- [ ] Can download .json from detail page
- [ ] Can download from menu dropdown
- [ ] Files have correct naming format
- [ ] Markdown file contains all PRD sections
- [ ] JSON file matches API schema
- [ ] Download confirmation appears
- [ ] Multiple downloads work correctly

### Navigation
- [ ] Dropdown menu appears on interaction
- [ ] Menu items are correctly labeled
- [ ] Export submenu shows on PRD pages only
- [ ] Menu actions navigate correctly
- [ ] Menu closes after action
- [ ] Works on mobile devices

### Agent Integration
- [ ] JSON format validates correctly
- [ ] All required fields present
- [ ] Data types are consistent
- [ ] Timestamps parse correctly
- [ ] Arrays are properly formatted
- [ ] File can be parsed by standard JSON parsers

## Future Enhancements (Out of Scope)

These are NOT in current design but could be added later:
- Real-time WebSocket progress from OpenAI streaming API
- Additional export formats (.pdf, .docx, .html)
- Bulk export (select multiple PRDs)
- Export customization UI
- Progress persistence across page refreshes
- Download history and re-download capability
- Email PRD export to recipients
- Version history in JSON format