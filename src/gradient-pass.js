/**
 * Gradient map post-processing pass.
 * Applies a gradient color ramp to the composited output.
 */
import * as THREE from "three";
import { GradientMapShader } from "./shaders/gradient-map.js";

export class GradientPass {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
		this.scene.add(this.quad);

		this.material = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(GradientMapShader.uniforms),
			vertexShader: GradientMapShader.vertexShader,
			fragmentShader: GradientMapShader.fragmentShader,
			depthTest: false,
			depthWrite: false
		});

		this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}

	/**
	 * Apply gradient map to input texture, render to outputTarget (or screen if null).
	 */
	apply(inputTexture, gradientTexture, intensity, outputTarget) {
		this.material.uniforms.tDiffuse.value = inputTexture;
		this.material.uniforms.tGradient.value = gradientTexture;
		this.material.uniforms.intensity.value = intensity;
		this.quad.material = this.material;

		this.renderer.setRenderTarget(outputTarget || null);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(null);
	}

	resize(width, height) {
		this.renderTarget.dispose();
		this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}

	dispose() {
		this.renderTarget.dispose();
		this.material.dispose();
	}
}
