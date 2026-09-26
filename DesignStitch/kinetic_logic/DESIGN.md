---
name: Kinetic Logic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4e6073'
  primary: '#162839'
  on-primary: '#ffffff'
  primary-container: '#2c3e50'
  on-primary-container: '#96a9be'
  inverse-primary: '#b5c8df'
  secondary: '#00677d'
  on-secondary: '#ffffff'
  secondary-container: '#50d9fe'
  on-secondary-container: '#005c70'
  tertiary: '#0c008e'
  on-tertiary: '#ffffff'
  tertiary-container: '#221eb5'
  on-tertiary-container: '#9b9eff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4fb'
  primary-fixed-dim: '#b5c8df'
  on-primary-fixed: '#091d2e'
  on-primary-fixed-variant: '#36485b'
  secondary-fixed: '#b3ebff'
  secondary-fixed-dim: '#4cd6fb'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  sidebar-width: 280px
  container-max: 1280px
---

## Brand & Style

The design system is engineered for high-stakes technical environments where clarity is synonymous with trust. It targets Product Managers and Engineers who require a high-density, low-friction interface to manage complex documentation.

The visual style is **Corporate Modern with a Technical Edge**. It prioritizes systematic alignment, precise geometry, and functional aesthetics. The emotional response should be one of "controlled power"—the UI feels like a high-performance tool that handles complexity without overwhelming the user. It avoids unnecessary decoration, instead finding sophistication through perfect balance, purposeful whitespace, and refined typography.

## Colors

The palette is anchored by **Professional Slate (#2C3E50)**, providing a stable, authoritative foundation for headers and primary navigation. The **Electric Blue (#00B4D8)** accent is reserved strictly for primary actions and "active" states, ensuring high signal-to-noise ratio.

- **Backgrounds:** Utilize `neutral-50` (#F8FAFC) for the main application canvas to reduce eye strain, while using pure white (#FFFFFF) for cards and content containers to create subtle depth.
- **Semantic Logic:**
    - **Success:** Emerald 600 (#059669) for authorized states and completed PRD cycles.
    - **Error:** Rose 600 (#E11D48) for security alerts and failed validations.
    - **Warning:** Amber 500 (#D97706) for pending reviews or draft statuses.

## Typography

This design system uses **Inter** for all UI and prose elements to maintain a neutral, highly legible workspace. **JetBrains Mono** is introduced for technical identifiers, version numbers, and metadata, signaling a developer-friendly environment.

- **Headlines:** Use tighter letter-spacing and semi-bold weights to create a strong visual hierarchy.
- **Body:** Standardized at 16px for PRD content to ensure long-form readability.
- **Labels:** Uppercase labels with slight tracking are used for section headers within the sidebar and data table headers.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid hybrid model**. A fixed-width sidebar (280px) provides persistent navigation, while the main content area occupies a fluid space with a maximum cap of 1280px to prevent excessive line lengths in documentation.

- **Grid:** A 12-column grid is used for dashboard layouts. Data tables should span the full width of their container.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Mobile Adaptivity:** On mobile, the sidebar collapses into a bottom-anchored navigation bar or a hamburger menu. Margins reduce from 32px (desktop) to 16px (mobile).

## Elevation & Depth

To maintain a clean, engineering-focused look, this design system avoids heavy shadows. Instead, it uses **Tonal Layering** and **Low-Contrast Outlines**.

- **Surface Levels:** 
  - Level 0 (Background): `neutral-50` (#F8FAFC).
  - Level 1 (Cards/Workspaces): White (#FFFFFF) with a 1px border of `neutral-200` (#E2E8F0).
  - Level 2 (Modals/Popovers): White with a very soft, diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)).
- **Interactions:** Hover states on interactive rows or cards should result in a slight background shift to `neutral-100` rather than a shadow increase.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a subtle modern touch without sacrificing the professional, "square" rigor expected in technical tools.

- **Small Components:** Checkboxes and small tags use 4px (`rounded-sm`).
- **Standard Components:** Buttons and Input fields use 4px (`rounded-md`).
- **Large Components:** Modals and main content containers use 8px (`rounded-lg`) to differentiate the primary workspace from the background.

## Components

### Buttons
- **Primary:** Solid `secondary-color` (Electric Blue) with white text. High-contrast, no gradient.
- **Secondary:** Transparent with `primary-color` (Slate) border and text.
- **Ghost:** No border, Slate text, used for low-priority sidebar actions.

### Data Tables
- **Header:** `neutral-100` background, `label-caps` typography.
- **Cells:** `body-sm` typography, 12px vertical padding for high density.
- **Status Indicators:** Small dots (8px) paired with text labels using semantic colors.

### Input Fields
- Use a "Label over Field" layout. Border color `neutral-300` shifts to `secondary-color` on focus. Use JetBrains Mono for technical ID fields.

### Sidebar
- Dark themed (`primary-color` background) to provide a strong visual anchor. Active states should use a left-aligned 4px Electric Blue border accent.

### Status Indicators (Auth/Security)
- Use "Pill" style chips with a subtle background tint (10% opacity of the semantic color) and bold text of the same hue.