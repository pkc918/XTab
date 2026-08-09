---
name: XTab
description: "XTab is a rounded grayscale command surface for geeks: a fixed one-screen lattice with vivid semantic signals for RSS, repositories, shortcuts, and GitHub activity."
colors:
  light-matte-field: "#f5f5f5"
  light-white-sheet: "#ffffff"
  light-soft-inset: "#fafafa"
  light-hover-wash: "#f0f0f0"
  light-pressed-wash: "#e8e8e8"
  light-hairline: "#e8e8e8"
  light-divider: "#d6d6d6"
  light-emphasis-border: "#a3a3a3"
  light-ink: "#141414"
  light-muted-ink: "#525252"
  light-faint-ink: "#6b6b6b"
  light-inversion: "#171717"
  light-on-inversion: "#ffffff"
  light-focus-ring: "#525252"
  light-disabled: "#a3a3a3"
  light-rss-accent: "#f97316"
  light-rss-accent-soft: "#fff1e8"
  light-repository-accent: "#8b5cf6"
  light-repository-accent-soft: "#f4efff"
  light-profile-accent: "#10b981"
  light-profile-accent-soft: "#eafbf5"
  light-level-0: "#e8ece9"
  light-level-1: "#bbf7d0"
  light-level-2: "#4ade80"
  light-level-3: "#16a34a"
  light-level-4: "#166534"
  dark-matte-field: "#0b0b0b"
  dark-black-sheet: "#121212"
  dark-soft-inset: "#171717"
  dark-hover-wash: "#232323"
  dark-pressed-wash: "#2b2b2b"
  dark-hairline: "#262626"
  dark-divider: "#383838"
  dark-emphasis-border: "#5c5c5c"
  dark-ink: "#f5f5f5"
  dark-muted-ink: "#b8b8b8"
  dark-faint-ink: "#949494"
  dark-inversion: "#f5f5f5"
  dark-on-inversion: "#0b0b0b"
  dark-focus-ring: "#a3a3a3"
  dark-disabled: "#5c5c5c"
  dark-rss-accent: "#fb923c"
  dark-rss-accent-soft: "#2c1c13"
  dark-repository-accent: "#a78bfa"
  dark-repository-accent-soft: "#241b37"
  dark-profile-accent: "#34d399"
  dark-profile-accent-soft: "#10281f"
  dark-level-0: "#1b2520"
  dark-level-1: "#0e4429"
  dark-level-2: "#006d32"
  dark-level-3: "#26a641"
  dark-level-4: "#39d353"
  signal-violet: "#7c3aed"
  signal-blue: "#2563eb"
  signal-cyan: "#06b6d4"
  signal-orange: "#f97316"
  signal-red: "#ef4444"
  signal-pink: "#ec4899"
  signal-amber: "#f59e0b"
  signal-slate: "#64748b"
typography:
  brand:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "22px"
    fontWeight: 750
    letterSpacing: "-0.025em"
  brand-compact:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "22px"
    fontWeight: 750
    letterSpacing: "-0.025em"
  search:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "16px"
    fontWeight: 400
  panel-heading:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "15px"
    fontWeight: 720
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  feed-title:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.45
  repository-title:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  action:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    fontWeight: 650
  label:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "12px"
    fontWeight: 650
  micro:
    fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  indicator: "2px"
  matrix: "3px"
  keycap: "7px"
  badge: "8px"
  segment: "9px"
  compact: "10px"
  icon-tile: "11px"
  control: "12px"
  quick-link: "13px"
  group: "14px"
  panel: "16px"
  search: "17px"
spacing:
  micro: "2px"
  tight: "4px"
  compact: "8px"
  control: "12px"
  mobile-gutter: "14px"
  panel: "16px"
  tablet-gutter: "18px"
  section: "24px"
  desktop-gutter: "28px"
  command-top: "30px"
