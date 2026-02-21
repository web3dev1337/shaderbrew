/**
 * Main EffectTextureMaker application.
 * Coordinates rendering, GUI, presets, and export.
 */
import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FxgenShader } from "./pixy-api.js";
import { getDefaultEffectController, getDefaultEffectParameters } from "./defaults.js";
import { RenderPipeline } from "./render-pipeline.js";
import { SpriteSheet } from "./sprite-sheet.js";
import { AlphaExport } from "./alpha-export.js";
import { NoiseSphere } from "./noise-sphere.js";
import { GuiSetup } from "./ui/gui-setup.js";
import { PresetLoader } from "./preset-loader.js";

if (!WebGL.isWebGL2Available()) {
	document.body.appendChild(WebGL.getWebGLErrorMessage());
}

class App {
	constructor() {
		this.mouse = new THREE.Vector2(0.5, 0.5);
		this.clock = new THREE.Clock();
		this.preventSave = false;
	}

	init() {
		this._initGraphics();
		this._initEffectController();
		this._initPipeline();
		this._initNoiseSphere();
		this._initSpriteSheet();
		this._initAlphaExport();
		this._initGui();
		this._initPresets();
		console.log("[fxgen] initialized");
	}

	_initGraphics() {
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(512, 512);
		if (this.renderer.capabilities.isWebGL2) console.log("[fxgen] WebGL2");

		this.canvas = this.renderer.domElement;
		this.canvas.addEventListener("mousemove", e => {
			this.mouse.x = e.offsetX / this.canvas.width;
			this.mouse.y = e.offsetY / this.canvas.height;
		});
		document.body.appendChild(this.canvas);

		this.stats = new Stats();
		document.body.appendChild(this.stats.dom);

		this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
		this.camera.position.set(0, 0, 3.8);

		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.target.set(0, 0, 0);
		this.controls.addEventListener("change", () => this.render());

		this.grungeTexture = new THREE.TextureLoader().load("images/grunge.png");
		this.grungeTexture.wrapS = this.grungeTexture.wrapT = THREE.RepeatWrapping;
		this.grungeTexture.minFilter = THREE.LinearFilter;
		this.grungeTexture.magFilter = THREE.LinearFilter;
		this.grungeTexture.anisotropy = 16;
	}

	_initEffectController() {
		this.effectController = Object.assign(
			getDefaultEffectController(),
			getDefaultEffectParameters()
		);
	}

	_initPipeline() {
		this.pipeline = new RenderPipeline(this.renderer, this.canvas.width, this.canvas.height);
		const basePass = this.pipeline.buildPasses(this.effectController.type);
		this.baseDefaultUniforms = basePass.defaultUniforms;
	}

	_initNoiseSphere() {
		this.noiseSphere = new NoiseSphere();
	}

	_initSpriteSheet() {
		this.spriteSheet = new SpriteSheet(this.renderer, this.canvas.width, this.canvas.height);
	}

	_initAlphaExport() {
		this.alphaExport = new AlphaExport();
		this.alphaExport.attachToDOM(document.body);
	}

	_initGui() {
		this.gui = new GuiSetup(this);
		this.gui.build(this.effectController, this.spriteSheet, this.alphaExport);
		this.gui.rebuildParameters(this.effectController.type, this.effectController, this.baseDefaultUniforms);
	}

	_initPresets() {
		this.presetLoader = new PresetLoader(this);
		this.presetLoader.buildUI();
	}

	// --- Event handlers called from GUI ---

	onResolutionChange(val) {
		this.canvas.width = val;
		this.canvas.height = val;
		this._onResize();
	}

	onTypeChange(type) {
		const basePass = this.pipeline.buildPasses(type);
		this.baseDefaultUniforms = basePass.defaultUniforms;
		this.gui.rebuildParameters(type, this.effectController, this.baseDefaultUniforms);
	}

	onResetEffectParameters() {
		const defaults = getDefaultEffectParameters();
		Object.assign(this.effectController, defaults);
		this.gui.rebuildParameters(this.effectController.type, this.effectController, this.baseDefaultUniforms);
	}

	onResetColorBalance() {
		this.effectController.cColorBalanceShadowsR = 0;
		this.effectController.cColorBalanceShadowsG = 0;
		this.effectController.cColorBalanceShadowsB = 0;
		this.effectController.cColorBalanceMidtonesR = 0;
		this.effectController.cColorBalanceMidtonesG = 0;
		this.effectController.cColorBalanceMidtonesB = 0;
		this.effectController.cColorBalanceHighlightsR = 0;
		this.effectController.cColorBalanceHighlightsG = 0;
		this.effectController.cColorBalanceHighlightsB = 0;
		for (const k in this.gui.cb.controllers) this.gui.cb.controllers[k].updateDisplay();
	}

