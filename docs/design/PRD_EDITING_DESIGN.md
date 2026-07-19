# PRD Inline Editing & Project Cleanup Design

**Date:** 2025-01-19  
**Project:** GTPlanner  
**Goal:** Add PRD editing capability and clean up project structure

## Overview

This design adds inline editing functionality to GTPlanner's PRD detail page and performs project cleanup to remove unused files. The editing system uses a minimal inline approach with manual save controls, matching the current studio aesthetic.

## Current State Analysis

### What Works
- ✅ PRDs are properly stored in database via `/api/prd/generate`
- ✅ Dashboard displays all stored PRDs in card layout  
- ✅ PRD detail page shows full content
- ✅ Delete functionality exists with confirmation
- ✅ Backend has complete CRUD operations (GET, PUT, DELETE)
- ✅ Authentication system working correctly

### What's Missing
- ❌ No editing capability for existing PRDs
- ❌ Project has accumulated unused files causing confusion
- ❌ Update endpoint exists but not exposed in UI

## Design Approach: Minimal Inline Editing

### User Interface Design

**Edit Mode Toggle**
- Add "Edit" button next to existing "Delete" button
- When clicked, page enters "edit mode" with these changes:
  - Title becomes editable input field
  - PRD content becomes textarea with markdown support
  - Tech stack fields become editable inputs  
  - "Edit" button changes to "Cancel"
  - "Save" button appears (green, primary action)
  - "Delete" button hidden during editing

**Editing Interface**
- **Title editing:** Text input, pre-filled with current title
- **Content editing:** Large textarea with markdown hint, pre-filled with current content
- **Tech stack editing:** Individual inputs for frontend/backend/database/devops
- **Save/Cancel actions:**
  - Save calls API and shows "Saving..." state
  - Cancel reverts changes and exits edit mode
  - Both return to view mode

**Visual Feedback**
- Edit mode has subtle background color change
- Save button shows loading spinner during API call
- Success message appears briefly after save ("PRD updated successfully")
- Error message appears if save fails

### Component Structure

**Files to Create:**
- `web_simple/src/components/PRDEditForm.jsx` - Reusable edit form component

**Files to Modify:**
- `web_simple/src/pages/PRDDetailPage.jsx` - Add edit mode and state management
- `web_simple/src/services/api.js` - Add `updateDocument(id, data)` method

### Data Flow & State Management

**State Variables:**
```javascript
const [editMode, setEditMode] = useState(false)
const [editData, setEditData] = useState({
  title: '',
  content: '',
  tech_stack: {}
})
const [isSaving, setIsSaving] = useState(false)
const [saveError, setSaveError] = useState('')
```

**API Integration:**
- Load: GET `/api/documents/{id}` (already implemented)
- Save: PUT `/api/documents/{id}` (backend exists, needs frontend integration)
- Success: Show success message, exit edit mode, refresh PRD data
- Error: Show error message, remain in edit mode

**Edit Flow:**
1. User clicks "Edit" button
2. Page enters edit mode, form pre-filled with current data
3. User makes changes to title, content, or tech stack
4. User clicks "Save" → API call → Success message → Return to view mode
5. User clicks "Cancel" → Revert changes → Return to view mode

## Project Cleanup Strategy

### Phase 1: File Analysis

**Identify Active Files:**
- Scan project for imports/references using grep/find
- Mark files that are actively used
- Identify unused/archived files

**Active Structure (Keep):**
```
web_simple/src/
├── components/ (Layout, ProtectedRoute, etc.)
├── pages/ (Dashboard, NewPRD, PRDDetail)
├── services/ (api.js, authStore.js)
└── main.jsx

gtplanner_backend_simple/
├── api/ (auth, documents, prd)
├── services/ (auth_service, document_service)
├── models/ (user, document, schemas)
└── main.py
```

**Files to Review/Archive:**
- `archive/2026-07-12_pre-simplification/` - Keep as-is, already archived
- `tests/fixtures/` - Review test HTML files
- Any duplicate components or old documentation
- `.claude/commands/` - Review if needed

### Phase 2: Archive Strategy

**Archive Process:**
1. Create timestamped archive directories: `archive/cleanup-2025-01-19/`
2. Move (not delete) files that might be needed later
3. Create `ARCHIVE_NOTES.md` documenting what was moved and why
4. Keep main project structure clean and focused

