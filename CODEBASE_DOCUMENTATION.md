# ShaderBrew — Codebase Documentation

WebGL procedural texture generator built on mebiusbox's MIT-licensed pixy.js shader library. Multi-layer texture creation tool with PBR export, 3D preview, gradient editor, undo/redo, and 160 animated sprite sheet effects (100 FXGEN + 52 custom GLSL + 8 composites).

## Quick Navigation

```
ENTRY POINTS:
  editor.html          Main editor (loads src/app.js)
  index.html           Redirect to showcase.html
  gallery.html         Live animated gallery of 70+ effects
  showcase.html        Feature showcase (pipeline + custom GLSL previews)
  demos.html           Interactive material demos
  particles.html       3D particle viewport + Browse 100 mode
  particle-gallery.html  100-particle grid gallery
  sprite-gallery.html  160 animated sprite sheet gallery (FXGEN + custom GLSL + composites)
  gen-sprites.html     Headless generator: 100 pixy-based sprite sheets
  gen-custom.html      Headless generator: 52 custom GLSL sprite sheets
  gen-hires-test.html  One-off hi-res custom shader test

PROJECT TRACKING:
  FINDINGS.md          Findings checklist and usability roadmap

CORE MODULES (src/):
  app.js               Main coordinator — init, animate, render
  defaults.js          68 effect types, ~100 default parameters
  pixy-api.js          Facade around pixy.module.min.js exports
  render-pipeline.js   6-pass pipeline: Base→Polar→CB→Tiling→Normal→Copy
  layer-manager.js     Multi-layer CRUD, reorder, duplicate
  compositor.js        Ping-pong RT blending, 9 blend modes
  gradient-editor.js   Canvas-based multi-stop gradient editor + presets
  gradient-pass.js     Post-process gradient color ramp integration
  history.js           Undo/redo (JSON snapshots, Ctrl+Z/Y)

SHADERS (src/shaders/):
  blend.js             9 blend modes (Normal, Multiply, Screen, Overlay, Add, etc.)
  gradient-map.js      Luminance → gradient color lookup
  tile-preview.js      2×2 tiling visualization
  pbr/height-normal.js Sobel filter → normal map
  pbr/roughness.js     Luminance → roughness with invert/contrast/bias
  pbr/ao.js            Multi-directional sampling → ambient occlusion
  pbr/metallic.js      Threshold + smoothing → metallic mask

EXPORT & CAPTURE:
  export.js            PNG/JPEG/ZIP export (JSZip CDN)
  alpha-export.js      Alpha inference from luminance + PNG save
  sprite-sheet.js      N-frame animation capture → grid atlas

3D PREVIEW:
  preview-3d.js        MeshStandardMaterial + PBR maps on sphere/cube
  noise-sphere.js      Displacement-mapped sphere preview
  pbr-generator.js     Runs all 4 PBR passes (normal, roughness, AO, metallic)

UI (src/ui/):
  gui-setup.js         lil-gui parameter panels for all ~100 effect params
  layer-panel.js       Drag-to-reorder layer list with opacity/blend/visibility
  toolbar.js           Quick-action buttons (tile, animate, 3D, reset)
  pbr-panel.js         PBR map thumbnails + parameter sliders
  export-panel.js      Resolution selector + format buttons
  action-dock.js       Bottom action dock (presets, gradient, PBR, 3D, export)
  custom-shader-panel.js Custom GLSL sprite preview panel
  layout-panel.js      Workspace layout and performance toggles
  quickstart.js        Quick-start overlay for first-time flow
  top-nav.js           Global top navigation bar for page-to-page browsing

PRESET & LOADER:
  preset-loader.js     Preset bar UI + JSON/URL loading

LIBRARY (DO NOT MODIFY):
  pixy.module.min.js   439KB MIT-licensed shader library by mebiusbox — 70+ effects, noise functions, Composer

DATA:
  presets/              38 JSON preset files (13 custom + 25 built-in)
  presets/manifest.json Manifest for the preset browser (labels, categories, file paths)
  presets/projects/     Example multi-layer project JSONs
  sprites/              160 pre-rendered sprite sheet PNGs (6×6 grid, 192px frames)
  game-sprites/          Split-frame outputs for game engine imports
  images/grunge.png     Texture used by shader effects

SCRIPTS:
  save-sprites.mjs     Puppeteer: renders gen-sprites.html → 100 PNGs to sprites/
  save-custom.mjs      Puppeteer: renders gen-custom.html → 52 PNGs to sprites/

TOOLING:
  eslint.config.mjs   ESLint config (run `npm run lint`)
  package.json        npm scripts + dev dependencies

DEPLOYMENT:
  .github/workflows/pages.yml   GitHub Pages deploy workflow (serves repo root)
  .nojekyll                    Disable Jekyll processing for static assets
```

## Architecture

### Editor Pipeline (per layer)

```
Effect Type + Parameters
        │
        ▼
┌─────────────────────────────────────────────────┐
│  RenderPipeline (6 sequential passes)           │
│                                                 │
│  1. Base ──→ FxgenShader renders effect to RT   │
│  2. PolarConversion ──→ radial warp (optional)  │
│  3. ColorBalance ──→ shadow/mid/highlight RGB   │
│  4. Tiling ──→ seamless tile repeat (optional)  │
│  5. NormalMap ──→ Sobel height-to-normal (opt)  │
│  6. Copy ──→ final blit to output RT            │
│                                                 │
│  Each pass: own WebGLRenderTarget, chained via  │
│  tDiffuse uniform. Disabled passes skip.        │
└─────────────────────────────────────────────────┘
        │
        ▼ (per-layer render target)
┌─────────────────────────────────────────────────┐
│  Compositor                                     │
│  Ping-pong RTs, blend layers bottom-to-top      │
│  9 modes: Normal|Multiply|Screen|Overlay|Add|   │
│           Subtract|SoftLight|HardLight|Diff     │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  GradientPass (optional)                        │
│  Maps luminance → gradient texture colors       │
└─────────────────────────────────────────────────┘
        │
        ▼
   Screen / Export
```

