# Pinkthositive Shader Workflow

This document explains what was built for the Pinkthositive moon and squid work, what those outputs actually are, how they were made, how to make more work like this, and how to move the results into engines such as Three.js and Roblox.

## Related Files

- `shader-defs.js`
- `pinkthositive-dashboard.html`
- `pinkthositive-dashboard-app.js`
- `pinkthositive-dashboard-shaders.js`
- `pinkthositive-preview.html`
- `pinkthositive-material-shaders.js`
- `pinkthositive-materials.html`
- `presets/projects/moon-surface-hero.json`
- `presets/projects/squid-tentacles-hero.json`

## What These Outputs Actually Are

There are three different artifact types involved here:

| Type | What it is | Best use | Bad use |
| --- | --- | --- | --- |
| Hero shader render | A custom GLSL render designed as a beauty shot | Landing pages, concept art, promo stills, animated showcases | Wrapping directly onto a sphere or model |
| Material shader | A shader that runs on actual mesh geometry | Surfaces, planets, props, model skins | Replacing geometry that should exist in 3D |
| Texture set | Baked 2D images such as albedo, normal, roughness, AO, emissive | Engines that cannot run your custom shader directly | Preserving interactive procedural controls |

For this project:

- The `hero` moon and squid pages are custom GLSL beauty renders.
- The later `materials` page is a procedural 3D scene.
- The moon material study is a real sphere material.
- The tentacle study is not just a texture. It is a combination of:
  - actual tentacle geometry
  - a custom tentacle skin shader
  - real 3D sucker meshes attached to the tentacles

That last page is much closer to a procedural model study than a plain texture.

## What Was Built

### 1. Moon Hero

The first good moon result was a hero render:

- cratered heightfield look
- hard directional light
- cold rim highlights
- cinematic camera angle

Why it worked:

- moon terrain reads mostly from large-scale forms and lighting
- a hero shot can cheat perspective and composition

Why it is not the same thing as a reusable game material:

- it contains a horizon and a composed view
- it is screen-space art, not sphere-space material logic

### 2. Squid Hero

The first good squid result was also a hero render:

- silhouette-first tentacle shapes
- suction cup rows
- wet highlights
- magenta and cyan art direction

Why it worked:

- the eye reads creatures from silhouette first
- broad tentacle bodies sold the subject better than abstract texture noise

Why it was not enough:

- it still was a composed shot, not a reusable model material

### 3. Moon Material Study

The later moon page was the correct approach for putting a moon-like surface on a sphere:

- crater logic based on sphere direction
- seam-safe object-space/sphere-space sampling
- multiple variations on actual spheres

Why it worked:

- the pattern lives on the sphere, not on a flat image
- there is no camera-baked horizon in the texture logic

### 4. Tentacle Material Study

The later tentacle page became the right answer only after moving from fake cup painting toward real form:

- `TubeGeometry` tentacle meshes for the primary forms
- custom skin shader for wet flesh, veins, specular, and glow
- attached 3D sucker meshes for readable depth

That is the important lesson:

- readable subjects need primary form in geometry
- shading should support the form, not try to invent the form alone

## The Core Process That Worked

The useful workflow was:

1. Define the target artifact before writing shader code.
2. Decide where the truth of the image should live.
3. Build primary forms first.
4. Add secondary surface detail second.
5. Add lighting and color last.
6. Validate against the actual subject, not just whether it looks "cool."

### Step 1. Pick The Right Artifact

Before touching code, answer this:

- Is this a beauty shot?
- Is this a reusable material?
- Is this a texture set for export?
- Is this a model study with procedural shading?

If this is wrong, the whole result drifts.

Examples:

- `Moon on a sphere` means material shader, not hero render.
- `Squid tentacle anatomy` means geometry plus material, not pure fullscreen texture.
- `Nebula background` means hero shader is fine.

### Step 2. Decide Where The Truth Lives

There are four common spaces:

| Space | Good for | Risk |
| --- | --- | --- |
| Screen space | Hero renders, portals, VFX, concept shots | Does not wrap correctly on models |
| UV space | Authored textures, decals, baked maps | Seams and stretching |
| Object space | Props, planets, materials tied to a mesh | Repeats per object instance |
| World space | Terrain, triplanar materials, shared environments | Can swim if objects move through it |

The moon material used sphere/object-space logic.

The squid hero used screen space.

The tentacle material study used actual mesh geometry plus shader shading.

### Step 3. Block Primary Forms First

This is where the early failed passes taught the right lesson.

Do not start with fine noise and hope it becomes a recognizable subject.

Start with:

- silhouette
- mass
- large landmarks
- anatomy or terrain logic

Examples:

- Moon:
  - basin shapes
  - crater bowls
  - crater rims
  - broad mare regions
- Squid:
  - tentacle taper
  - arm clustering
  - underside cup placement
  - terminal shape behavior

