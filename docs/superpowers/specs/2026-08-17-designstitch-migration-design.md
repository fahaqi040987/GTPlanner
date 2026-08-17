# GTPlanner DesignStitch Migration Design

**Date**: 2026-08-17  
**Project**: Complete Design System Migration from DesignStitch HTML Designs  
**Approach**: Clean Slate Implementation with Feature Parity

## Overview

This document outlines the complete migration of GTPlanner's web application to use the DesignStitch HTML designs. The migration will replace the current styling approach with a comprehensive design system based on TailwindCSS and Material Design tokens, while preserving all existing functionality.

## Design Goals

1. **Visual Consistency**: Implement pixel-perfect designs from DesignStitch directory
2. **Feature Parity**: Preserve all existing functionality (authentication, PRD editing, export, etc.)
3. **Clean Implementation**: Create fresh components mirroring DesignStitch HTML structure
4. **Modern Foundation**: Establish comprehensive design system for future development

## Section 1: Overall Architecture & Migration Strategy

### Migration Approach
Create a complete design system foundation based on DesignStitch, then rebuild each page with fresh components while migrating all existing business logic.

### Migration Phases
1. **Foundation Setup** - Install TailwindCSS, configure custom design tokens, fonts, and icon system
2. **Component Library Creation** - Build reusable components (buttons, cards, inputs, tables, etc.) that match DesignStitch patterns  
3. **Page Rebuilding** - Recreate each page from scratch using the new components, migrating state management and API calls
4. **Feature Integration** - Ensure all existing functionality (auth, PRD editing, export) works identically in the new design

### Technical Stack
- **Keep**: React, React Router, TanStack Query, Zustand state management
- **Add**: TailwindCSS with custom DesignStitch configuration
- **Add**: Material Symbols icon system
- **Keep**: FastAPI backend and all existing API endpoints

## Section 2: Component Design & Structure

### Design System Components (extracted from DesignStitch patterns)

#### Layout Components
- `AppShell` - Main app wrapper with navigation and content areas
- `SideNavBar` - Left navigation sidebar (from My Documents design)  
- `TopAppBar` - Top header bar with search and user actions
- `MainContent` - Content area wrapper

#### Form Components
- `InputField` - Styled input with label and focus states
- `Button` - Primary, secondary, and icon buttons with hover/active states
- `FormCard` - Card container for forms (from Secure Login design)

#### Data Display Components
- `DataTable` - Table component with hover states and pagination (from My Documents)
- `StatusBadge` - Colored status indicators (Draft/Published)
- `DocumentCard` - Document list item with actions

#### Navigation Components
- `NavBrand` - GTPlanner logo and branding
- `NavLink` - Active/inactive navigation links
- `UserMenu` - User profile dropdown

#### Specialized Components
- `SecureLoginCard` - Complete login form (from Secure Login)
- `DocumentList` - Document table with filters and pagination
- `ProfileCard` - User profile display and editing

### Component Philosophy
Each component will be self-contained with props for customization, matching the exact visual patterns from DesignStitch HTML.

## Section 3: Page-by-Page Implementation Plan

### Page Mapping (DesignStitch → Existing React Pages)

#### 1. Secure Login → LoginPage.jsx
- **Replace**: Current login form with DesignStitch Secure Login design
- **Preserve**: Authentication logic, JWT token handling, registration toggle
- **Add**: Security badge footer, enhanced visual design
- **Keep**: Error handling, form validation, navigation to dashboard

#### 2. My Documents → DashboardPage.jsx  
- **Replace**: Current dashboard with DesignStitch My Documents design
- **Preserve**: Document list data, pagination, filtering logic
- **Add**: Sidebar navigation, search bar, JWT status indicator
- **Keep**: API calls, document actions, navigation to detail pages

#### 3. Document Detail → PRDDetailPage.jsx
- **Replace**: Current detail view with DesignStitch Document Detail design  
- **Preserve**: PRD content, editing capabilities, export functionality
- **Add**: Enhanced layout with the new design system styling
- **Keep**: All existing PRD editing and export features

#### 4. User Profile → New ProfilePage.jsx
- **Create**: New page using DesignStitch User Profile design
- **Integrate**: With existing user authentication state
- **Add**: Profile viewing and editing capabilities
- **Link**: From sidebar navigation

#### 5. SettingsPage.jsx
- **Update**: With new design system components
- **Preserve**: Existing settings functionality

### Migration Priority
1. Login (LoginPage)
2. Dashboard (DashboardPage) 
3. Document Detail (PRDDetailPage)
4. Profile (ProfilePage)
5. Settings (SettingsPage)

## Section 4: State Management & Business Logic Migration

### State Preservation Strategy

#### Keep Existing State Management
- `authStore.js` - Authentication state (login, token, user data)
- All React Query hooks and mutations
- Local component state where appropriate

### Migration Approach
- Extract business logic from current components into reusable hooks
- Preserve all API calls and data fetching logic
- Maintain error handling and loading states
- Keep form validation logic