### Sprite Sheet Pipeline (gen-sprites.html / gen-custom.html)

```
For each of 36 frames (6×6 grid):
  1. renderFx()  → render effect at time t to RT
  2. doGrad()    → gradient color map (pixy effects only)
  3. doMask()    → circle mask + luminance-based alpha kill
  4. readPixels  → readRenderTargetPixels (with Y-flip)
  5. putImageData → composite into 1152×1152 canvas atlas

Output: PNG sprite sheet, 192px per frame, 36 frames total
```

### Custom GLSL Shaders (gen-custom.html)

52 shaders written from scratch, bypassing pixy entirely. Each is a standalone fragment shader with `uniform float time` and `uniform vec2 resolution`. The catalog lives in `gen-custom.html`, and shader sources live in `shader-defs.js`.

Examples: Volumetric Nebula, Black Hole, Warp Tunnel, Dimensional Portal, Cosmic Jellyfish, Reality Shatter, Particle Collider, Void Tendril, Summoning Circle.

### Layer System

```
LayerManager
  └── layers[] ─── each has:
        ├── id, name, visible, opacity, blendMode
        ├── effectController (~100 params)
        ├── RenderPipeline (6 passes, own RTs)
        └── renderTarget (output)

Active layer's params shown in GUI.
Compositor blends all visible layers.
```

### PBR Map Generation

```
Source texture (any layer/composite output)
        │
        ├──→ HeightNormal shader (Sobel 3×3) ──→ Normal Map
        ├──→ Roughness shader (lum + invert/contrast/bias) ──→ Roughness Map
        ├──→ AO shader (multi-sample depth diff) ──→ AO Map
        └──→ Metallic shader (threshold + smooth) ──→ Metallic Map

All 4 maps viewable in PBR panel thumbnails.
Applied to MeshStandardMaterial in Preview3D.
Exportable individually or as ZIP bundle.
```

## Key Technical Facts

- **pixy.module.min.js is READ-ONLY.** Use `PIXY.ShaderChunk.name = "glsl..."` for runtime injection.
- **`PIXY.ShaderChunk`** (exported, mutable) is for 3D shaders. The 2D effect chunks live in internal `rr` dict (NOT exported).
- **FxgenShader.check()** supports logic: `"KEY"` = AND, `"+KEY"` = OR, `"-KEY"` = NOT.
- **All 65+ effects share ~100 parameters.** Unused params are silently ignored per effect.
- **Resolution is always square.** Max depends on `gl.getParameter(gl.MAX_TEXTURE_SIZE)`.
- **Gallery GPU strategy:** IntersectionObserver + round-robin max 6 renders/frame.
- **Sprite sheet atlas:** 6×6 grid = 36 frames, 192px each = 1152×1152 PNG.
- **Circle mask:** `smoothstep(.3,1.,d)` where d = distance from center. Luminance kill: `smoothstep(.0,.04,lum)`.
- **CanvasTexture flipY fix:** Shader uses `uGrid-1.-floor(f0/uGrid)` instead of `floor(f0/uGrid)`.
- **Three.js version:** 0.174.0 from unpkg CDN.
- **History:** Max 50 snapshots, ~5KB each (JSON params), 300ms debounce for sliders.

## Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | DONE | Built src/ modules using pixy.js shader API |
| 1 | DONE | Multi-layer compositing (LayerManager, 9 blend modes, Compositor) |
| 2 | DONE | Gradient map color ramp (editor + 5 presets + GLSL shader) |
| 3 | DONE | Enhanced UI layout (layer panel, toolbar, split-pane) |
| 4 | DONE | PBR map generation (Normal, Roughness, AO, Metallic) |
| 5 | DONE | 3D preview with PBR materials |
| 6 | DONE | Undo/redo (JSON snapshots, Ctrl+Z/Y) |
| 7 | DONE | Enhanced export (PNG/JPEG/ZIP, resolution selector) |
| 8 | FUTURE | Node graph editor |
| — | DONE | 38 gallery presets, 13 custom presets |
| — | DONE | 100 procedural sprite sheets (pixy effects) |
| — | DONE | 19 custom GLSL shaders (raymarched, fractals, physics) |
| — | DONE | Sprite sheet gallery with category filters |

## Commands

```bash
# Serve locally (NEVER use port 3000)
python3 -m http.server 4444

# Re-generate pixy sprite sheets (needs running server on 4444)
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" node save-sprites.mjs

# Re-generate custom GLSL sprite sheets
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" node save-custom.mjs
```

## File Sizes

| Component | Files | Size |
|-----------|-------|------|
| pixy.module.min.js | 1 | 439KB |
| src/ modules | 22 | ~3,800 lines |
| sprites/ | 118 | ~133MB |
| presets/ | 38 | ~200KB |
| gen-custom.html (GLSL) | 1 | ~1,350 lines |

## Dependencies

- **Three.js 0.174.0** — CDN (unpkg), renderer/camera/controls/materials
- **lil-gui** — CDN, parameter UI panels
- **JSZip** — CDN (loaded on demand), ZIP export
- **Puppeteer** — global npm, headless Chrome for sprite generation
- **Xvfb** — system package, virtual display for headless WebGL
