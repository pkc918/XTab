---
version: 2
slug: "entrypoints-newtab-index-html"
primary_target: "entrypoints/newtab/index.html"
related_targets:
  - "entrypoints/newtab/App.vue"
  - "entrypoints/newtab/data.ts"
  - "entrypoints/newtab/style.css"
  - "components/newtab/*"
---

# XTab New Tab

## Scope and mode

- Primary target: `entrypoints/newtab/index.html` and its Vue surface.
- Visitor mode: Operate.
- Audience: geeks who use GitHub and RSS and want a fast, information-rich browser starting point.
- Primary job: search or open a frequent destination immediately, then scan RSS, GitHub recommendations, and personal GitHub context without leaving the tab.
- Acceptance viewport: desktop only, from `1024 × 768` through `1440 × 900`; mobile is not part of the current scope.

## Approved direction

- Reference: the supplied DevStart screenshot, interpreted as a compact three-stream workbench rather than copied literally.
- Direction: a smooth, rounded command surface with a low header, centered search, quick destinations, then a permanent `23 / 54 / 23` information grid.
- The browser viewport is the canvas: header and command zone keep intrinsic height, while the dashboard consumes the exact remaining height. The outer page must not scroll.
- The shell stays black, white, and gray in both themes. Controlled vivid colors identify content families and data semantics without recoloring the structural UI.
- Memorable moment: one glance exposes all eight RSS rows, twelve repository cards, and personal GitHub context in a single desktop screen.

## Interaction and states

- A single standard-size theme icon switches complete light and dark themes and persists locally; it shows the current mode, never both icons at once.
- Search submits to the chosen default provider; `⌘/Ctrl + K` focuses the field.
- RSS categories, refresh, source management, and article preview rows remain interactive.
- Repository filters, repository links, local save toggles, and the Trending footer remain interactive.
- Quick destinations are direct links; the add control and settings control preserve their configuration entry points.
- Both GitHub connection controls start the real GitHub Device Flow when `WXT_GITHUB_CLIENT_ID` is configured. The Header uses a 44px circular GitHub control and replaces it in place with the authenticated user's avatar.
- GitHub authorization exposes configured, authorizing, denied/expired, and signed-in states. RSS refresh/settings and recommendation data remain explicit preview states and use honest toast feedback.
- Required states: default, hover, focus-visible, pressed, selected, saved, signed-out, preview-data notice, and reduced motion.

## Component boundaries

- `App.vue` owns only theme persistence and the shared toast message.
- `NewTabHeader.vue` owns branding, standard-size settings/theme actions, and composes `GithubAuthButton.vue` for the deliberately larger signed-out/authorizing/avatar states. No preview-status label appears in the Header.
- `CommandZone.vue` composes `SearchCommand.vue` and `QuickLinks.vue`.
- `RssPanel.vue` owns feed filtering and composes `RssFeedItem.vue`.
- `RepositoryPanel.vue` owns recommendation filtering/saved state and composes `RepositoryCard.vue`.
- `GithubProfilePanel.vue` owns the signed-out profile surface and composes `ContributionMatrix.vue`.
- `ToastNotice.vue` owns transient feedback.
- `composables/useGithubAuth.ts` owns Device Flow, token polling, authenticated-user loading, trusted-context persistence, and restoration.
- `entrypoints/newtab/data.ts` contains display data and semantic accent assignments; `components/newtab/types.ts` contains the shared contracts.

## Color boundaries

- Structural colors are grayscale only: canvas, sheets, borders, typography, selected controls, focus, and primary actions.
- Vivid auxiliary colors are limited to compact semantic signals: quick-link icons, RSS category dots/hover tint, repository language icon wells/dots/saved state, panel icon wells, and the GitHub-style contribution matrix.
- Panel identities are orange for RSS, violet for recommendations, and green for personal GitHub context.
- No wallpaper, gradient, glow, glassmorphism, or large chromatic surface.
- Do not fabricate live metrics, usernames, article provenance, contribution history, or successful authentication.
- Keep the existing WXT + Vue 3 + TypeScript stack. The popup and unrelated entrypoints remain untouched.

## Fidelity inventory

| Visible ingredient | Implementation medium | Commitment |
|---|---|---|
| XTab identity and header | `NewTabHeader.vue` + `GithubAuthButton.vue` | Geometric mark, 36px settings/theme actions, 44px GitHub circle/avatar |
| Search command area | `CommandZone.vue` + `SearchCommand.vue` | Centered 54px action, Google mark, shortcut focus, stable outer border |
| Quick destinations | `QuickLinks.vue` + data accents | Six direct links plus add/configuration control |
| RSS stream | `RssPanel.vue` + `RssFeedItem.vue` | Four filters, eight fixed-height rows, refresh/manage actions |
| GitHub recommendations | `RepositoryPanel.vue` + `RepositoryCard.vue` | Three-by-four grid, three filters, repository links, save controls |
| Personal GitHub panel | `GithubProfilePanel.vue` | Signed-out CTA or real account/avatar/public stats, contribution preview, activity state |
| Contribution matrix | `ContributionMatrix.vue` + CSS Grid | Five green intensity levels, decorative preview cells |
| Fixed desktop layout | Flex + CSS Grid | Exact remaining-height dashboard, no page overflow at target sizes |
| Motion and feedback | CSS transitions + `ToastNotice.vue` | 180ms tonal transitions with reduced-motion cutoff |
