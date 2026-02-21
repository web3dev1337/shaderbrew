# EffectTextureMaker - Enhanced Fork

## First Steps
1. Read `PLAN.md` for the full 8-phase implementation plan
2. Check current branch (`work1`)
3. Run on `http://localhost:4444` (do NOT use port 3000)

## Project Overview
WebGL shader-based procedural texture generator. Originally by mebiusbox (MIT). We're transforming it into a professional multi-layer texture creation tool.

## Key Files
- `editor.html` - NEW main editor (loads from src/)
- `index.html` - Original editor (loads fxgen.module.min.js, kept for compat)
- `fxgen.module.min.js` - Original minified app (kept for backwards compat)
- `pixy.module.min.js` - 439KB shader library (DO NOT MODIFY - use ShaderChunk injection instead)
- `gallery.html` - Live animated gallery of all 70+ effects
- `presets/*.json` - 13 custom presets (5 basic + 8 advanced)
- `images/grunge.png` - Texture used by shaders
- `PLAN.md` - Full implementation plan with sub-agent research findings

## src/ Module Structure (Phase 0-2 COMPLETE)
- `src/app.js` - Main app coordinator (init, animate, render, event handlers)
- `src/pixy-api.js` - Clean facade around pixy.module.min.js exports
- `src/defaults.js` - Effect types, parameters, configs, overrides
- `src/render-pipeline.js` - 6-pass render pipeline (Base→Polar→CB→Tiling→Normal→Copy)
- `src/layer-manager.js` - Multi-layer CRUD, reorder, duplicate, serialize
- `src/compositor.js` - Ping-pong RT compositor with blend modes
- `src/gradient-editor.js` - Interactive multi-stop gradient editor + presets
- `src/gradient-pass.js` - Post-process pass applying gradient color ramp
- `src/sprite-sheet.js` - Sprite sheet capture/export
- `src/alpha-export.js` - Alpha inference and PNG export
- `src/noise-sphere.js` - 3D displacement preview
- `src/preset-loader.js` - Preset bar UI + URL loading
- `src/ui/gui-setup.js` - lil-gui parameter panels
- `src/ui/layer-panel.js` - Drag-to-reorder layer panel UI
- `src/shaders/blend.js` - 9 blend modes as GLSL
- `src/shaders/gradient-map.js` - Luminance-to-gradient GLSL

## Architecture (Reverse-Engineered)

### fxgen.module.min.js - The App
- Main object `s` is module-scoped const (private, not exported)
- 6-pass post-processing pipeline: Base → PolarConversion → ColorBalance → Tiling → NormalMap → Copy
- Each pass has its own WebGLRenderTarget, chained via tDiffuse
- Disabled stages skip to Copy pass
- Lines 29-73: Our preset auto-loader with bottom bar UI

### pixy.module.min.js - The Shader Library
- `FxgenShader` class: enable()/clear()/check()/generateDefines()/generateUniforms()/createMaterial()
- `FxgenShaderUtils.SetShaderParameter()` - type-aware uniform setter
- `PIXY.ShaderChunk` is MUTABLE and EXPORTED - inject new chunks at runtime
- `PIXY.Composer` + `PIXY.ShaderPass` + `PIXY.Pass` exist - use for compositing
- 70+ effect types, comprehensive GLSL noise library (simplex, Perlin, Voronoi, FBM)
- Internal chunk dict `rr` is NOT exported (effect GLSL lives there)

## Critical Technical Discoveries
1. **ShaderChunk injection**: `PIXY.ShaderChunk.myChunk = "glsl..."` works at runtime
2. **Pixy has a Composer**: Don't build compositing from scratch, use PIXY.Composer
3. **FxgenShader.check()** supports AND/OR/NOT: `"+KEY"` OR, `"-KEY"` NOT, `"KEY"` AND
4. **Alpha inference**: Save buffer uses `alpha = max(R, G, B)` with threshold/tolerance

## Custom Presets (13 total)

### V2 Advanced (intentional parameter interactions):
- `helix-nebula` - CoherentNoise + polar + voronoi(0.70)/simplex(0.55) + ridge(0.80) = nebula gas filaments
- `magma-channels` - CoherentNoise + ridge(0.95)+invert = dark crust with bright lava in cracks
- `storm-eye` - Explosion + polar + ballness=45 + speed=0.12 = organized massive vortex
- `bioluminescent-deep` - Caustics + tiling + deep teal palette
- `solar-chromosphere` - Corona + orange-gold emission spectrum palette
- `neural-tissue` - Trabeculum + pink/violet biological palette
- `crystal-voronoi` - CoherentNoise + VoronoiCell=1.0 (cell edges only) + normalMap + heightScale=6.5
- `frozen-lightning` - CoherentNoise + voronoi+ridge+turbulence+toon+polar+invert = Lichtenberg figures

### V1 Basic (simple slider tweaks):
- `inferno-vortex`, `alien-nebula`, `plasma-storm`, `ocean-caustics`, `dark-matter`

## Implementation Status
- **Phase 0**: DONE - Deobfuscated into src/ modules
- **Phase 1**: DONE - Multi-layer compositing (LayerManager, 9 blend modes, Compositor)
- **Phase 2**: DONE - Gradient map color ramp (editor + 5 presets + GLSL shader)
- **Phase 3**: Enhanced UI layout (split-pane)
- **Phase 4**: PBR map generation (Normal, Roughness, AO, Metallic, ORM)
- **Phase 5**: 3D preview with PBR materials
- **Phase 6**: Undo/redo
- **Phase 7**: Enhanced export (ZIP bundle, 4096 res)
- **Phase 8**: Node graph editor (future)
- **Start with Phase 0+1+2** for maximum impact

## Gotchas
- `s` (app object) is NOT accessible from outside the module - must modify fxgen to expose it
- pixy's internal chunk dict `rr` is NOT exported - can't add new effect types via ShaderChunk alone
- All 65+ effects share the same ~100 parameter set (unused params silently ignored)
- Resolution is always square
- Gallery uses IntersectionObserver + round-robin rendering (max 6/frame) to avoid GPU melt
- Three.js loaded from unpkg CDN (v0.174.0)

## Commands
```bash
# Serve locally (use any port EXCEPT 3000)
python3 -m http.server 4444
# or
npx serve -p 4444
```
