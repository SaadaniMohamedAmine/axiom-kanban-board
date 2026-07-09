---
name: Axiom
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#2fd9f4'
  on-tertiary: '#00363e'
  tertiary-container: '#009fb4'
  on-tertiary-container: '#002f36'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#a2eeff'
  tertiary-fixed-dim: '#2fd9f4'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5a'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  h1-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  h3:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  mono:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
---

## Brand & Style
The design system is engineered for elite technical teams, adopting the persona of a **Discreet Premium Advisor**. The aesthetic is restrained and precise, prioritizing focus through high-contrast legibility and deep-space surfaces.

The visual style is **Corporate Modern with Glassmorphic accents**. It utilizes a near-black foundation with a 2-3% film grain texture to eliminate flat digital banding and provide a tactile, high-end feel. Interactive elements are defined by ambient glows and sharp geometric precision, creating an environment that feels both calm and technologically advanced.

## Colors
The palette is rooted in deep midnight tones to minimize eye strain during long engineering sprints. 

- **Primary (Electric Blue):** Reserved for core actions and active states.
- **AI Accents (Violet/Cyan):** Strictly reserved for AI-generated suggestions, confidence indicators, and automated insights. These should never be used for standard UI controls.
- **Contrast:** All text-on-background combinations must maintain a minimum 4.5:1 ratio (WCAG AA). Use the Primary Blue sparingly to maintain its "signal" value against the "noise" of the dark interface.

## Typography
This design system uses **Geist** for all UI elements to reflect a developer-centric, technical aesthetic. Tracking is tightened across all levels to create a "dense" professional feel.

- **Wordmark:** Sentence case "Axiom", Medium-Bold, -0.05em tracking.
- **Headlines:** Use tight tracking and semi-bold weights.
- **Code/Data:** Use JetBrains Mono for commit hashes, terminal outputs, and data values within the Kanban cards.

## Layout & Spacing
The system follows a strict **8px linear grid**. Components and layouts should always snap to increments of 8.

- **Desktop:** 12-column fluid grid with 24px margins. Content is often organized into a fixed left sidebar (260px) and a flexible main viewport.
- **Kanban:** Columns are 320px wide with 16px horizontal spacing.
- **Modals:** Centralized with a maximum width of 640px, utilizing a glassmorphic backdrop blur (12px) to maintain context of the background task.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** and **Glassmorphism**.

1.  **Level 0 (Base):** #0B0F19 with 2% noise.
2.  **Level 1 (Cards/Sidebar):** #131A2A with a 1px `border-subtle`.
3.  **Level 2 (Modals/Popovers):** #1A2236 with `backdrop-filter: blur(12px)` and a 1px `border-strong`.

**Glow Effects:**
- Primary CTAs feature a 20px Gaussian blur "under-glow" using the primary color at 15% opacity.
- AI Suggestions feature a peripheral violet or cyan glow (8px blur) to distinguish them from human-generated content.

## Shapes
The design system uses a dual-radius philosophy to balance container structure with control precision.

- **Containers (Cards, Modals, Panels):** Use `rounded-lg` (12px - 14px) to soften the large dark surfaces.
- **Controls (Buttons, Inputs, Pills):** Use a standard 8px radius for a sharper, more mechanical appearance.
- **Avatars:** Strictly circular geometric initials.

## Components

### Buttons & Inputs
- **Primary Button:** Solid #3B82F6 background with an ambient outer glow on hover. Text is white.
- **Secondary Button:** Ghost style with `border-subtle`. On hover, the border becomes `border-strong`.
- **Inputs:** Darker than the surface (#090D16), 1px subtle border, focusing to a 1px #3B82F6 ring.

### AI Suggestion Panels
Distinguished by a 1px gradient border (Violet to Cyan). Use a background of #1A2236 at 80% opacity with backdrop blur. Include a "Confidence Indicator" (a small 4px glowing dot) next to the AI wordmark.

### Kanban & Navigation
- **Cards:** Level 1 surface. On hover, increase border-opacity and show a subtle elevation shift.
- **Command Palette (Cmd+K):** A centered glassmorphic modal. Items should have a high-contrast selection state (#3B82F6 at 10% opacity).
- **Navigation:** Sidebar uses a "dimmed" active state—text becomes white while inactive text remains muted.

### Data Visualization
Charts should use 1.5px stroke widths with a "neon" glow effect (3px blur of the same color) to represent trends, ensuring lines remain visible against the near-black background.