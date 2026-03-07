/**
 * Registry of all custom GLSL shaders available in the editor.
 * Maps display names to shader keys in shader-defs.js SHADERS object.
 */

// Catalog: display name → { shaderKey, file (sprite filename) }
export const CUSTOM_SHADER_CATALOG = [
	{ name: "Volumetric Nebula", key: "volumetric_nebula", file: "101-volumetric-nebula" },
	{ name: "Black Hole", key: "black_hole", file: "102-black-hole" },
	{ name: "Shockwave Pulse", key: "shockwave", file: "103-shockwave-pulse" },
	{ name: "Plasma Containment", key: "plasma_sphere", file: "104-plasma-containment" },
	{ name: "Julia Fractal Morph", key: "fractal_julia", file: "105-julia-fractal-morph" },
	{ name: "Warp Tunnel", key: "warp_tunnel", file: "106-warp-tunnel" },
	{ name: "Warp Inferno", key: "warp_inferno", file: "107-warp-inferno" },
	{ name: "Warp Void", key: "warp_void", file: "108-warp-void" },
	{ name: "Warp Electric", key: "warp_electric", file: "109-warp-electric" },
	{ name: "Warp Rainbow", key: "warp_rainbow", file: "110-warp-rainbow" },
	{ name: "Tornado Vortex", key: "tornado", file: "111-tornado-vortex" },
	{ name: "Bioluminescent", key: "bioluminescent", file: "112-bioluminescent" },
	{ name: "Singularity", key: "singularity", file: "113-singularity" },
	{ name: "Aurora Borealis", key: "aurora", file: "114-aurora-borealis" },
	{ name: "Cosmic Jellyfish", key: "cosmic_jellyfish", file: "115-cosmic-jellyfish" },
	{ name: "God Rays", key: "god_rays", file: "116-god-rays" },
	{ name: "Reality Glitch", key: "reality_glitch", file: "117-reality-glitch" },
	{ name: "Crystal Geode", key: "crystal_geode", file: "118-crystal-geode" },
	{ name: "Phoenix Rebirth", key: "phoenix", file: "119-phoenix-rebirth" },
	{ name: "Supernova", key: "supernova", file: "120-supernova" },
	{ name: "Dimensional Portal", key: "portal", file: "121-dimensional-portal" },
	{ name: "Deep Ocean", key: "deep_ocean", file: "122-deep-ocean" },
	{ name: "Galaxy Spiral", key: "galaxy", file: "123-galaxy-spiral" },
	{ name: "Mandelbrot Zoom", key: "mandelbrot_zoom", file: "124-mandelbrot-zoom" },
	{ name: "Chain Lightning", key: "chain_lightning", file: "125-chain-lightning" },
	{ name: "Solar Flare", key: "solar_flare", file: "126-solar-flare" },
	{ name: "Whirlpool", key: "whirlpool", file: "127-whirlpool" },
	{ name: "DNA Helix", key: "dna_helix", file: "128-dna-helix" },
	{ name: "Lava Flow", key: "lava_flow", file: "129-lava-flow" },
	{ name: "Time Vortex", key: "time_vortex", file: "130-time-vortex" },
	{ name: "Fluid Ink", key: "fluid_ink", file: "131-fluid-ink" },
	{ name: "Quantum Entangle", key: "quantum_entangle", file: "132-quantum-entangle" },
	{ name: "Gravity Well", key: "gravity_well", file: "133-gravity-well" },
	{ name: "Sound Visualizer", key: "sound_wave", file: "134-sound-visualizer" },
	{ name: "Smoke Ring", key: "smoke_ring", file: "135-smoke-ring" },
	{ name: "Magic Runes", key: "magic_runes", file: "136-magic-runes" },
	{ name: "Dissolve", key: "dissolve", file: "137-dissolve" },
	{ name: "Energy Shield", key: "energy_shield", file: "138-energy-shield" },
	{ name: "Reality Shatter", key: "reality_shatter", file: "139-reality-shatter" },
	{ name: "Blood Moon", key: "blood_moon", file: "140-blood-moon" },
	{ name: "Particle Collider", key: "particle_collider", file: "141-particle-collider" },
	{ name: "Dragon Breath", key: "dragon_breath", file: "142-dragon-breath" },
	{ name: "Neural Network", key: "neural_net", file: "143-neural-network" },
	{ name: "Cosmic Eye", key: "cosmic_eye", file: "144-cosmic-eye" },
	{ name: "Hypercube", key: "hypercube", file: "145-hypercube" },
	{ name: "Soul Extraction", key: "soul_extract", file: "146-soul-extraction" },
	{ name: "Neon Rain", key: "neon_rain", file: "147-neon-rain" },
	{ name: "Galaxy Collision", key: "galaxy_collision", file: "148-galaxy-collision" },
	{ name: "EMP Blast", key: "emp_blast", file: "149-emp-blast" },
	{ name: "Void Tendril", key: "void_tendril", file: "150-void-tendril" },
	{ name: "Summoning Circle", key: "summoning", file: "151-summoning-circle" },
	{ name: "Lightning Smite", key: "lightning_smite", file: "152-lightning-smite" },
	{ name: "Moon Surface Hero", key: "moon_surface_hero", file: "153-moon-surface-hero" },
	{ name: "Squid Tentacles Hero", key: "squid_tentacles_hero", file: "154-squid-tentacles-hero" },
];

// Prefix used for custom shader effect types in the layer system
export const CUSTOM_PREFIX = "GLSL:";

// All custom effect type names (used in layer panel effect picker)
export const CUSTOM_EFFECT_TYPES = CUSTOM_SHADER_CATALOG.map(s => CUSTOM_PREFIX + s.name);

// Look up shader key from a display name like "GLSL:Volumetric Nebula"
export function getCustomShaderKey(effectType) {
	if (!effectType.startsWith(CUSTOM_PREFIX)) return null;
	const name = effectType.slice(CUSTOM_PREFIX.length);
	const entry = CUSTOM_SHADER_CATALOG.find(s => s.name === name);
	return entry ? entry.key : null;
}

// Look up sprite file from effect type
export function getCustomSpriteFile(effectType) {
	if (!effectType.startsWith(CUSTOM_PREFIX)) return null;
	const name = effectType.slice(CUSTOM_PREFIX.length);
	const entry = CUSTOM_SHADER_CATALOG.find(s => s.name === name);
	return entry ? entry.file : null;
}

// Check if an effect type is custom GLSL
export function isCustomEffect(effectType) {
	return effectType.startsWith(CUSTOM_PREFIX);
}
