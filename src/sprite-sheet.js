/**
 * Sprite sheet capture and export.
 */
import * as THREE from "three";
import { CopyShader } from "three/addons/shaders/CopyShader.js";

export class SpriteSheet {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.dimension = 8;
		this.time = 0;
		this.timeLength = 3;
		this.timeStep = 0.1;

		this.uniforms = THREE.UniformsUtils.clone(CopyShader.uniforms);
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: CopyShader.vertexShader,
			fragmentShader: CopyShader.fragmentShader,
			depthTest: false,
			depthWrite: false
		});
		this.uniforms.opacity.value = 1;

		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene = new THREE.Scene();
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
		this.scene.add(this.quad);

		this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}

	/**
	 * Capture sprite sheet frames by stepping time on the given render callback.
	 * renderAtTime(time) should render the pipeline and return the second-to-last RT.
	 */
	capture(renderAtTime, canvas) {
		const cellScale = Math.floor(canvas.width / this.dimension) / canvas.width;
		const originalTime = this.time;

		this.renderer.setRenderTarget(this.renderTarget);
		this.renderer.clear();
		this.renderer.setRenderTarget(null);

		for (let row = 0; row < this.dimension; row++) {
			for (let col = 0; col < this.dimension; col++) {
				const frameTime = this.timeStep * this.dimension * row + this.timeStep * col;
				if (frameTime >= this.timeLength) break;

				const sourceTexture = renderAtTime(originalTime + frameTime);
				this.uniforms.tDiffuse.value = sourceTexture;
				this.quad.scale.set(cellScale, cellScale, 1);
				this.quad.position.set(
					2 * cellScale * col - 1 + cellScale,
					1 - 2 * cellScale * row - cellScale,
					0
				);

				this.renderer.autoClear = false;
				this.renderer.setRenderTarget(this.renderTarget);
				this.renderer.render(this.scene, this.camera);
				this.renderer.setRenderTarget(null);
				this.renderer.autoClear = true;
			}
		}

		// Reset quad and render final to screen
		this.quad.scale.set(1, 1, 1);
		this.quad.position.set(0, 0, 0);
		this.uniforms.tDiffuse.value = this.renderTarget.texture;
		this.renderer.render(this.scene, this.camera);

		return canvas;
	}

	resize(width, height) {
		this.renderTarget.dispose();
		this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}
}
