/**
 * Tile preview post-process pass.
 * Renders the input texture as a 2x2 tiled grid for seamless tiling visualization.
 */
import * as THREE from "three";
import { TilePreviewShader } from "./shaders/tile-preview.js";

export class TilePreviewPass {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.enabled = false;
		this.tiles = 2.0;

		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
		this.scene.add(this.quad);

		this.material = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(TilePreviewShader.uniforms),
			vertexShader: TilePreviewShader.vertexShader,
			fragmentShader: TilePreviewShader.fragmentShader,
			depthTest: false,
			depthWrite: false
		});
	}

	apply(inputTexture, outputTarget) {
		if (!this.enabled) return;
		this.material.uniforms.tDiffuse.value = inputTexture;
		this.material.uniforms.tiles.value = this.tiles;
		this.quad.material = this.material;
		this.renderer.setRenderTarget(outputTarget || null);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(null);
	}

	dispose() {
		this.material.dispose();
	}
}
