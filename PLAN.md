# EffectTextureMaker - Take It To The Next Level

## Context

EffectTextureMaker is an MIT-licensed WebGL shader-based procedural texture generator (by mebiusbox). We forked it and have been enhancing it. The user wants to transform it from a basic single-effect viewer into a professional multi-layer texture creation tool.

**Current state (work already done on branch `work1`):**
- Created `gallery.html` - live animated gallery of all 70+ effects with IntersectionObserver for GPU efficiency
- Created 13 custom presets (5 basic + 8 advanced with intentional parameter crafting)
- Modified `fxgen.module.min.js` to add preset auto-loader with bottom bar UI
- All changes uncommitted

## Repo Structure

```
/home/ab/GitHub/tools/effect-texture-maker/work1/
├── index.html              # Original editor (77 lines, loads fxgen.module.min.js)
├── fxgen.module.min.js     # Main app (minified, ~42KB, 74 lines with our preset additions)
├── pixy.module.min.js      # Shader library (439KB, contains ALL GLSL + FxgenShader class)
├── gallery.html            # NEW - live animated gallery (241 lines)
├── images/grunge.png       # Grunge texture used by shaders
└── presets/                 # NEW - 13 custom preset JSON files
    ├── helix-nebula.json       # CoherentNoise + polar + voronoi/simplex blend
    ├── magma-channels.json     # CoherentNoise + ridge+invert for lava channels
    ├── storm-eye.json          # Explosion + polar + ballness=45 for organized vortex
    ├── bioluminescent-deep.json # Caustics + tiling + teal palette
    ├── solar-chromosphere.json # Corona + orange-gold palette
    ├── neural-tissue.json      # Trabeculum + pink/violet biological palette
    ├── crystal-voronoi.json    # CoherentNoise + VoronoiCell=1.0 + normalMap
    ├── frozen-lightning.json   # CoherentNoise + voronoi+ridge+turbulence+toon+polar
    ├── inferno-vortex.json     # Explosion + polar (basic V1)
    ├── alien-nebula.json       # CoherentNoise + voronoi heavy (basic V1)
    ├── plasma-storm.json       # Energy + blue/purple (basic V1)
    ├── ocean-caustics.json     # Caustics + tiling + ocean palette (basic V1)
    └── dark-matter.json        # Trabeculum + low intensity + purple (basic V1)
```

---

## Sub-Agent Research Findings (Recovered from Session Logs)

### Agent 1: fxgen.module.min.js Deep Analysis

**The main app object `s`** follows a 6-pass sequential post-processing pipeline:
1. **Base** - Main effect shader render
2. **PolarConversion** - Optional radial warping
3. **ColorBalance** - Shadow/mid/highlight RGB shifting
4. **Tiling** - Seamless tile repeat
5. **NormalMap** - Height-to-normal Sobel conversion
6. **Copy** - Final blit to screen

Each pass renders to its own `WebGLRenderTarget`, chained via `tDiffuse` uniforms. Disabled stages skip to Copy pass.

**Key app features documented:**
- `s` is module-scoped const (private, not exported, not on window)
- Sprite sheet system captures N*N animation frames
- Alpha/save buffer infers alpha from pixel brightness
- ~20 methods, ~25 properties documented
- **Limitations**: No layer compositing, no undo/redo, no custom GLSL injection, no gradient editor, square-only resolution, single effect at a time, all 65+ effects share ~100 parameters

### Agent 2: pixy.module.min.js Deep Analysis (439KB shader library)

**FxgenShader class** (`er` internally):
- `enable()` / `clear()` / `check()` / `generateDefines()` / `generateUniforms()` / `generateVertexShader()` / `generateFragmentShader()` / `createMaterial()`
- `check()` supports AND/OR/NOT prefix logic (`"+KEY"` OR, `"-KEY"` NOT, plain `"KEY"` AND)

