/**
 * Compositor: blends multiple rendered layer textures using ping-pong render targets.
 */
import * as THREE from "three";
import { BlendShader, blendModeIndex } from "./shaders/blend.js";

export class Compositor {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;
		this.lastOutput = null;

		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
		this.scene.add(this.quad);

		this.blendMaterial = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(BlendShader.uniforms),
			vertexShader: BlendShader.vertexShader,
			fragmentShader: BlendShader.fragmentShader,
			depthTest: false,
			depthWrite: false
		});

		// Ping-pong targets
		this.rtA = this._createRT();
		this.rtB = this._createRT();
	}

	/**
	 * Composite an array of layer results.
	 * Each entry: { texture, opacity, blendMode, visible }
	 * Returns the final render target texture.
	 */
	composite(layerResults, outputTarget) {
		const visible = layerResults.filter(l => l.visible);
		if (visible.length === 0) {
			this.lastOutput = null;
			return null;
		}

		// First layer: just copy to rtA
		this._blit(visible[0].texture, this.rtA);

		let readTarget = this.rtA;
		let writeTarget = this.rtB;

		// Blend subsequent layers
		for (let i = 1; i < visible.length; i++) {
			const layer = visible[i];
			this.blendMaterial.uniforms.tBase.value = readTarget.texture;
			this.blendMaterial.uniforms.tBlend.value = layer.texture;
			this.blendMaterial.uniforms.opacity.value = layer.opacity;
			this.blendMaterial.uniforms.blendMode.value = blendModeIndex(layer.blendMode);

			this.quad.material = this.blendMaterial;
			this.renderer.setRenderTarget(i === visible.length - 1 && outputTarget ? outputTarget : writeTarget);
			this.renderer.render(this.scene, this.camera);
			this.renderer.setRenderTarget(null);

			// Swap
			[readTarget, writeTarget] = [writeTarget, readTarget];
		}

		// If only 1 layer, optionally blit to output
		if (visible.length === 1) {
			if (outputTarget) this._blit(this.rtA.texture, outputTarget);
			this.lastOutput = this.rtA;
			return this.rtA.texture;
		}

		this.lastOutput = readTarget;
		return readTarget.texture;
	}

	_blit(texture, target) {
		this.blendMaterial.uniforms.tBase.value = texture;
		this.blendMaterial.uniforms.tBlend.value = texture;
		this.blendMaterial.uniforms.opacity.value = 1.0;
		this.blendMaterial.uniforms.blendMode.value = 0;
		this.quad.material = this.blendMaterial;
		this.renderer.setRenderTarget(target);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(null);
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		this.rtA.dispose();
		this.rtB.dispose();
		this.rtA = this._createRT();
		this.rtB = this._createRT();
	}

	_createRT() {
		return new THREE.WebGLRenderTarget(this.width, this.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}

	dispose() {
		this.rtA.dispose();
		this.rtB.dispose();
		this.blendMaterial.dispose();
	}
}
