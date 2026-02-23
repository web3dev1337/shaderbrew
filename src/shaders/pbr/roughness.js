/**
 * Roughness map shader.
 * Derives roughness from luminance with configurable invert, contrast, and bias.
 */
export const RoughnessShader = {
	uniforms: {
		tDiffuse: { value: null },
		invert: { value: 0.0 },
		contrast: { value: 1.0 },
		bias: { value: 0.5 }
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform float invert;
		uniform float contrast;
		uniform float bias;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
			float rough = mix(lum, 1.0 - lum, invert);
			rough = clamp((rough - 0.5) * contrast + 0.5, 0.0, 1.0);
			rough = clamp(rough + (bias - 0.5), 0.0, 1.0);
			gl_FragColor = vec4(vec3(rough), 1.0);
		}
	`
};
