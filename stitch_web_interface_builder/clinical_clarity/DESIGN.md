# Design System Specification: Clinical Precision & Tonal Depth

## 1. Overview & Creative North Star: "The Clinical Sanctuary"
The objective of this design system is to transcend the sterile, cluttered nature of traditional Hospital Information Systems (SIH) by adopting a philosophy we call **"The Clinical Sanctuary."** 

This isn't just a dashboard; it is a high-performance environment designed to reduce cognitive load for clinicians. We move away from the "grid-of-boxes" mentality toward an **Editorial Intelligence** layout. By using intentional asymmetry, generous negative space, and sophisticated layering, we create a sense of calm authority. We replace harsh structural lines with soft tonal transitions, ensuring that when a STAT alert appears in Emergency Red, it commands absolute attention without competing against a noisy interface.

---

## 2. Color & Surface Philosophy
The palette is rooted in medical trust but executed with a premium, layered depth.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through background color shifts or tonal transitions.
- **Example:** A patient record module (`surface-container-low`) sits directly on the global `background`. The transition in hue provides the boundary, keeping the interface "breathable."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted elements. Use the `surface-container` tiers to define importance:
- **Level 0 (Base):** `surface` (#f9f9ff) for the global background.
- **Level 1 (Sections):** `surface-container-low` (#f2f3fb) for sidebars or secondary navigation.
- **Level 2 (Active Workspaces):** `surface-container` (#ecedf6) for main content areas.
- **Level 3 (Primary Cards):** `surface-container-highest` (#e1e2ea) for focused data points or high-priority modals.

### The "Glass & Gradient" Rule
Standard flat colors feel "out-of-the-box." To elevate the aesthetic:
- **Floating Elements:** Use Glassmorphism. Navigation bars or floating action buttons should use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`.
- **Primary CTAs:** Apply a subtle linear gradient (Top-Left to Bottom-Right) from `primary` (#00478d) to `primary_container` (#005eb8). This adds "soul" and a tactile quality to clinical actions.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance clinical efficiency with professional warmth.

*   **The Display Face (Manrope):** Used for Headlines and Display scales. Its geometric but slightly rounded nature feels modern and approachable.
*   **The Utility Face (Inter):** Used for Title, Body, and Labels. Inter’s high x-height and legibility are mission-critical for reading patient vitals and dosages at a glance.

**Key Hierarchy Rule:** Use `display-md` (Manrope, 2.75rem) for high-level dashboard summaries (e.g., "34 Active Admissions"). Use `label-sm` (Inter, 0.6875rem) with increased letter-spacing for metadata to ensure it feels like a deliberate design choice rather than "small text."

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows create "muddy" interfaces. We use light and tone to imply height.

*   **Layering Principle:** Achieve lift by stacking. Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f2f3fb) background. The contrast provides the "lift" naturally.
*   **Ambient Shadows:** If a shadow is required (e.g., a floating STAT notification), use a high-blur, low-opacity shadow tinted with the primary blue: `box-shadow: 0 12px 32px rgba(0, 71, 141, 0.06);`. 
*   **The "Ghost Border" Fallback:** If a border is necessary for accessibility in data-heavy tables, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Cards & Data Modules
*   **Rule:** Forbid divider lines within cards.
*   **Execution:** Separate header and body sections using a 24px vertical spacing gap or a slight shift from `surface-container-low` to `surface-container-lowest`.
*   **Rounding:** Apply `md` (0.75rem) for main cards and `sm` (0.25rem) for inner nested elements to create a "nested radius" harmony.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), white text, 8px corner radius.
*   **Secondary:** `surface-container-high` background with `on-surface-variant` text. No border.
*   **Tertiary/Emergency:** For STAT alerts, use `tertiary_container` (#c20000) with `on-tertiary` (#ffffff) text to create a high-contrast "stop" signal.

### Input Fields
*   Use a "Soft-Fill" style. Instead of a 1px outline, use `surface-container-highest` as the background. On focus, transition the background to `primary_fixed_dim` with a 1px "Ghost Border" of `primary`.

### Specialized Medical Components
*   **STAT Indicator:** A pulse-animated circle using `error` (#ba1a1a) placed next to critical patient names.
*   **Vitals Micro-Charts:** Sparklines should use `surface_tint` for standard readings and `tertiary` for abnormal spikes. Avoid axes or grids; the shape of the data is the priority.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place the most critical patient data (e.g., Allergies) in a larger, high-contrast container to break the grid.
*   **Embrace Negative Space:** Allow for "breathing room" between vitals panels. White space is a functional tool that prevents clinician fatigue.
*   **Contextual Coloring:** Use `secondary_fixed` for neutral states and reserved `tertiary` (red) and `warning_orange` strictly for actionable medical alerts.

### Don’t:
*   **Don't use pure black (#000000):** Use `on_surface` (#191c21) for text to maintain a premium, softer contrast.
*   **Don't use dividers:** Never use a horizontal line to separate list items. Use 16px of vertical padding instead.
*   **Don't crowd icons:** Medical icons must be surrounded by a 12px "touch target" of clear space to ensure they are easily clickable on tablets.

---

## 7. Signature Texture
To give the dashboard its bespoke feel, use a subtle **grain or noise overlay (2% opacity)** on `surface_container` backgrounds. This mimics high-end paper and reduces the "digital glare" of hospital monitors during long night shifts.