components:
  primary-action-light:
    backgroundColor: "{colors.light-inversion}"
    textColor: "{colors.light-on-inversion}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "38px"
  primary-action-dark:
    backgroundColor: "{colors.dark-inversion}"
    textColor: "{colors.dark-on-inversion}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "38px"
  search-field-light:
    backgroundColor: "{colors.light-white-sheet}"
    textColor: "{colors.light-ink}"
    typography: "{typography.search}"
    rounded: "{rounded.search}"
    padding: "7px 8px 7px 17px"
    height: "54px"
    width: "min(760px, 100%)"
  search-field-dark:
    backgroundColor: "{colors.dark-black-sheet}"
    textColor: "{colors.dark-ink}"
    typography: "{typography.search}"
    rounded: "{rounded.search}"
    padding: "7px 8px 7px 17px"
    height: "54px"
    width: "min(760px, 100%)"
  quick-destination-light:
    backgroundColor: "{colors.light-white-sheet}"
    textColor: "{colors.light-muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.quick-link}"
    padding: "0 12px"
    height: "40px"
  quick-destination-dark:
    backgroundColor: "{colors.dark-black-sheet}"
    textColor: "{colors.dark-muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.quick-link}"
    padding: "0 12px"
    height: "40px"
  information-panel-light:
    backgroundColor: "{colors.light-white-sheet}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.panel}"
    padding: "0"
  information-panel-dark:
    backgroundColor: "{colors.dark-black-sheet}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.panel}"
    padding: "0"
  selected-filter-light:
    backgroundColor: "{colors.light-inversion}"
    textColor: "{colors.light-on-inversion}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "0 9px"
    height: "30px"
  selected-filter-dark:
    backgroundColor: "{colors.dark-inversion}"
    textColor: "{colors.dark-on-inversion}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "0 9px"
    height: "30px"
---

# Design System: XTab

## Overview

**Creative North Star: "The Balanced Command Lattice"**

XTab is a rounded grayscale command surface for geeks. It fits search, shortcuts, RSS, GitHub discovery, and personal GitHub context into one desktop viewport without turning the page into a sharp drafting grid.

Matte grayscale fields carry hierarchy and control state. Small vivid signals identify content families, languages, destinations, and contribution intensity while large surfaces remain neutral.

Search or open a frequent destination, then scan RSS, GitHub discovery, and personal GitHub context without leaving the tab.

**Key Characteristics:**

- Immediate command center above a calm, dense information lattice.
- Matte grayscale fields with black/white inversion for structural emphasis.
- Vivid color is reserved for compact semantic signals, never large surfaces.
- Smooth 12–17px outer radii paired with smaller internal radii.
- One consistent rounded outline-icon language.
- Dense content made scannable by hierarchy, rules, and a fixed one-screen lattice.

## Colors

The base palette is grayscale and mode-aware: light mode feels paperlike, dark mode feels ink-dark, and primary emphasis flips foreground and background. A bounded auxiliary palette adds category and data semantics without changing the neutral identity.

### Primary

- **Light Inversion** (`light-inversion` with `light-on-inversion`): The light theme's highest-emphasis actions, selected filters, active theme segment, selection, and toast treatment.
- **Dark Inversion** (`dark-inversion` with `dark-on-inversion`): The exact semantic inverse for dark mode, preserving emphasis without adding hue.

### Neutral

- **Matte Fields** (`light-matte-field`, `dark-matte-field`): The page canvas that separates the command area and information surfaces without texture or imagery.
- **Working Sheets** (`light-white-sheet`, `dark-black-sheet`): Panels, cards, controls, and the low identity bar.
- **Soft Insets** (`light-soft-inset`, `dark-soft-inset`): Icon wells, badges, keycaps, and quiet nested controls.
- **Interaction Washes** (`*-hover-wash`, `*-pressed-wash`): Tonal feedback for hover and press; they never become chromatic states.
- **Rule Family** (`*-hairline`, `*-divider`, `*-emphasis-border`): One-pixel separators progress from quiet structure to focused emphasis.
- **Ink Family** (`*-ink`, `*-muted-ink`, `*-faint-ink`): Primary copy, supporting copy, and metadata form three dependable contrast tiers.
- **Focus and Disabled** (`*-focus-ring`, `*-disabled`): Focus remains explicitly visible in grayscale; disabled controls retain structure at reduced opacity.
- **Contribution Levels** (`*-level-0` through `*-level-4`): A five-step GitHub-green intensity ramp for data cells and their legend in each theme.

### Auxiliary Signals

