/**
 * PBR map generator.
 * Takes the rendered effect texture and generates Normal, Roughness, AO, and Metallic maps.
 * Each map is rendered to its own WebGLRenderTarget for display and export.
 */
import * as THREE from "three";
import { HeightNormalShader } from "./shaders/pbr/height-normal.js";
import { RoughnessShader } from "./shaders/pbr/roughness.js";
import { AOShader } from "./shaders/pbr/ao.js";
import { MetallicShader } from "./shaders/pbr/metallic.js";

export class PBRGenerator {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;
		this.enabled = false;

		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
		this.scene.add(this.quad);

		this.params = {
			normalStrength: 2.0,
			roughnessInvert: 0.0,
			roughnessContrast: 1.0,
			roughnessBias: 0.5,
			aoIntensity: 1.0,
			aoRadius: 4.0,
			metalness: 0.0,
			metallicThreshold: 0.5,
			metallicSmoothing: 0.2
		};

		this._initMaterials();
		this._initRenderTargets();
	}

	_initMaterials() {
		this.normalMat = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(HeightNormalShader.uniforms),
			vertexShader: HeightNormalShader.vertexShader,
			fragmentShader: HeightNormalShader.fragmentShader,
			depthTest: false, depthWrite: false
		});

		this.roughnessMat = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(RoughnessShader.uniforms),
			vertexShader: RoughnessShader.vertexShader,
			fragmentShader: RoughnessShader.fragmentShader,
			depthTest: false, depthWrite: false
		});

		this.aoMat = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(AOShader.uniforms),
			vertexShader: AOShader.vertexShader,
			fragmentShader: AOShader.fragmentShader,
			depthTest: false, depthWrite: false
		});

		this.metallicMat = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(MetallicShader.uniforms),
			vertexShader: MetallicShader.vertexShader,
			fragmentShader: MetallicShader.fragmentShader,
			depthTest: false, depthWrite: false
		});
	}

	_initRenderTargets() {
		const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: false };
		this.normalRT = new THREE.WebGLRenderTarget(this.width, this.height, opts);
		this.roughnessRT = new THREE.WebGLRenderTarget(this.width, this.height, opts);
		this.aoRT = new THREE.WebGLRenderTarget(this.width, this.height, opts);
		this.metallicRT = new THREE.WebGLRenderTarget(this.width, this.height, opts);
	}

	generate(inputTexture) {
		if (!this.enabled) return;
		const res = new THREE.Vector2(this.width, this.height);

		// Normal map
		this.normalMat.uniforms.tDiffuse.value = inputTexture;
		this.normalMat.uniforms.resolution.value = res;
		this.normalMat.uniforms.strength.value = this.params.normalStrength;
		this._renderPass(this.normalMat, this.normalRT);

		// Roughness map
		this.roughnessMat.uniforms.tDiffuse.value = inputTexture;
		this.roughnessMat.uniforms.invert.value = this.params.roughnessInvert;
		this.roughnessMat.uniforms.contrast.value = this.params.roughnessContrast;
		this.roughnessMat.uniforms.bias.value = this.params.roughnessBias;
		this._renderPass(this.roughnessMat, this.roughnessRT);

		// AO map
		this.aoMat.uniforms.tDiffuse.value = inputTexture;
		this.aoMat.uniforms.resolution.value = res;
		this.aoMat.uniforms.intensity.value = this.params.aoIntensity;
		this.aoMat.uniforms.radius.value = this.params.aoRadius;
		this._renderPass(this.aoMat, this.aoRT);

		// Metallic map
		this.metallicMat.uniforms.tDiffuse.value = inputTexture;
		this.metallicMat.uniforms.metalness.value = this.params.metalness;
		this.metallicMat.uniforms.threshold.value = this.params.metallicThreshold;
		this.metallicMat.uniforms.smoothing.value = this.params.metallicSmoothing;
		this._renderPass(this.metallicMat, this.metallicRT);
	}

	getMapTextures() {
		return {
			normal: this.normalRT.texture,
			roughness: this.roughnessRT.texture,
			ao: this.aoRT.texture,
			metallic: this.metallicRT.texture
		};
	}

	_renderPass(material, target) {
		this.quad.material = material;
		this.renderer.setRenderTarget(target);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(null);
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		this.normalRT.dispose();
		this.roughnessRT.dispose();
		this.aoRT.dispose();
		this.metallicRT.dispose();
		this._initRenderTargets();
	}

	dispose() {
		this.normalRT.dispose();
		this.roughnessRT.dispose();
		this.aoRT.dispose();
		this.metallicRT.dispose();
		this.normalMat.dispose();
		this.roughnessMat.dispose();
		this.aoMat.dispose();
		this.metallicMat.dispose();
	}
}