**FxgenShaderUtils** (`nr`):
- `SetShaderParameter()` - Smart type-aware uniform setter (Color, Vector, Matrix, Texture, Array, scalar)
- `SetShaderArrayParameter()`, `GetDefaultShaderParameters()`

**Two separate chunk dictionaries:**
- `n` (exported as `ShaderChunk`) - For 3D Shader class, ~150+ PBR/Phong chunks
- `rr` (NOT exported) - For FxgenShader 2D effects, all effect GLSL

**CRITICAL DISCOVERY: `PIXY.ShaderChunk` is declared as `var n = {...}` (mutable) and exported. New shader chunks can be injected at runtime by assigning `PIXY.ShaderChunk.myNewChunk = "..."` without modifying pixy.module.min.js.**

**70+ supported effect defines** categorized as:
- Geometric patterns (Wood, Circle, Solar, Ring, Cross, etc.)
- Noise types (CoherentNoise, PerlinNoise, VoronoiNoise, FbmNoise, etc.)
- Natural effects (Smoke, Flame, Cloud, Snow, Caustics, etc.)
- Energy effects (Lightning, Explosion, Corona, Electric, etc.)
- Artistic effects (BrushStroke, Grunge, InkSplat, etc.)

**Comprehensive GLSL noise library**: simplex 2D/3D/4D, classic Perlin, Voronoi/Worley, FBM variants, value noise with multiple interpolation modes.

**Multi-pass compositor system already in pixy**: `Composer`, `ShaderPass`, `Pass` base class, plus specialized passes (UnrealBloomPass, SSAOPass, EdgePass, etc.)

### Agent 3: Custom Preset Creation

Created 5 basic V1 presets + 8 advanced V2 presets with intentional parameter interactions (ridge+invert for magma, voronoiCell isolation for crystals, ballness=45 for storm eyes, etc.)

### Agent 4: Industry Research & Feature Roadmap

**Competitive landscape:**
- Substance Designer (industry standard, node-based, full PBR)
- Material Maker (open source Godot-based, ~250 nodes, 32-bit)
- Filter Forge (visual editor, up to 65000x65000, community library)

**Browser-based tools:** Shadertoy, NodeToy (150+ nodes), Three.js Shader Graph, GenPBR, PBR Forge

**What IS achievable in WebGL2/WebGPU:**
- Multi-pass render-to-texture, all blend modes, custom GLSL injection
- Node graph UIs (LiteGraph.js, Rete.js)
- PBR map generation, 3D preview, 4096+ resolution, 32-bit float textures
- ZIP export, undo/redo

**Browser limitations:** Max texture 4096 mobile / 8192-16384 desktop, no geometry shaders in WebGL, GLSL ES 3.0, 16 WebGL canvas limit

### Agent 5: Detailed Implementation Plan

**8-phase plan designed:**

---

## Implementation Plan

### Phase 0: Deobfuscate & Structure -- DONE (commit ff2d265)
**Files created:** `src/app.js`, `src/pixy-api.js`, `src/defaults.js`, `src/render-pipeline.js`, `src/sprite-sheet.js`, `src/alpha-export.js`, `src/noise-sphere.js`, `src/preset-loader.js`, `src/ui/gui-setup.js`, `editor.html`

- [x] Deobfuscated fxgen.module.min.js into 10 focused modules in src/
- [x] Created pixy-api.js facade
- [x] Created editor.html loading from src/
- [ ] Verify everything works identically (needs browser test)

### Phase 1: Multi-Layer Compositing -- DONE (commit 2f156ec)
**Files created:** `src/layer-manager.js`, `src/compositor.js`, `src/shaders/blend.js`, `src/ui/layer-panel.js`

- [x] LayerManager class with add/remove/reorder/duplicate/serialize
- [x] 9 blend modes as GLSL shader (Normal, Multiply, Screen, Overlay, Add, Subtract, SoftLight, HardLight, Difference)
- [x] Compositor class with ping-pong render targets
- [x] Layer panel UI with drag-to-reorder, visibility, opacity, blend mode, effect type