- **Panel identity:** RSS uses orange, repository discovery uses violet, and personal GitHub context uses green. Each has a pale/dark inset companion for icon wells.
- **RSS categories:** Development uses cyan, design uses pink, and AI uses violet; the dot and hover tint carry the category without recoloring the row.
- **Repository languages:** Language dots, icon wells, and saved states use controlled blue, violet, orange, cyan, slate, yellow, or amber accents.
- **Quick destinations:** Recognizable destination icons may use violet, blue, orange, red, amber, and slate while labels and containers remain grayscale.

### Named Rules

**The Neutral Structure, Vivid Signal Rule.** Black, white, and gray own layout, typography, controls, focus, and selection. Vivid color may occupy only compact semantic details tied to content identity or data intensity.

## Typography

**Interface Font:** Inter with platform UI sans fallbacks and explicit Simplified Chinese system fallbacks.

**Character:** Compact, neutral, and technical without becoming mechanical. Weight and contrast tiers carry hierarchy so the interface can stay dense and calm.

### Hierarchy

- **Brand** (750, 22px, -0.025em): The only identity-scale text.
- **Search** (400, 16px): The dominant input is larger than content copy but remains operational rather than editorial.
- **Panel Heading** (720, 15px, 1.25, -0.012em): Information-stream titles and signed-out state headings.
- **Feed Title** (650, 13px, 1.35): One- or two-line RSS titles optimized for fast scanning.
- **Repository Title** (700, 13px, 1.35): Single-line repository identifiers with truncation.
- **Body** (400, 12px, 1.4–1.5): Descriptions and empty-state explanation, capped at 31ch where centered.
- **Label** (650, 12px): Filters, compact actions, control labels, and footer actions.
- **Micro** (400, 11px, 1.3): Preview status, provenance, timing, language, indices, and contribution legends.

### Named Rules

**The Small-but-Structured Rule.** Dense text stays legible through weight, line height, and contrast tiers instead of oversized headings.

## Layout

The new-tab surface is a height-locked desktop application shell. A 64px identity bar sits above a compact command zone containing a 54px, 760px-maximum search field and one non-wrapping quick-destination row. The dashboard flexes into the exact remaining height with 18px outer gutters and 12px panel gaps.

The information region permanently uses the approved `23 / 54 / 23` lattice for RSS, recommendations, and personal GitHub context. All three panels stretch to the same bottom edge. RSS uses eight equal fractional rows; recommendations use a three-column by four-row grid so all content remains visible without panel scrolling.

The current acceptance scope is desktop only, with a `1024px` minimum width and `640px` minimum height. At viewport heights of `820px` or less, vertical paddings, panel headings, row line clamps, and nested controls compact while the three-column architecture remains intact. The verified targets are `1024 × 768` and `1440 × 900`, both with zero outer overflow. Mobile stacking is intentionally outside this iteration.

## Elevation & Depth

The system uses no shadows. Depth comes from matte canvas/sheet contrast, quiet one-pixel borders, nested inset fills, and denser tone on hover or press. Focus rises through a 3px grayscale outline offset by 2px; primary actions use contrast modulation and a one-pixel directional transform for tactile feedback rather than simulated physical lift.

### Named Rules

**The Flat-by-Default Rule.** Surfaces do not cast shadows; borders, inset fills, and tone changes carry structure and state.

## Shapes

The silhouette is continuously rounded rather than pill-heavy: primary panels use 16px corners, the search field uses 17px, nested groups and toasts use 14px, quick destinations use 13px, and standard buttons use 12px. Header settings and theme actions are compact 36px rounded squares, while the larger GitHub identity slot remains borderless until it contains the user's circular avatar; smaller internal geometry steps down through 11px icon tiles, 10px compact controls, 7px keycaps, and 3px contribution cells.

Borders are restrained one-pixel rules. A 3px focus outline with a 2px offset stays visibly separate from the component edge. The authored mark uses solid geometry, while the shared 24px icon system uses a 1.7 stroke with round line caps and joins. Auxiliary color may tint a glyph or its compact well without changing icon construction.

## Components

### Buttons