	onAlphaVisibilityChange(visible) {
		if (visible) {
			this.canvas.style.display = "none";
			this.alphaExport.alphaCanvas.style.display = null;
			this.alphaExport.needsUpdate = true;
		} else {
			this.canvas.style.display = null;
			this.alphaExport.alphaCanvas.style.display = "none";
		}
	}

	load() { this.gui.fileInput.click(); }

	onLoadFile(fileInput) {
		const reader = new FileReader();
		reader.addEventListener("load", e => {
			const preset = JSON.parse(e.target.result);
			this.applyPreset(preset);
		}, false);
		reader.readAsText(fileInput.files[0]);
	}

	applyPreset(preset) {
		this.canvas.width = preset.resolution;
		this.canvas.height = preset.resolution;
		this._onResize();

		const basePass = this.pipeline.buildPasses(preset.type);
		this.baseDefaultUniforms = basePass.defaultUniforms;
		this.effectController.type = preset.type;
		this.gui.rebuildParameters(preset.type, this.effectController, this.baseDefaultUniforms);

		for (const key in preset) {
			this.effectController[key] = preset[key];
		}
		this.gui.refreshAllDisplays();
	}

	save() {
		let json;
		try {
			json = JSON.stringify(this.effectController, null, "\t");
			json = json.replace(/[\n\t]+([\d.e\-[\]]+)/g, "$1");
		} catch (e) {
			json = JSON.stringify(this.effectController);
		}

		const blob = new Blob([json], { type: "text/plain" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "EffectTextureMaker_Untitled.json";
		a.click();
	}

	onSaveImage() {
		this.render();
		const dataUrl = this.canvas.toDataURL();
		window.open("about:blank").document.write("<img src='" + dataUrl + "'/>");
	}

	onSavePng() { this.render(); this.alphaExport.savePng(this.canvas, this.effectController.type); }
	onDownloadPng() { this.render(); this.alphaExport.downloadPng(this.canvas, this.effectController.type); }

	onSaveSpriteSheet() {
		this.spriteSheet.capture(time => {
			this.effectController.time = time;
			this.render();
			return this.pipeline.layers[this.pipeline.layers.length - 2].renderTarget.texture;
		}, this.canvas);

		if (!this.preventSave) {
			const dataUrl = this.canvas.toDataURL();
			window.open("about:blank").document.write("<img src='" + dataUrl + "'/>");
		}
	}

	onSaveSpriteSheetPng() {
		this.preventSave = true;
		this.onSaveSpriteSheet();
		this.preventSave = false;
		this.alphaExport.savePng(this.canvas, this.effectController.type);
	}

	onDownloadSpriteSheetPng() {
		this.preventSave = true;
		this.onSaveSpriteSheet();
		this.preventSave = false;
		this.alphaExport.downloadPng(this.canvas, this.effectController.type);
	}

	// --- Core loop ---

	animate() {
		if (this.effectController.animate) {
			this.effectController.time += this.clock.getDelta();
		}

		const timeStr = this.effectController.time.toString() + "0000000";
		const timeEl = document.getElementById("time");
		if (timeEl) timeEl.innerHTML = this.effectController.time === 0 ? "0.00000000" : timeStr.slice(0, 8);

		requestAnimationFrame(() => this.animate());
		this.render();

		if (this.alphaExport.visible && (this.effectController.animate || this.alphaExport.needsUpdate)) {
			this.alphaExport.updateAlphaPreview(this.canvas, this.effectController.type);
			this.alphaExport.needsUpdate = false;
		}
	}

	render() {
		this.stats.update();
		this.pipeline.render(
			this.effectController,
			this.mouse,
			this.camera,
			this.grungeTexture
		);

		if (this.effectController.cNoiseSphereEnable) {
			const secondToLastRT = this.pipeline.layers[this.pipeline.layers.length - 2].renderTarget;
			this.noiseSphere.render(this.renderer, this.camera, secondToLastRT.texture);
		}
	}

	_onResize() {
		this.renderer.setSize(this.canvas.width, this.canvas.height);
		this.pipeline.resize(this.canvas.width, this.canvas.height);
		this.spriteSheet.resize(this.canvas.width, this.canvas.height);
		this.render();
	}
}

// Boot
const app = new App();
app.init();
app.animate();
window.addEventListener("resize", () => app._onResize(), false);
console.log("[fxgen] ready");