### Business Logic Extraction Example
```javascript
// Extract to useAuth hook for both old and new components
const useAuth = () => {
  // All authentication logic, API calls, error handling
}
```

### Key Preserved Features
- JWT authentication flow
- Document CRUD operations  
- PRD editing and versioning
- Export functionality (Markdown, PDF, etc.)
- User settings and preferences
- Navigation and routing logic

### Data Flow
API → TanStack Query → Component State → UI (unchanged)

## Section 5: Technical Implementation Details

### TailwindCSS Configuration

#### Install Required Packages
```bash
uv add tailwindcss @tailwindcss/forms @tailwindcss/container-queries
uv add material-symbols npm:@fontsource/inter npm:@fontsource/jetbrains-mono
```

#### Custom Design System Setup
- Extract complete Tailwind config from DesignStitch HTML
- All Material Design color tokens (primary, secondary, surface, etc.)
- Custom spacing scale, border radius values
- Typography families and sizes (Inter, JetBrains Mono)
- Material Symbols integration

### Project Structure Changes
```
web_simple/src/
├── components/
│   ├── design-system/        # NEW: Design system components
│   │   ├── Button.jsx
│   │   ├── InputField.jsx
│   │   ├── Card.jsx
│   │   └── ...
│   ├── layout/               # NEW: Layout components
│   │   ├── AppShell.jsx
│   │   ├── SideNavBar.jsx
│   │   └── TopAppBar.jsx
│   └── [existing components] # Keep/upgrade existing
├── pages/                    # Rebuild with new components
└── styles/
    ├── index.css            # NEW: Tailwind imports
    └── design-tokens.css    # NEW: Custom design tokens
```

### Development Workflow
1. Setup TailwindCSS and design system foundation
2. Create component library
3. Build pages one by one
4. Test functionality preservation at each step

## Section 6: Testing & Validation Strategy

### Testing Approach

#### Visual Regression Testing
- Compare new pages against DesignStitch screenshots for pixel-perfect accuracy
- Test responsive behavior at mobile, tablet, desktop breakpoints
- Validate dark mode support (if needed)

#### Functional Preservation Testing
- Run existing test suite after each page migration
- Manual testing of all user flows:
  - Login/logout functionality
  - Document creation, editing, deletion
  - Export functionality (Markdown, PDF)
  - Navigation between pages
  - User settings updates

#### Integration Testing
- API integration continues working with new UI
- State management functions correctly
- Form validation and error handling preserved
- Loading states and error messages display properly

#### Browser Testing
- Test in Chrome, Firefox, Safari
- Mobile responsive validation
- Accessibility check (keyboard navigation, screen readers)

### Validation Checklist (for each page)
- [ ] Visual design matches DesignStitch
- [ ] All existing features work
- [ ] Responsive design works
- [ ] No console errors
- [ ] API calls function correctly
- [ ] User flows preserved

## Section 7: Implementation Phases & Risk Management

### Implementation Timeline

#### Phase 1: Foundation (1-2 days)
- Setup TailwindCSS with DesignStitch configuration
- Install fonts and Material Symbols
- Create base design system components
- Setup project structure

#### Phase 2: Component Library (2-3 days)**  
- Build all reusable components
- Create component documentation
- Test components in isolation

#### Phase 3: Page Migration (5-7 days)
- Day 1-2: Login page migration
- Day 3-4: Dashboard page migration  
- Day 5-6: Document detail page migration
- Day 7: Profile and settings pages

#### Phase 4: Testing & Refinement (2-3 days)
- Full functional testing
- Visual regression testing
- Bug fixes and refinements
- Performance optimization

### Risk Mitigation
- **Backup**: Create branch before starting migration
- **Incremental**: Test after each page completion
- **Rollback**: Keep old components until migration is complete
- **Communication**: Document breaking changes for team

### Success Criteria
- All existing functionality preserved
- Visual design matches DesignStitch within 95% accuracy
- No performance degradation
- All tests pass

## DesignStitch Assets

### Available Designs
1. **gtplanner_secure_login** - Secure Login page with Material Design styling
2. **gtplanner_my_documents** - Dashboard with document list and sidebar navigation
3. **gtplanner_document_detail** - Document detail view with editing capabilities
4. **gtplanner_user_profile** - User profile page design

### Design System Characteristics
- Material Design color tokens and components
- TailwindCSS utility-first styling
- Material Symbols iconography
- Inter and JetBrains Mono typography
- Responsive design patterns
- Dark mode support infrastructure

## Implementation Notes

### Key Considerations
- All HTML designs are complete and functional
- Business logic extraction must be thorough
- Component reusability is critical for maintainability
- Testing at each phase prevents regression
- Visual consistency with DesignStitch is paramount

### Next Steps
1. Create implementation plan with detailed tasks
2. Setup development environment with new dependencies
3. Begin Phase 1: Foundation setup
4. Create component library
5. Execute page migrations in priority order
6. Comprehensive testing and refinement

---

**Design Status**: ✅ Approved  
**Next Phase**: Implementation Planning