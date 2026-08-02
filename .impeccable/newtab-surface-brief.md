# XTab New Tab

## Scope and mode

- Primary target: `entrypoints/newtab/index.html` and its Vue surface.
- Visitor mode: Operate.
- Audience: geeks who use GitHub and RSS and want a fast, information-rich browser starting point.
- Primary job: search or open a frequent destination immediately, then scan RSS, GitHub recommendations, and personal GitHub context without leaving the tab.

## Approved direction

- Approved comp: `.impeccable/mocks/xtab-balanced-lattice.png` (composition A).
- Direction: a precision monochrome workbench with a calm balanced lattice: low header, centered search, quick destinations, then a `23 / 54 / 23` information grid.
- User correction: the comp is too sharp. The implementation must use a coherent smooth-radius system, softer panel transitions, restrained borders, and rounded controls while preserving dense scanability.
- Memorable moment: search and shortcuts form a quiet command center above three synchronized information streams.

## Interaction and states

- Theme toggle switches complete light and dark monochrome themes and persists locally.
- Search submits to the chosen default provider; keyboard shortcut focuses search.
- RSS categories and GitHub filters are interactive local view controls.
- Quick destinations are real links; add and settings controls disclose that configuration is not connected yet.
- GitHub authentication, RSS feeds, recommendations, and personal data remain explicit preview or signed-out states until real integrations exist.
- Required states: default, hover, focus-visible, pressed, selected, disabled, empty/signed-out, preview-data notice, and narrow-screen stacking.
- Responsive order on narrow screens: command area, GitHub recommendations, RSS, personal GitHub panel.

## Boundaries

- UI chrome is strictly black, white, and gray. No blue accent, gradient, glow, glassmorphism, wallpaper, or colored state semantics.
- Third-party marks may retain recognizable shapes but use monochrome treatment in this surface.
- Do not fabricate live metrics, usernames, article provenance, contribution history, or successful authentication.
- Keep the existing WXT + Vue 3 + TypeScript stack. The popup and unrelated entrypoints remain untouched.

## Fidelity inventory

| Visible ingredient | Implementation medium | Commitment |
|---|---|---|
| XTab identity and header | Semantic HTML + authored inline SVG/CSS | Geometric mark, GitHub control, theme toggle |
| Search command area | Form controls + CSS | Dominant centered action, shortcut hint, strong focus state |
| Quick destinations | Semantic links + authored inline SVG icons | Six compact rounded controls plus add placeholder |
| RSS stream | Semantic list + Vue state | Categories, dense rows, honest preview labeling |
| GitHub recommendations | Semantic cards/list + Vue state | Three-column inner grid on wide screens, filters, no fake metrics |
| Personal GitHub panel | Semantic signed-out/preview states | Connect CTA, contribution-grid preview, no fake account |
| Contribution matrix | CSS Grid | Five grayscale intensity levels, decorative cells hidden from assistive tech |
| Responsive behavior | CSS Grid/media queries | Center-first stacking and no horizontal overflow |
| Motion and feedback | CSS transitions + Vue state | Smooth tonal transitions; reduced-motion support |
