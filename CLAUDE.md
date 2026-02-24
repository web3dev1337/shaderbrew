# ShaderBrew

## First Steps
1. Read `CODEBASE_DOCUMENTATION.md` for full architecture and file reference
2. Check current branch (`work1`)
3. Run on `http://localhost:4444` (do NOT use port 3000)

## Project Overview
WebGL shader-based procedural texture generator. Originally by mebiusbox (MIT). Enhanced into a professional multi-layer texture creation tool with PBR export, 3D preview, gradient editor, undo/redo, and 119 pre-rendered sprite sheet particle effects (100 pixy-based + 19 custom GLSL).

## Key Files
- `editor.html` - Main editor (loads src/app.js, has layers/PBR/gradient/export)
- `index.html` - Original editor (loads fxgen.module.min.js, kept for compat)
- `fxgen.module.min.js` - Original minified app (kept for index.html)
- `pixy.module.min.js` - 439KB shader library (DO NOT MODIFY)
- `gallery.html` - Live animated gallery of 70+ effects
- `particles.html` - 3D particle viewport + Browse 100 mode
- `sprite-gallery.html` - 119 animated sprite sheets from pre-rendered PNGs
- `gen-sprites.html` - Headless generator for 100 pixy sprite sheets
- `gen-custom.html` - 19 custom GLSL shaders (raymarching, fractals, physics)
- `presets/` - 38 JSON preset files
- `sprites/` - 118 pre-rendered sprite sheet PNGs (6x6 grid, 192px frames)

## src/ Module Structure (All Phases Complete)
- `src/app.js` - Main coordinator (init, animate, render, all subsystems)
- `src/pixy-api.js` - Facade around pixy exports
- `src/defaults.js` - 65+ effect types, ~100 default parameters
- `src/render-pipeline.js` - 6-pass pipeline (Base→Polar→CB→Tiling→Normal→Copy)
- `src/layer-manager.js` - Multi-layer CRUD, reorder, duplicate
- `src/compositor.js` - Ping-pong RT compositor, 9 blend modes
- `src/gradient-editor.js` - Multi-stop gradient editor + 5 presets
- `src/gradient-pass.js` - Gradient color ramp post-process
- `src/sprite-sheet.js` - Animation frame capture → grid atlas
- `src/alpha-export.js` - Alpha inference from luminance + PNG save
- `src/export.js` - PNG/JPEG/ZIP export (JSZip CDN)
- `src/noise-sphere.js` - 3D displacement preview sphere
- `src/preview-3d.js` - MeshStandardMaterial + PBR maps on 3D geometry
- `src/pbr-generator.js` - Runs normal/roughness/AO/metallic passes
- `src/history.js` - Undo/redo (50 snapshots, Ctrl+Z/Y)
- `src/preset-loader.js` - Preset bar UI + JSON loading
- `src/tile-preview-pass.js` - 2x2 tiling visualization
- `src/ui/gui-setup.js` - lil-gui parameter panels
- `src/ui/layer-panel.js` - Drag-to-reorder layer panel
- `src/ui/toolbar.js` - Quick-action buttons
- `src/ui/pbr-panel.js` - PBR map thumbnails + sliders
- `src/ui/export-panel.js` - Resolution selector + format buttons
- `src/shaders/blend.js` - 9 blend modes GLSL
- `src/shaders/gradient-map.js` - Luminance-to-gradient GLSL
- `src/shaders/tile-preview.js` - Tiling visualization GLSL
- `src/shaders/pbr/` - 4 PBR shaders (height-normal, roughness, ao, metallic)

## Critical Technical Facts
- `pixy.module.min.js` is READ-ONLY. `PIXY.ShaderChunk` is mutable+exported for injection
- Internal effect chunk dict `rr` is NOT exported — can't add new effect types via ShaderChunk alone
- Custom GLSL shaders bypass pixy entirely (raw Three.js ShaderMaterial)
- All 65+ effects share ~100 params (unused silently ignored). Resolution always square.
- Sprite sheets: 6x6=36 frames, 192px each, 1152x1152 PNG atlas
- Circle mask: `smoothstep(.3,1.,d)` + luminance kill `smoothstep(.0,.04,lum)`
- CanvasTexture flipY fix in shaders: `uGrid-1.-floor(f0/uGrid)`
- Three.js 0.174.0 from unpkg CDN. lil-gui from CDN. JSZip loaded on demand.

## Implementation Status
- **Phase 0-7**: ALL DONE (layers, gradient, UI, PBR, 3D preview, undo/redo, export)
- **Phase 8**: FUTURE (node graph editor)
- **Sprites**: 100 pixy + 19 custom GLSL = 119 total, pre-rendered via Puppeteer+Xvfb
- **Custom GLSL**: Raymarched nebula, black hole, plasma sphere, fractals, 5 warp tunnels, aurora, tornado, jellyfish, phoenix, god rays, singularity, bioluminescent, reality glitch, crystal geode

## Custom GLSL Shaders (gen-custom.html)
19 original fragment shaders. Each uses proper color theory:
- **Split-complementary**: Warp Tunnel (blue-violet + amber)
- **Analogous warm**: Warp Inferno (gold→orange→ember), Phoenix
- **Triadic**: Warp Void (violet + teal + gold)
- **Complementary**: Warp Electric (cyan + coral)
- **Analogous cool**: Warp Rainbow (teal→blue→violet HSV sweep)

## Gotchas
- `s` (fxgen app object) is module-private — not accessible from outside
- Gallery uses IntersectionObserver + round-robin (max 6/frame) for GPU efficiency
- Puppeteer needs Xvfb for WebGL: `xvfb-run --auto-servernum node save-sprites.mjs`
- Custom shaders NOT in editor yet — only in sprite gallery. Editor uses pixy effects only.

## Commands
```bash
python3 -m http.server 4444                    # serve locally
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" node save-sprites.mjs   # gen pixy sprites
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" node save-custom.mjs    # gen custom sprites
```