- **Primary action:** A 38px-high, 12px-rounded black/white inversion with 13px horizontal padding, an optional icon, an 8px content gap, 14px type, and weight 650.
- **Icon action:** A transparent 38px square with 12px corners; panel actions reduce to 30px with 9px corners. Hover adds the surface wash and promotes icon contrast.
- **Hover / Focus / Press:** Primary hover increases contrast; icon hover uses the tonal wash; focus uses the global 3px ring and 2px offset; primary press translates one pixel in the action direction.
- **Disabled:** Disabled buttons use the theme's disabled gray, `not-allowed` cursor, and 0.72 opacity.

### Chips

- **Filter chip:** Unselected filters are transparent secondary text; selected filters invert to the structural accent surface. Repository filters are 30px high with 9px corners and 9px horizontal padding.
- **RSS source tab:** Each configured Feed is represented by a horizontally scrollable transparent tab with a two-pixel rounded active underline. An inline Add Feed action expands into a URL field, while the footer removes the currently selected source.

### Cards / Containers

- **Information panel:** A borderless translucent white working sheet with 16px corners, background blur, and clipped internal separators.
- **Repository group:** A 14px-rounded nested grid uses the subtle-border color as a one-pixel gap, producing continuous rules without double borders.
- **Repository card:** A borderless muted-surface block with a repository link, complete description, language metadata, and Star/Watch/Fork statistics. Background tone, rather than an outline, defines the card against the translucent repository panel.

### Inputs / Fields

- **Search field:** A 54px-high flex field, maximum 760px wide, with a 17px radius, a recognizable four-color Google mark, and asymmetric padding that gives the leading mark more air.
- **Focus:** Input focus does not alter the field's border, outline, radius, or surface; the text caret supplies the native editing cue.
- **Keyboard hint:** A 7px-rounded, subtly bordered keycap documents the global `⌘/Ctrl + K` focus shortcut.

### Navigation

- **Quick destinations:** Compact 40px controls with 13px corners, a semantic-color icon, a 7px gap, and 12px horizontal padding. Six direct destinations and one add/configuration action remain visible in one row.
- **Header utility actions:** Settings and theme are equal 36px rounded-square icon buttons with quiet tonal hover feedback. The theme action displays the current sun/moon state and never shows both icons simultaneously.
- **GitHub identity:** A borderless 44px identity slot is deliberately larger than neighboring icon controls. Signed out it shows a neutral GitHub mark without a container fill, authorization swaps in a spinner, and successful login replaces it in place with a same-size real circular avatar.

### Information Streams

- **Feed row:** Each of eight equal fractional rows is an interactive preview button with a category dot, tabular index, clamped title, metadata, and directional arrow. Until real URLs exist, activation produces an honest preview notice.
- **Contribution matrix:** Three-pixel gaps and 3px-rounded square cells express five GitHub-green activity levels; the matrix is explicitly labeled as a structural preview until real GitHub data is connected.
- **Toast:** A fixed 14px-rounded inversion surface at the lower right, with 12px/16px asymmetric padding and a 28px rotated close control. It enters and leaves over 180ms with an eight-pixel vertical offset, then collapses to the reduced-motion cutoff when requested.

## Do's and Don'ts

### Do:

- **Do** preserve black, white, and gray as the complete structural palette in both themes.
- **Do** use black/white inversion sparingly for selected state, primary action, selection, and transient notice.
- **Do** use vivid colors only for compact semantic signals such as category dots, icon wells, languages, saved state, and contribution intensity.
- **Do** keep outer surfaces smoothly rounded in the established 12–17px range and step down only for nested details.
- **Do** use restrained one-pixel rules and tonal layering to organize dense information.
- **Do** keep all primary content visible in one desktop viewport at the verified target sizes.
- **Do** keep preview, signed-out, empty, focus-visible, and reduced-motion states explicit and honest.

### Don't:

- **Don't** introduce wallpaper, gradients, glow, glassmorphism, or large chromatic surfaces.
- **Don't** turn the interface into a sharp drafting grid; retain smooth corners and softened panel transitions.
- **Don't** add shadows to manufacture hierarchy that borders and tones already provide.
- **Don't** let auxiliary color replace hierarchy, selected state, focus, or primary action contrast.
- **Don't** mix icon families or stroke attitudes; color is an annotation, not a new icon system.
- **Don't** fabricate live RSS provenance, GitHub metrics, usernames, authentication, or contribution history.
