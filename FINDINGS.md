# EffectTextureMaker Findings and Roadmap

Updated: 2026-02-22

## Checklist
- [x] Use the final composited output for export, PBR, 3D preview, and tile preview (not the active layer only).
- [x] Record parameter changes for undo/redo (slider drags, toggles, selects) with debounced history.
- [x] Replace the hard-coded preset bar with a manifest-driven preset browser (search, categories, example projects).
- [x] Add a global top navigation bar to move between major pages.
- [x] Showcase: move Chapter 05B near the top and scale sprite playback FPS by quality setting.
- [x] Showcase: add step-by-step visual build breakdown for Dark Ritual Portal (warp tunnel, mask, atlas ring, alpha map, alpha composite).
- [x] Editor: allow saving/loading full projects (layers + gradient) and expose in UI.
- [x] Editor: replace scattered bottom buttons with a single action dock (presets, gradient, PBR, 3D, export).
- [x] Editor: add workspace layout + performance panel (toggle layers/params/toolbar/stats, live render, dock panels, auto layout).
- [x] Editor: add keyboard shortcuts for key panels (B, G, P, 3, E, L).
- [x] Editor: add Quick Start overlay with guided actions and reopen from Layout panel.
- [x] Editor: add preset thumbnails (auto-captured on load with local cache).
- [x] Sprite Gallery: add source filters + tags to separate FXGEN library, custom GLSL, and composites.
- [x] Sprite Gallery: support query params for `source`/`cat` deep links and show accurate counts.
- [x] Editor: add Custom GLSL panel with live sprite previews + link to full gallery.
- [ ] Showcase: add Custom GLSL library section with animated shader previews + links.

## Additional Findings (Backlog)
- Save/load only covers a single `effectController`, not layer stacks, gradient, or PBR state.
- `sprite-gallery.html` catalog count and `sprites/` count are out of sync with docs.
- `CODEBASE_DOCUMENTATION.md` lists outdated sprite totals and does not mention `gen-hires-test.html` or `game-sprites/`.
- Stats overlay is always visible and floating panels can overlap on small viewports.
- Sprite Gallery now separates FXGEN library, custom GLSL, and composites with source tags + filters.
