/**
 * Gradient map shader: maps grayscale luminance to a color gradient.
 * The gradient is passed as a 1D texture (256px wide).
 */

export const GradientMapShader = {
	uniforms: {
		tDiffuse: { value: null },
		tGradient: { value: null },
		intensity: { value: 1.0 }
	},

	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,

	fragmentShader: `
		uniform sampler2D tDiffuse;
		uniform sampler2D tGradient;
		uniform float intensity;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
			vec4 gradColor = texture2D(tGradient, vec2(luminance, 0.5));
			gl_FragColor = vec4(mix(texel.rgb, gradColor.rgb, intensity), texel.a);
		}
	`
};
