/**
 * 6-pass render pipeline for a single effect layer.
 * Base → PolarConversion → ColorBalance → Tiling → NormalMap → Copy
 */
import * as THREE from "three";
import { FxgenShader, FxgenShaderUtils } from "./pixy-api.js";

export class RenderPipeline {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;
		this.scene = new THREE.Scene();
		this.camera = new THREE.Camera();
		this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial()));

		this.shaderDefines = new FxgenShader().generateDefines();
		this.layers = [];
	}

	/**
	 * Build all 6 pipeline passes for a given effect type.
	 */
	buildPasses(effectType) {
		this.disposePasses();
		this.layers = [];

		const shader = new FxgenShader();

		// Pass 0: Base effect
		shader.enable(effectType.toUpperCase());
		shader.enable("TOON");
		shader.enable("GLSL3");
		const basePass = {
			name: "Base",
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: this._createRT()
		};
		basePass.defaultUniforms = THREE.UniformsUtils.clone(basePass.uniforms);
		basePass.material = shader.createMaterial(basePass.uniforms);
		basePass.material.defines = this.shaderDefines;
		this.layers.push(basePass);

		// Pass 1: Polar Conversion
		shader.clear();
		shader.enable("POLARCONVERSION");
		const polarPass = {
			name: "PolarConversion",
			tDiffuse: this.layers[0].renderTarget.texture,
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: this._createRT()
		};
		polarPass.material = shader.createMaterial(polarPass.uniforms);
		polarPass.material.defines = this.shaderDefines;
		this.layers.push(polarPass);

		// Pass 2: Color Balance
		shader.clear();
		shader.enable("COLORBALANCE");
		const cbPass = {
			name: "ColorBalance",
			tDiffuse: this.layers[1].renderTarget.texture,
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: this._createRT()
		};
		cbPass.material = shader.createMaterial(cbPass.uniforms);
		cbPass.material.defines = this.shaderDefines;
		this.layers.push(cbPass);

		// Pass 3: Tiling
		shader.clear();
		shader.enable("TILING");
		const tilingPass = {
			name: "Tiling",
			tDiffuse: this.layers[2].renderTarget.texture,
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: this._createRT(THREE.NearestFilter)
		};
		tilingPass.tDiffuse.wrapS = tilingPass.tDiffuse.wrapT = THREE.RepeatWrapping;
		tilingPass.material = shader.createMaterial(tilingPass.uniforms);
		tilingPass.material.defines = this.shaderDefines;
		this.layers.push(tilingPass);

		// Pass 4: Normal Map
		shader.clear();
		shader.enable("HEIGHT2NORMALSOBEL");
		const normalPass = {
			name: "NormalMap",
			tDiffuse: this.layers[3].renderTarget.texture,
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: this._createRT()
		};
		normalPass.material = shader.createMaterial(normalPass.uniforms);
		normalPass.material.defines = this.shaderDefines;
		this.layers.push(normalPass);

		// Pass 5: Copy (final blit)
		shader.clear();
		shader.enable("COPY");
		const copyPass = {
			name: "Copy",
			tDiffuse: this.layers[4].renderTarget.texture,
			uniforms: shader.generateUniforms(),
			material: null,
			renderTarget: null
		};
		copyPass.material = shader.createMaterial(copyPass.uniforms);
		copyPass.material.defines = this.shaderDefines;
		this.layers.push(copyPass);

		return basePass;
	}

	/**
	 * Render the full pipeline with given effect controller settings.
	 */
	render(effectController, mouse, perspectiveCamera, grungeTexture, outputTarget) {
		for (let i = 0; i < this.layers.length; i++) {
			let pass = this.layers[i];
			const target = outputTarget && i === this.layers.length - 1 ? outputTarget : pass.renderTarget;
			const tDiffuse = pass.tDiffuse;

			// Skip disabled passes (jump to Copy)
			if (pass.name === "NormalMap" && !effectController.normalMap) {
				pass = this.layers[this.layers.length - 1];
			}
			if (pass.name === "PolarConversion" && !effectController.polarConversion) {
				pass = this.layers[this.layers.length - 1];
			}
			if (pass.name === "Tiling" && !effectController.tiling) {
				pass = this.layers[this.layers.length - 1];
			}

			// Set uniforms
			pass.uniforms.resolution.value = new THREE.Vector2(this.width, this.height);
			if (perspectiveCamera) {
				perspectiveCamera.getWorldPosition(pass.uniforms.cameraPos.value);
				perspectiveCamera.getWorldDirection(pass.uniforms.cameraDir.value);
			} else {
				pass.uniforms.cameraPos.value.set(0, 0, 3.8);
				pass.uniforms.cameraDir.value.set(0, 0, -1);
			}
			pass.uniforms.mouse.value.copy(mouse);
			pass.uniforms.tDiffuse.value = tDiffuse;

			// Apply effect parameters
			for (const key of Object.keys(effectController)) {
				if (key === "resolution") continue;
				FxgenShaderUtils.SetShaderParameter(pass.uniforms, key, effectController[key]);
			}

			// Compound uniforms
			FxgenShaderUtils.SetShaderParameter(pass.uniforms, "cColorBalanceShadows",
				new THREE.Vector3(effectController.cColorBalanceShadowsR, effectController.cColorBalanceShadowsG, effectController.cColorBalanceShadowsB));
			FxgenShaderUtils.SetShaderParameter(pass.uniforms, "cColorBalanceMidtones",
				new THREE.Vector3(effectController.cColorBalanceMidtonesR, effectController.cColorBalanceMidtonesG, effectController.cColorBalanceMidtonesB));
			FxgenShaderUtils.SetShaderParameter(pass.uniforms, "cColorBalanceHighlights",
				new THREE.Vector3(effectController.cColorBalanceHighlightsR, effectController.cColorBalanceHighlightsG, effectController.cColorBalanceHighlightsB));
			FxgenShaderUtils.SetShaderParameter(pass.uniforms, "cDirection",
				new THREE.Vector2(effectController.cDirectionX, effectController.cDirectionY));
			if (grungeTexture) {
				FxgenShaderUtils.SetShaderParameter(pass.uniforms, "tGrunge", grungeTexture);
			}

			// Render pass
			this.scene.overrideMaterial = pass.material;
			this.renderer.setRenderTarget(target);
			this.renderer.render(this.scene, this.camera);
			this.renderer.setRenderTarget(null);
			this.scene.overrideMaterial = null;
		}
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		for (const pass of this.layers) {
			if (pass.renderTarget) {
				pass.renderTarget.dispose();
				pass.renderTarget = this._createRT(
					pass.name === "Tiling" ? THREE.NearestFilter : THREE.LinearFilter
				);
			}
		}
		// Rechain tDiffuse references
		for (let i = 1; i < this.layers.length; i++) {
			if (this.layers[i].tDiffuse !== undefined) {
				this.layers[i].tDiffuse = this.layers[i - 1].renderTarget.texture;
				if (this.layers[i].name === "Tiling") {
					this.layers[i].tDiffuse.wrapS = this.layers[i].tDiffuse.wrapT = THREE.RepeatWrapping;
				}
			}
		}
	}

	disposePasses() {
		for (const pass of this.layers) {
			if (pass.renderTarget) pass.renderTarget.dispose();
			if (pass.material) pass.material.dispose();
		}
		this.layers = [];
	}

	_createRT(filter = THREE.LinearFilter) {
		return new THREE.WebGLRenderTarget(this.width, this.height, {
			minFilter: filter,
			magFilter: filter,
			stencilBuffer: false
		});
	}
}
