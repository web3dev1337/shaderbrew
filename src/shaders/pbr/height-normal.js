/**
 * Height-to-Normal map shader (Sobel filter).
 * Converts grayscale height map to tangent-space normal map.
 * Note: pixy already has this pass built in, but we provide a standalone
 * version for PBR map generation independent of the main pipeline.
 */
export const HeightNormalShader = {
	uniforms: {
		tDiffuse: { value: null },
		resolution: { value: null },
		strength: { value: 1.0 }
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
		uniform vec2 resolution;
		uniform float strength;
		varying vec2 vUv;

		float getHeight(vec2 uv) {
			vec4 c = texture2D(tDiffuse, uv);
			return dot(c.rgb, vec3(0.299, 0.587, 0.114));
		}

		void main() {
			vec2 texel = 1.0 / resolution;

			// Sobel operator
			float tl = getHeight(vUv + vec2(-texel.x, texel.y));
			float t  = getHeight(vUv + vec2(0.0, texel.y));
			float tr = getHeight(vUv + vec2(texel.x, texel.y));
			float l  = getHeight(vUv + vec2(-texel.x, 0.0));
			float r  = getHeight(vUv + vec2(texel.x, 0.0));
			float bl = getHeight(vUv + vec2(-texel.x, -texel.y));
			float b  = getHeight(vUv + vec2(0.0, -texel.y));
			float br = getHeight(vUv + vec2(texel.x, -texel.y));

			float dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
			float dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

			vec3 normal = normalize(vec3(-dx * strength, -dy * strength, 1.0));
			gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
		}
	`
};