### Phase 2: Custom Color Ramp / Gradient Editor -- DONE (commit 29bac47)
**Files created:** `src/gradient-editor.js`, `src/gradient-pass.js`, `src/shaders/gradient-map.js`

- [x] Canvas-based multi-stop gradient editor with drag, color picker, double-click to add, right-click to remove
- [x] Gradient-map GLSL shader mapping luminance to gradient colors
- [x] 5 built-in gradient presets (Fire, Ice, Neon, Earth, Toxic)
- [x] Integrated into app.js render loop (commit de60a9e)

### Phase 3: Enhanced UI Layout
**Files:** `src/ui/layout.js`, `src/ui/layer-panel.js`, new `index.html`

1. **Split-pane layout**: Layer panel (left) | Viewport (center) | Parameters (right)
2. Layer panel with drag-to-reorder, per-layer visibility/opacity/blend controls
3. Move from lil-gui to custom parameter panel for better control
4. 2x2 tiling preview toggle

### Phase 4: PBR Map Generation
**Files:** `src/pbr-generator.js`, `src/shaders/pbr/`

1. **Height-to-Normal** (Sobel filter) - already partially exists in pixy's NormalMap pass
2. **Roughness** from grayscale with controls
3. **AO** from height via blur difference
4. **Metallic** from parameters
5. **ORM** packed texture (Occlusion-Roughness-Metallic in RGB)
6. Split viewport showing all maps simultaneously

### Phase 5: 3D Preview
**Files:** `src/preview-3d.js`

1. Split viewport with `MeshStandardMaterial` on sphere/cube/custom mesh
2. Apply generated PBR maps in real-time
3. Environment lighting with IBL

### Phase 6: Undo/Redo
**Files:** `src/history.js`

1. JSON state snapshots
2. Debounced recording for slider drags
3. Ctrl+Z / Ctrl+Shift+Z

### Phase 7: Enhanced Export
**Files:** `src/export.js`

1. PNG/JPEG formats with quality control
2. Resolution selector (up to 4096)
3. ZIP bundle via JSZip (all PBR maps + preset JSON)
4. Animation frame export improvements

### Phase 8 (Future): Node Graph Editor
- LiteGraph.js or Rete.js based
- Custom GLSL nodes via ShaderChunk injection
- Sub-graph encapsulation

---

## Critical Technical Insights

1. **ShaderChunk injection** - `PIXY.ShaderChunk` is mutable and exported. New effects can be added without touching pixy.module.min.js
2. **Pixy already has a Composer** - `PIXY.Composer` + `PIXY.ShaderPass` + `PIXY.Pass` exist. Use them for multi-layer compositing instead of building from scratch
3. **The 6-pass pipeline** in fxgen is the constraint - multi-layer means running the entire pipeline per layer, then compositing results
4. **V1 preset format compatibility** - Old presets auto-wrap into multi-layer format (single layer containing the V1 parameters)

## Risk Mitigations

- pixy bugs worked around via wrapper layer (pixy-api.js)
- 4096 resolution with capability detection (`gl.getParameter(gl.MAX_TEXTURE_SIZE)`)
- Blend performance is trivial (10 draw calls for 10 layers)
- Undo state is ~5KB per snapshot (just JSON parameters)

## Verification

1. After Phase 0: Open `index.html`, all existing effects work, presets load, gallery works
2. After Phase 1: Create 2+ layers, toggle visibility, change blend modes, see composited result
3. After Phase 2: Apply gradient ramp, see full-color output beyond the 9-slider color balance
4. After Phase 4: Generate normal map + roughness + AO from any effect, verify in 3D preview
5. Throughout: All 13 existing presets continue to load and render correctly

## Recommended Execution Order

Start with **Phase 0 + Phase 1 + Phase 2** as a single push - this delivers the most dramatic improvement (multi-layer + gradient colors). Phase 0 is required for all subsequent work. Phase 2 (gradient editor) alone transforms the tool from "interesting" to "professional" because color control is currently the weakest link.
