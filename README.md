# EffectTextureMaker — Enhanced Edition

A professional WebGL procedural texture generator running entirely in your browser. Multi-layer compositing, gradient color mapping, PBR material generation, 3D preview, custom GLSL shaders, and more.

**[Live Demo](https://web3dev1337.github.io/effect-texture-maker/showcase.html)**

## Pages

| Page | Description |
|------|-------------|
| [Showcase](https://web3dev1337.github.io/effect-texture-maker/showcase.html) | Guided tour through all features — live renders, 3D preview, PBR maps |
| [Editor](https://web3dev1337.github.io/effect-texture-maker/editor.html) | Full texture editor with layers, gradients, PBR export, undo/redo |
| [Gallery](https://web3dev1337.github.io/effect-texture-maker/gallery.html) | Live animated gallery of 70+ procedural effects |
| [Material Forge](https://web3dev1337.github.io/effect-texture-maker/demos.html) | 3D material demo — textures mapped onto lit, spinning objects with bloom |
| [Sprite Gallery](https://web3dev1337.github.io/effect-texture-maker/sprite-gallery.html) | 119 animated sprite sheets (100 FXGEN + 52 custom GLSL) |
| [Particles](https://web3dev1337.github.io/effect-texture-maker/particles.html) | 3D particle viewport with sprite-sheet-driven effects |
| [Classic Editor](https://web3dev1337.github.io/effect-texture-maker/index.html) | Original single-layer editor (preserved for compatibility) |

## Features

### Editor
- **65+ procedural effect types** — explosions, fire, plasma, voronoi, fractals, caustics, and more
- **52 custom GLSL shaders** — raymarched nebulae, black holes, warp tunnels, fractals, cosmic phenomena
- **Multi-layer compositing** — unlimited layers with 9 blend modes (Normal, Multiply, Screen, Overlay, etc.)
- **Gradient color mapping** — multi-stop gradient editor with 5 presets, applied as a luminance remap
- **PBR map generation** — auto-generates Normal, Roughness, AO, and Metallic maps from any texture
- **3D material preview** — real-time preview on sphere/cube/torus knot/cylinder with environment reflections, ACES tone mapping, and shadow-casting lights
- **Undo/Redo** — 50-state history with Ctrl+Z / Ctrl+Shift+Z
- **Export** — PNG, JPEG, ZIP bundles with all PBR maps, resolution selector up to 2048x2048

### Sprite Sheets
- **119 pre-rendered sprite sheets** — 6x6 grid, 36 frames each
- **100 FXGEN effects** — generated from the pixy shader library
- **52 custom GLSL shaders** — hand-written fragment shaders (volumetric raymarching, fractals, physics sims)
- **Game-ready** — transparent PNGs with alpha, suitable for particle systems and VFX

### Showcase
- **Dark Ritual Portal** — multi-layer composite build walkthrough
- **Material Forge** — live 3D scene with PBR materials, bloom, and environment lighting
- **7 chapters** — from raw effects through color balance, gradients, layers, compositing, PBR maps, to 3D preview

## Tech Stack

- **Three.js** 0.174.0 — WebGL rendering, 3D preview, PBR materials
- **pixy shader library** — 65+ procedural effect fragment shaders (minified, read-only)
- **Custom GLSL** — 52 hand-written shaders bypassing pixy entirely
- **lil-gui** — parameter controls
- **JSZip** — ZIP export (loaded on demand)
- No build step, no bundler — pure ES modules served directly

## Architecture

```
editor.html          Main editor (loads src/app.js)
src/
  app.js             Main coordinator
  render-pipeline.js 6-pass pipeline (Base -> Polar -> ColorBalance -> Tiling -> Normal -> Copy)
  layer-manager.js   Multi-layer CRUD, reorder, duplicate
  compositor.js      Ping-pong render target compositor, 9 blend modes
  gradient-editor.js Multi-stop gradient editor
  pbr-generator.js   Normal/Roughness/AO/Metallic pass generation
  preview-3d.js      3D preview with PMREM environment, ACES tone mapping, shadows
  history.js         Undo/redo (50 snapshots)
  export.js          PNG/JPEG/ZIP export
  ui/                GUI panels, layer panel, toolbar, action dock
  shaders/           Blend modes, gradient map, tiling, PBR shaders
shader-defs.js       52 custom GLSL shader sources
```

## Running Locally

```bash
python3 -m http.server 4444
# Open http://localhost:4444/editor.html
```

## Credits

Built on [EffectTextureMaker](https://github.com/mebiusbox/EffectTextureMaker) by [mebiusbox](https://github.com/mebiusbox) (MIT License). The original tool provides the core procedural shader library (pixy) and single-layer editor.

This fork adds multi-layer compositing, gradient mapping, PBR generation, 3D preview, custom GLSL shaders, sprite sheet generation, the showcase, material forge, and the enhanced editor UI.

## License

MIT