**Archive Documentation:**
```markdown
# Archive Notes - 2025-01-19 Cleanup

## Archived Files
- `tests/fixtures/test_chat.html` - Old test fixture, not used in current tests
- [Additional files as identified]

## Reason for Archive
Project cleanup to remove confusion around unused files while preserving them for potential future reference.

## Active Files
All files in `web_simple/src/` and `gtplanner_backend_simple/` are actively used.
```

## Implementation Plan

### Phase 1: Project Cleanup (1-2 hours)
1. Scan project structure and identify active vs unused files
2. Create archive directory and documentation
3. Move unused files to archive
4. Verify project still works after cleanup

### Phase 2: PRD Editing Implementation (2-3 hours)
1. **Backend Verification**
   - Test PUT `/api/documents/{id}` endpoint works correctly
   - Verify user authorization on update operations

2. **Frontend Components**
   - Create `PRDEditForm.jsx` component
   - Add edit mode state to `PRDDetailPage.jsx`
   - Implement save/cancel handlers
   - Add visual feedback (loading states, error messages)

3. **API Integration**
   - Add `updateDocument()` method to `api.js`
   - Handle success/error responses
   - Update React Query cache after successful save

4. **Testing**
   - Test edit mode toggle
   - Test save functionality with various data changes
   - Test cancel functionality
   - Verify database persistence
   - Test error handling (network errors, validation failures)

### Phase 3: Validation (30 minutes)
1. Start both backend and frontend servers
2. Create test PRD
3. Edit PRD (title, content, tech stack)
4. Save and verify changes persist
5. Test cancel button reverts changes
6. Test error handling

## Success Criteria

### File Cleanup
- ✅ Only actively-used files remain in main directories
- ✅ Archived files are documented in `ARCHIVE_NOTES.md`
- ✅ Project structure is clear and navigable
- ✅ Application still works after cleanup

### PRD Editing
- ✅ Can edit PRD title, content, and tech stack inline
- ✅ Save/cancel buttons work correctly
- ✅ Changes persist to database
- ✅ Clean UI that matches current studio design
- ✅ Proper error handling and user feedback
- ✅ Edit mode can be entered/exited cleanly

## Technical Details

### API Contract

**Update PRD:**
```
PUT /api/documents/{id}
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated Title",
  "content": "Updated markdown content",
  "tech_stack": {...},  // optional
  "recommendations": {...} // optional
}
Response: 200 OK with updated document
Error: 404 if not found or doesn't belong to user
```

### Component Props (PRDEditForm)
```javascript
<PRDEditForm
  initialData={{
    title: string,
    content: string,
    tech_stack: object
  }}
  onSave={(data) => void}
  onCancel={() => void}
  isSaving={boolean}
/>
```

### State Management (PRDDetailPage)
```javascript
const [editMode, setEditMode] = useState(false)
const [editData, setEditData] = useState({
  title: prdData?.title || '',
  content: prdData?.content || '',
  tech_stack: prdData?.tech_stack || {}
})
```

## Edge Cases & Error Handling

### Scenarios to Handle
1. **Concurrent edits:** User edits while another update occurs
   - Solution: Refresh data on save, show conflict message
   
2. **Network failure during save:**
   - Solution: Show error message, keep user in edit mode with changes intact
   
3. **Validation failures:**
   - Solution: Backend validates required fields, returns 400 with error details
   
4. **Unauthorized access:**
   - Solution: Backend returns 404, frontend shows "not found" message
   
5. **Large content editing:**
   - Solution: Textarea handles large content, no size limits

## Testing Checklist

- [ ] File cleanup completed and documented
- [ ] Can enter edit mode from detail page
- [ ] Title field is editable and pre-filled
- [ ] Content textarea is editable and pre-filled
- [ ] Tech stack fields are editable and pre-filled
- [ ] Save button shows loading state during API call
- [ ] Successful save shows success message and exits edit mode
- [ ] Cancel button reverts changes and exits edit mode
- [ ] Changes persist to database after save
- [ ] Error handling works for network failures
- [ ] Error handling works for validation failures
- [ ] Edit mode can be toggled multiple times
- [ ] Multiple PRDs can be edited independently

## Future Enhancements (Out of Scope)

- Auto-save functionality with debouncing
- Version history for PRD changes
- Collaboration features (comments, sharing)
- Export PRD to PDF/Word
- Advanced markdown editor with preview
- AI-assisted content improvement
- Bulk operations on multiple PRDs