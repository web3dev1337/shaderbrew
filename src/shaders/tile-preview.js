/**
 * 2x2 tiling preview shader.
 * Repeats the input texture in a 2x2 grid so users can see seamless tiling.
 */
export const TilePreviewShader = {
	uniforms: {
		tDiffuse: { value: null },
		tiles: { value: 2.0 }
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
		uniform float tiles;
		varying vec2 vUv;
		void main() {
			vec2 tiledUv = fract(vUv * tiles);
			gl_FragColor = texture2D(tDiffuse, tiledUv);
		}
	`
};
