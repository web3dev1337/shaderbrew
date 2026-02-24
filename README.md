# ShaderSmith

Professional WebGL procedural texture generator. Multi-layer compositing, PBR map generation, 3D material preview, 52 custom GLSL shaders, and 65+ procedural effects — all running in your browser with zero dependencies.

**[Live Demo](https://web3dev1337.github.io/shadersmith/showcase.html)** | **[Open Editor](https://web3dev1337.github.io/shadersmith/editor.html)**

---

## Custom GLSL Shaders

52 hand-written fragment shaders — raymarched volumes, fractals, portals, and cosmic phenomena:

<p align="center">
<img src="docs/media/volumetric-nebula.gif" width="160" alt="Volumetric Nebula">
<img src="docs/media/black-hole.gif" width="160" alt="Black Hole">
<img src="docs/media/warp-tunnel.gif" width="160" alt="Warp Tunnel">
<img src="docs/media/phoenix-rebirth.gif" width="160" alt="Phoenix Rebirth">
<img src="docs/media/singularity.gif" width="160" alt="Singularity">
</p>
<p align="center">
<img src="docs/media/chain-lightning.gif" width="160" alt="Chain Lightning">
<img src="docs/media/supernova.gif" width="160" alt="Supernova">
<img src="docs/media/dark-ritual-portal.gif" width="160" alt="Dark Ritual Portal">
</p>

---

## Pages

| Page | Description |
|------|-------------|
| **[Showcase](https://web3dev1337.github.io/shadersmith/showcase.html)** | Guided tour — live renders, 3D preview, PBR maps, 7 chapters |
| **[Editor](https://web3dev1337.github.io/shadersmith/editor.html)** | Full texture editor — layers, gradients, PBR export, undo/redo |
| **[Gallery](https://web3dev1337.github.io/shadersmith/gallery.html)** | Live animated gallery of 70+ procedural effects |
| **[Material Forge](https://web3dev1337.github.io/shadersmith/demos.html)** | 3D material demo — textures on lit spinning objects with bloom |
| **[Sprite Gallery](https://web3dev1337.github.io/shadersmith/sprite-gallery.html)** | 119 animated sprite sheets (FXGEN + custom GLSL) |
| **[Particles](https://web3dev1337.github.io/shadersmith/particles.html)** | 3D particle viewport with sprite-sheet effects |

---

## Features

### Editor
- **65+ procedural effect types** — explosions, fire, plasma, voronoi, fractals, caustics, and more
- **52 custom GLSL shaders** — raymarched nebulae, black holes, warp tunnels, fractals, cosmic phenomena
- **Multi-layer compositing** — unlimited layers with 9 blend modes (Normal, Multiply, Screen, Overlay, etc.)
- **Gradient color mapping** — multi-stop gradient editor with 5 presets
- **PBR map generation** — auto-generates Normal, Roughness, AO, and Metallic maps
- **3D material preview** — real-time on sphere/cube/torus knot with environment reflections, ACES tone mapping, PCF shadows
- **Undo/Redo** — 50-state history (Ctrl+Z / Ctrl+Shift+Z)
- **Export** — PNG, JPEG, ZIP bundles with all PBR maps, up to 2048x2048

### Sprite Sheets
- **119 pre-rendered sprite sheets** — 6x6 grid, 36 frames each
- **Game-ready** — transparent PNGs with alpha for particle systems and VFX
- **Export** — GIF and MP4 video export via Puppeteer + ffmpeg

### Showcase
- **Dark Ritual Portal** — multi-layer composite build walkthrough
- **Material Forge** — live 3D scene with PBR materials, bloom, and environment lighting
- **7 chapters** — raw effects, color balance, gradients, layers, compositing, PBR maps, 3D preview

---

## Tech Stack

- **Three.js** 0.174.0 — WebGL rendering, 3D preview, PBR materials
- **pixy shader library** — 65+ procedural effect fragment shaders
- **Custom GLSL** — 52 hand-written shaders bypassing pixy entirely
- **lil-gui** — parameter controls
- **JSZip** — ZIP export (loaded on demand)
- No build step, no bundler — pure ES modules served directly

## Architecture

```
editor.html            Main editor
src/
  app.js               Main coordinator
  render-pipeline.js   6-pass pipeline (Base > Polar > ColorBalance > Tiling > Normal > Copy)
  layer-manager.js     Multi-layer CRUD, reorder, duplicate
  compositor.js        Ping-pong RT compositor, 9 blend modes
  gradient-editor.js   Multi-stop gradient editor
  pbr-generator.js     Normal / Roughness / AO / Metallic pass generation
  preview-3d.js        3D preview — PMREM environment, ACES tone mapping, shadows
  history.js           Undo/redo (50 snapshots)
  export.js            PNG / JPEG / ZIP export
  ui/                  GUI panels, layer panel, toolbar, action dock
  shaders/             Blend modes, gradient map, tiling, PBR shaders
shader-defs.js         52 custom GLSL shader sources
```

## Running Locally

```bash
git clone https://github.com/web3dev1337/shadersmith.git
cd shadersmith
python3 -m http.server 4444
# Open http://localhost:4444/editor.html
```

## Credits

Built on [EffectTextureMaker](https://github.com/mebiusbox/EffectTextureMaker) by [mebiusbox](https://github.com/mebiusbox) (MIT License). The original tool provides the core procedural shader library (pixy) and single-layer editor.

ShaderSmith adds multi-layer compositing, gradient mapping, PBR generation, 3D preview, 52 custom GLSL shaders, sprite sheet generation, the showcase, material forge, and the enhanced editor UI.

## License

MIT