### Step 4. Add Secondary Detail

Only after the big read is correct:

- micro pitting
- regolith grain
- slime sheen
- flesh mottling
- rim sparkle
- cup lip detail

This detail should never be doing the job of primary form.

### Step 5. Add Lighting And Color

Lighting is what makes the surface believable.

Examples from this work:

- Moon:
  - hard sun direction
  - soft hemisphere fill
  - cold rim tint
- Squid:
  - wet specular
  - soft magenta flesh lighting
  - cyan accent glow
  - clearcoat-like highlights on suckers

### Step 6. Validate Aggressively

The practical loop was:

1. render live page
2. inspect for shader compile errors
3. check for black frames
4. capture screenshots
5. compare against the intended subject
6. refine the weakest read

The big correction in this project was not "tune the parameters more." It was "change the artifact type."

## The Most Important Design Rule

For recognizable subjects:

- texture-first works for surfaces
- geometry-first works for anatomy

That is why:

- the moon could become a convincing material
- the squid needed actual tentacle meshes and then real sucker geometry

## Meta Prompt Template

The useful meta prompt is not "make me a cool shader."

It should specify:

- subject
- artifact type
- target engine
- whether it must wrap on geometry
- whether it must be tileable
- what must read at silhouette level
- what can be cheated in shading
- what outputs are required

Use this structure:

```md
Create a [hero render | material shader | seamless texture set | model study] of [subject].

Target use:
- [promo still | sphere material | mesh skin | sprite sheet | baked PBR maps]

Subject read requirements:
- Must clearly read as [subject]
- Must show [3-5 primary landmarks]
- Must avoid reading as [common failure mode]

Technical constraints:
- [screen space | UV space | object space | world space]
- [tileable / non-tileable]
- [live shader / baked maps]
- [resolution]
- [animation yes/no]

Deliverables:
- [live GLSL page]
- [albedo / normal / roughness / AO / emissive]
- [mesh or geometry requirement]

Art direction:
- Palette:
- Lighting:
- Motion:
- Surface qualities:
```

## Prompt Examples

### Good Prompt For A Moon Material

```md
Create a seam-safe moon material shader for an actual sphere, not a fullscreen beauty shot.

Target use:
- reusable planet material in Three.js
- must hold up when orbiting a camera around the sphere

Subject read requirements:
- crater bowls, raised rims, ejecta feel, dusty regolith, darker mare zones
- must read as lunar terrain, not generic rock noise
- avoid visible UV seam and avoid a baked horizon

Technical constraints:
- object-space or sphere-space logic
- live shader first, then bake albedo, normal, roughness, and AO
- 1024 map target

Art direction:
- grey and silver base
- subtle blue-white cold rim light
- hard directional sun
```

### Good Prompt For A Squid Tentacle Study

```md
Create a tentacle model study, not just a tentacle texture.

Target use:
- readable creature appendage for real-time rendering

Subject read requirements:
- tentacle taper
- underside sucker placement
- wet flesh read
- clustered arm arrangement
- avoid parallel neon tubes and avoid flat painted cup illusions

Technical constraints:
- geometry-first
- custom skin shader for flesh and sheen
- actual 3D sucker geometry
- export path should support baking for engines that cannot run GLSL

Art direction:
- deep magenta and purple flesh
- bioluminescent cyan accents
- glossy wet highlights
```

## How To Produce More "Stuff"

Use this decision grid:

| If the subject is... | Start with... | Then add... |
| --- | --- | --- |
| Terrain, rock, bark, moon, rust | Material shader | Baked PBR maps |
| Creature appendage, anatomy, iconic object | Geometry or strong silhouette | Skin shader and secondary detail |
| Portal, nebula, energy beam, abstract VFX | Hero shader | Sprite sheet or video bake |
| Mobile or engine-limited target | Baked textures early | Reduced live procedural complexity |

A reliable production sequence is:

1. reference the subject
2. pick artifact type
3. build primary read
4. validate
5. only then add fancy detail
6. decide whether to keep it live or bake it

## Export Strategy

There are three real export strategies.

### 1. Keep It As A Live Shader

Use this when:

- you are shipping on the web
- you want interactive parameters
- you want infinite variation from uniforms

Good targets:

- Three.js
- custom WebGL apps
- custom engines with shader support

### 2. Bake It To Texture Maps

Use this when:

- the engine cannot run your custom shader
- you need consistent art across tools
- you are targeting standard PBR workflows

Typical outputs:

- albedo/base color
- normal
- roughness
- ambient occlusion
- metalness when relevant
- emissive when relevant
- height/displacement when relevant

### 3. Bake It To Sprites Or Video

Use this when:

- it is mostly a visual effect
- the effect is camera-facing
- the target engine is limited

Typical outputs:

- sprite sheet
- flipbook atlas
- looping video
- alpha sequence

