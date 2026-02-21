/**
 * Blend mode shader for compositing layers.
 * Supports: Normal, Multiply, Screen, Overlay, Add, Subtract, SoftLight, HardLight, Difference.
 */

export const BlendShader = {
	uniforms: {
		tBase: { value: null },
		tBlend: { value: null },
		opacity: { value: 1.0 },
		blendMode: { value: 0 }
	},

	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,

	fragmentShader: `
		uniform sampler2D tBase;
		uniform sampler2D tBlend;
		uniform float opacity;
		uniform int blendMode;
		varying vec2 vUv;

		vec3 blendNormal(vec3 base, vec3 blend) { return blend; }
		vec3 blendMultiply(vec3 base, vec3 blend) { return base * blend; }
		vec3 blendScreen(vec3 base, vec3 blend) { return 1.0 - (1.0 - base) * (1.0 - blend); }
		vec3 blendOverlay(vec3 base, vec3 blend) {
			return vec3(
				base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
				base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
				base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
			);
		}
		vec3 blendAdd(vec3 base, vec3 blend) { return min(base + blend, 1.0); }
		vec3 blendSubtract(vec3 base, vec3 blend) { return max(base - blend, 0.0); }
		vec3 blendSoftLight(vec3 base, vec3 blend) {
			return vec3(
				blend.r < 0.5 ? 2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r) : sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r),
				blend.g < 0.5 ? 2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g) : sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g),
				blend.b < 0.5 ? 2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b) : sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b)
			);
		}
		vec3 blendHardLight(vec3 base, vec3 blend) { return blendOverlay(blend, base); }
		vec3 blendDifference(vec3 base, vec3 blend) { return abs(base - blend); }

		void main() {
			vec4 baseColor = texture2D(tBase, vUv);
			vec4 blendColor = texture2D(tBlend, vUv);

			vec3 result;
			if (blendMode == 0) result = blendNormal(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 1) result = blendMultiply(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 2) result = blendScreen(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 3) result = blendOverlay(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 4) result = blendAdd(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 5) result = blendSubtract(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 6) result = blendSoftLight(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 7) result = blendHardLight(baseColor.rgb, blendColor.rgb);
			else if (blendMode == 8) result = blendDifference(baseColor.rgb, blendColor.rgb);
			else result = blendColor.rgb;

			gl_FragColor = vec4(mix(baseColor.rgb, result, opacity * blendColor.a), 1.0);
		}
	`
};

export const BLEND_MODES = [
	"Normal", "Multiply", "Screen", "Overlay",
	"Add", "Subtract", "SoftLight", "HardLight", "Difference"
];

export function blendModeIndex(name) {
	return BLEND_MODES.indexOf(name);
}
