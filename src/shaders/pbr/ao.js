/**
 * Ambient Occlusion shader.
 * Computes AO from height map using multi-sample blur difference.
 * Dark areas near height transitions simulate occlusion.
 */
export const AOShader = {
	uniforms: {
		tDiffuse: { value: null },
		resolution: { value: null },
		intensity: { value: 1.0 },
		radius: { value: 4.0 }
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
		uniform float intensity;
		uniform float radius;
		varying vec2 vUv;

		float getHeight(vec2 uv) {
			vec4 c = texture2D(tDiffuse, uv);
			return dot(c.rgb, vec3(0.299, 0.587, 0.114));
		}

		void main() {
			vec2 texel = 1.0 / resolution;
			float centerH = getHeight(vUv);

			// Multi-directional sample to estimate occlusion
			float ao = 0.0;
			float samples = 0.0;
			for (float angle = 0.0; angle < 6.283; angle += 0.785) {
				vec2 dir = vec2(cos(angle), sin(angle));
				for (float r = 1.0; r <= 4.0; r += 1.0) {
					if (r > radius) break;
					vec2 sampleUv = vUv + dir * texel * r;
					float sampleH = getHeight(sampleUv);
					float diff = centerH - sampleH;
					ao += max(diff, 0.0);
					samples += 1.0;
				}
			}

			ao = ao / max(samples, 1.0);
			ao = 1.0 - clamp(ao * intensity * 10.0, 0.0, 1.0);
			gl_FragColor = vec4(vec3(ao), 1.0);
		}
	`
};