## How To Use These Results In Three.js

There are two main paths.

### Live Shader Path

Use `THREE.ShaderMaterial` when you want the effect to stay procedural.

That is what the hero renders and moon/tentacle material studies are doing.

Core pieces:

- geometry
- `ShaderMaterial`
- uniforms
- render loop

Good for:

- moon material on a sphere
- animated creature skin
- live web demos

### Baked PBR Path

If you bake maps, use `THREE.MeshStandardMaterial` or `THREE.MeshPhysicalMaterial`.

Typical map assignment:

- `map`
- `normalMap`
- `roughnessMap`
- `aoMap`
- `metalnessMap`
- `emissiveMap`

Use this path when:

- you need engine-friendly content
- you want simpler runtime cost
- you want to reuse the look across many scenes

### Practical Three.js Notes

- `ShaderMaterial` is the correct path for custom GLSL materials.
- `WebGLRenderTarget` is the correct path when you want to render a shader into a texture and then reuse that texture.
- `MeshStandardMaterial` is the correct path for baked PBR maps.
- normal maps affect lighting, not actual silhouette.
- if silhouette matters, use geometry or displacement.

## How To Use These Results In Roblox

Roblox is the most important constraint case:

- Roblox does not use your arbitrary GLSL directly in the same way a custom WebGL app does.
- For Roblox, the reliable path is to bake the result.

### Best Roblox Path For Static Or Prop-Like Assets

1. build the look procedurally
2. bake texture maps
3. import the mesh as `MeshPart`
4. use `SurfaceAppearance` with baked PBR maps

Useful baked outputs for Roblox:

- albedo
- normal
- roughness
- metalness when relevant

Important practical constraints:

- use UV-mapped meshes
- Roblox supports PBR textures on `SurfaceAppearance`
- normal maps should be OpenGL tangent-space normals
- mesh objects get one material assignment

### Best Roblox Path For Tentacles Or Creatures

For something like the tentacle study:

- export the geometry from Blender or a DCC as `fbx` or `gltf`
- keep the tentacle form and sucker geometry in the mesh
- bake the shading into texture maps
- animate the mesh or rig separately

Do not plan on shipping the browser GLSL directly into Roblox.

### Best Roblox Path For Effects

For shader-like effects that are mostly visual:

- bake sprite sheets
- bake flipbooks
- bake animated image sequences

Treat Roblox as a bake target, not as the place where the original GLSL lives.

## How To Use These Results "Anywhere"

The portable rule is simple:

- if the target can run your shader language and pipeline, keep it live
- otherwise bake it

### Unity / Unreal / Godot

Usually you will either:

- rebuild the shader in the engine's shader graph or shading language
- or bake the maps and use the engine's standard material system

### Blender / DCC

Use the shader or material study as the source lookdev pass, then:

- bake maps
- export mesh plus textures
- move to glTF, FBX, or engine-native formats

## What The Current Repo Can Export Today

There is an important difference between the editor pipeline and the custom Pinkthositive pages.

### Editor Pipeline

The main editor already has:

- texture export
- PBR generation
- 3D preview

That is the standard export path for editor-built layered textures.

### Custom Pinkthositive Pages

The Pinkthositive hero and material pages are live custom shader pages.

Right now they are best for:

- live display
- look development
- visual reference
- screenshot or capture

If these need formal content export, the next proper system is:

1. render the custom material into fixed-resolution `WebGLRenderTarget`s
2. output dedicated passes for albedo, normal, roughness, AO, emissive, and height
3. save those as PNGs

That would turn the current live studies into a proper asset bake pipeline.

## Recommended Technique Library

If we keep producing more work like this, the useful technique set is:

- sphere-space crater fields for planets
- object-space procedural rock and bark materials
- triplanar mapping for seam hiding
- mesh-based creature appendages
- attached procedural secondary geometry
- offscreen bake passes for export
- sprite sheet baking for VFX targets

## Honest Lessons From These Passes

The failed versions were useful because they exposed the wrong abstraction.

The main lessons were:

- not every subject should start as a procedural texture preset
- a good-looking abstract surface is not the same as a readable subject
- creatures need silhouette and anatomy
- planets need correct material space
- shader quality is less about "more noise" and more about "right representation"

## External References

These platform notes were checked against official docs:

- Three.js `ShaderMaterial`: https://threejs.org/docs/pages/ShaderMaterial.html
- Three.js `MeshStandardMaterial`: https://threejs.org/docs/api/en/materials/MeshStandardMaterial
- Three.js `WebGLRenderTarget`: https://threejs.org/docs/pages/WebGLRenderTarget.html
- Three.js render targets manual: https://threejs.org/manual/en/rendertargets.html
- Roblox texture specifications and `SurfaceAppearance`: https://create.roblox.com/docs/art/modeling/texture-specifications
