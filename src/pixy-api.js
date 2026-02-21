/**
 * Clean facade around pixy.module.min.js exports.
 * Import from here instead of pixy directly.
 */
import * as PIXY from "pixy";

export const FxgenShader = PIXY.FxgenShader;
export const FxgenShaderUtils = PIXY.FxgenShaderUtils;
export const ShaderChunk = PIXY.ShaderChunk;

// Re-export compositor classes (for multi-layer support)
export const Composer = PIXY.Composer;
export const ShaderPass = PIXY.ShaderPass;
export const Pass = PIXY.Pass;

/**
 * Create an effect shader configured for a given type.
 * Returns { shader, uniforms, material, defines }.
 */
export function createEffect(effectType) {
	const shader = new FxgenShader();
	shader.enable(effectType.toUpperCase());
	shader.enable("TOON");
	shader.enable("GLSL3");
	const uniforms = shader.generateUniforms();
	const defines = shader.generateDefines();
	const material = shader.createMaterial(uniforms, { defines });
	return { shader, uniforms, material, defines };
}

/**
 * Apply an effectController's values to a set of uniforms.
 */
export function applyParameters(uniforms, ec, THREE) {
	for (const key of Object.keys(ec)) {
		if (key === "resolution") continue;
		FxgenShaderUtils.SetShaderParameter(uniforms, key, ec[key]);
	}

	FxgenShaderUtils.SetShaderParameter(
		uniforms, "cColorBalanceShadows",
		new THREE.Vector3(ec.cColorBalanceShadowsR, ec.cColorBalanceShadowsG, ec.cColorBalanceShadowsB)
	);
	FxgenShaderUtils.SetShaderParameter(
		uniforms, "cColorBalanceMidtones",
		new THREE.Vector3(ec.cColorBalanceMidtonesR, ec.cColorBalanceMidtonesG, ec.cColorBalanceMidtonesB)
	);
	FxgenShaderUtils.SetShaderParameter(
		uniforms, "cColorBalanceHighlights",
		new THREE.Vector3(ec.cColorBalanceHighlightsR, ec.cColorBalanceHighlightsG, ec.cColorBalanceHighlightsB)
	);
	FxgenShaderUtils.SetShaderParameter(
		uniforms, "cDirection",
		new THREE.Vector2(ec.cDirectionX, ec.cDirectionY)
	);
}

/**
 * Inject a custom shader chunk into pixy's mutable ShaderChunk dictionary.
 */
export function injectShaderChunk(name, glslSource) {
	ShaderChunk[name] = glslSource;
}
