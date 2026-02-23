/**
 * Metallic map shader.
 * Generates metallic map from luminance with threshold and smoothing.
 */
export const MetallicShader = {
	uniforms: {
		tDiffuse: { value: null },
		metalness: { value: 0.0 },
		threshold: { value: 0.5 },
		smoothing: { value: 0.2 }
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
		uniform float metalness;
		uniform float threshold;
		uniform float smoothing;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
			float metal = smoothstep(threshold - smoothing, threshold + smoothing, lum);
			metal *= metalness;
			gl_FragColor = vec4(vec3(metal), 1.0);
		}
	`
};
