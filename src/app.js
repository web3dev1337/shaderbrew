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
import { LayerManager } from "./layer-manager.js";
import { Compositor } from "./compositor.js";
import { LayerPanel } from "./ui/layer-panel.js";
import { GradientEditor } from "./gradient-editor.js";
import { GradientPass } from "./gradient-pass.js";
import { TilePreviewPass } from "./tile-preview-pass.js";
import { Toolbar } from "./ui/toolbar.js";
import { PBRGenerator } from "./pbr-generator.js";
import { PBRPanel } from "./ui/pbr-panel.js";
import { Preview3D } from "./preview-3d.js";
import { History } from "./history.js";
import { ExportManager } from "./export.js";
import { ExportPanel } from "./ui/export-panel.js";

if (!WebGL.isWebGL2Available()) {
	document.body.appendChild(WebGL.getWebGLErrorMessage());
}

class App {
	constructor() {
		this.mouse = new THREE.Vector2(0.5, 0.5);
		this.clock = new THREE.Clock();
		this.preventSave = false;
		this.colorTarget = null;
		this.finalTarget = null;
	}

	init() {
		this._initGraphics();
		this._initEffectController();
		this._initPipeline();
		this._initLayers();
		this._initGradient();
		this._initTilePreview();
		this._initPBR();
		this._initPreview3D();
		this._initNoiseSphere();
		this._initSpriteSheet();
		this._initAlphaExport();
		this._initGui();
		this._initLayerPanel();
		this._initToolbar();
		this._initHistory();
		this._initExport();
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
		this.colorTarget = this._createColorTarget(this.canvas.width, this.canvas.height);
	}

	_initLayers() {
		this.layerManager = new LayerManager(this.renderer);
		const firstLayer = this.layerManager.addLayer(this.canvas.width, this.canvas.height, this.effectController.type);
		firstLayer.effectController = this.effectController;
		firstLayer.pipeline = this.pipeline;
		this.compositor = new Compositor(this.renderer, this.canvas.width, this.canvas.height);
	}

	_initGradient() {
		this.gradientEditor = new GradientEditor();
		this.gradientEditor.buildUI();
		this.gradientEditor.onChange = () => this.render();
		this.gradientPass = new GradientPass(this.renderer, this.canvas.width, this.canvas.height);
	}

	_initTilePreview() {
		this.tilePreviewPass = new TilePreviewPass(this.renderer, this.canvas.width, this.canvas.height);
	}

	_initPBR() {
		this.pbrGenerator = new PBRGenerator(this.renderer, this.canvas.width, this.canvas.height);
		this.pbrPanel = new PBRPanel(this.pbrGenerator, () => this.render());
		this.pbrPanel.build();
	}

	_initPreview3D() {
		this.preview3D = new Preview3D(this.pbrGenerator);
		this.preview3D.build();
	}

	_initToolbar() {
		this.toolbar = new Toolbar(this);
		this.toolbar.build();
	}

	_initExport() {
		this.exportManager = new ExportManager(this);
		this.exportPanel = new ExportPanel(this.exportManager);
		this.exportPanel.build();
	}

	_initHistory() {
		this.history = new History();
		this.history.init(
			() => ({ ...this.effectController }),
			snapshot => {
				Object.assign(this.effectController, snapshot);
				const type = this.effectController.type;
				const basePass = this.pipeline.buildPasses(type);
				this.baseDefaultUniforms = basePass.defaultUniforms;
				this.gui.rebuildParameters(type, this.effectController, this.baseDefaultUniforms);
				this.gui.refreshAllDisplays();
				this.render();
			}
		);
	}

	_initLayerPanel() {
		this.layerPanel = new LayerPanel(this.layerManager, () => this._onLayerChange());
		this.layerPanel.build();

		// Add gradient toggle button to preset bar area
		const gradBtn = document.createElement("button");
		gradBtn.textContent = "Gradient";
		gradBtn.style.cssText = "padding:8px 16px;border:1px solid #555;border-radius:4px;background:#1a1a2e;color:#e0e0ff;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s;position:fixed;bottom:55px;right:10px;z-index:9999";
		gradBtn.addEventListener("click", () => this.gradientEditor.toggle());
		gradBtn.addEventListener("mouseenter", () => { gradBtn.style.background = "#0f3460"; gradBtn.style.borderColor = "#e94560"; });
		gradBtn.addEventListener("mouseleave", () => { gradBtn.style.background = "#1a1a2e"; gradBtn.style.borderColor = "#555"; });
		document.body.appendChild(gradBtn);

		// PBR toggle button
		const pbrBtn = document.createElement("button");
		pbrBtn.textContent = "PBR Maps";
		pbrBtn.style.cssText = "padding:8px 16px;border:1px solid #555;border-radius:4px;background:#1a1a2e;color:#e0e0ff;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s;position:fixed;bottom:55px;right:110px;z-index:9999";
		pbrBtn.addEventListener("click", () => this.pbrPanel.toggle());
		pbrBtn.addEventListener("mouseenter", () => { pbrBtn.style.background = "#0f3460"; pbrBtn.style.borderColor = "#e94560"; });
		pbrBtn.addEventListener("mouseleave", () => { pbrBtn.style.background = "#1a1a2e"; pbrBtn.style.borderColor = "#555"; });
		document.body.appendChild(pbrBtn);

		// 3D preview toggle button
		const previewBtn = document.createElement("button");
		previewBtn.textContent = "3D Preview";
		previewBtn.style.cssText = "padding:8px 16px;border:1px solid #555;border-radius:4px;background:#1a1a2e;color:#e0e0ff;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s;position:fixed;bottom:55px;right:220px;z-index:9999";
		previewBtn.addEventListener("click", () => this.preview3D.toggle());
		previewBtn.addEventListener("mouseenter", () => { previewBtn.style.background = "#0f3460"; previewBtn.style.borderColor = "#e94560"; });
		previewBtn.addEventListener("mouseleave", () => { previewBtn.style.background = "#1a1a2e"; previewBtn.style.borderColor = "#555"; });
		document.body.appendChild(previewBtn);

		// Export toggle button
		const exportBtn = document.createElement("button");
		exportBtn.textContent = "Export";
		exportBtn.style.cssText = "padding:8px 16px;border:1px solid #e94560;border-radius:4px;background:#2a1030;color:#ff6b8a;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s;position:fixed;bottom:55px;right:340px;z-index:9999";
		exportBtn.addEventListener("click", () => this.exportPanel.toggle());
		exportBtn.addEventListener("mouseenter", () => { exportBtn.style.background = "#0f3460"; exportBtn.style.borderColor = "#e94560"; exportBtn.style.color = "#fff"; });
		exportBtn.addEventListener("mouseleave", () => { exportBtn.style.background = "#2a1030"; exportBtn.style.borderColor = "#e94560"; exportBtn.style.color = "#ff6b8a"; });
		document.body.appendChild(exportBtn);
	}

	_onLayerChange() {
		const active = this.layerManager.getActiveLayer();
		if (active) {
			this.effectController = active.effectController;
			this.pipeline = active.pipeline;
			this.baseDefaultUniforms = active.pipeline.layers[0]?.defaultUniforms || {};
			this.gui.rebuildParameters(this.effectController.type, this.effectController, this.baseDefaultUniforms);
			this.gui.refreshAllDisplays();
		}
		this.render();
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

		// Update active layer's name
		const active = this.layerManager.getActiveLayer();
		if (active) {
			active.name = type + " " + active.id;
			if (this.layerPanel) this.layerPanel.refresh();
		}
		if (this.history) this.history.recordImmediate();
	}

	onResetEffectParameters() {
		const defaults = getDefaultEffectParameters();
		Object.assign(this.effectController, defaults);
		this.gui.rebuildParameters(this.effectController.type, this.effectController, this.baseDefaultUniforms);
		if (this.history) this.history.recordImmediate();
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
		if (this.history) this.history.recordImmediate();
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
			return this.getFinalTexture() || this.colorTarget.texture;
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

		let baseTexture = null;
		let baseTarget = null;

		if (this.layerManager.layers.length > 1) {
			const results = this.layerManager.renderAll(this.mouse, this.camera, this.grungeTexture);
			const composited = this.compositor.composite(results);
			baseTexture = composited;
			baseTarget = this.compositor.lastOutput;
		} else {
			this.pipeline.render(
				this.effectController,
				this.mouse,
				this.camera,
				this.grungeTexture,
				this.colorTarget
			);
			baseTexture = this.colorTarget.texture;
			baseTarget = this.colorTarget;
		}

		let finalTexture = baseTexture;
		let finalTarget = baseTarget;

		if (this.gradientEditor.enabled && baseTexture) {
			this.gradientPass.apply(baseTexture, this.gradientEditor.getTexture(), this.gradientEditor.intensity, this.gradientPass.renderTarget);
			finalTexture = this.gradientPass.renderTarget.texture;
			finalTarget = this.gradientPass.renderTarget;
		}

		this.finalTarget = finalTarget;

		if (finalTexture) {
			if (this.tilePreviewPass.enabled) {
				this.tilePreviewPass.apply(finalTexture, null);
			} else {
				this.compositor._blit(finalTexture, null);
			}
		}

		if (this.effectController.cNoiseSphereEnable && finalTexture) {
			this.noiseSphere.render(this.renderer, this.camera, finalTexture);
		}

		if (this.pbrGenerator.enabled && finalTexture) {
			this.pbrGenerator.generate(finalTexture);
			this.pbrPanel.updatePreviews(this.renderer, finalTarget);
		}

		if (this.preview3D.visible && finalTexture) {
			this.preview3D.updateMaps(finalTexture);
			this.preview3D.render();
		}
	}

	_onResize() {
		this.renderer.setSize(this.canvas.width, this.canvas.height);
		this.pipeline.resize(this.canvas.width, this.canvas.height);
		this.layerManager.resize(this.canvas.width, this.canvas.height);
		this.compositor.resize(this.canvas.width, this.canvas.height);
		this.gradientPass.resize(this.canvas.width, this.canvas.height);
		this.pbrGenerator.resize(this.canvas.width, this.canvas.height);
		this.spriteSheet.resize(this.canvas.width, this.canvas.height);
		if (this.colorTarget) {
			this.colorTarget.dispose();
			this.colorTarget = this._createColorTarget(this.canvas.width, this.canvas.height);
		}
		if (this.toolbar) this.toolbar.updateResolution(this.canvas.width, this.canvas.height);
		this.render();
	}

	getFinalRenderTarget() {
		return this.finalTarget;
	}

	getFinalTexture() {
		return this.finalTarget ? this.finalTarget.texture : null;
	}

	_createColorTarget(width, height) {
		return new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			stencilBuffer: false
		});
	}
}

// Boot
const app = new App();
app.init();
app.animate();
window.addEventListener("resize", () => app._onResize(), false);
console.log("[fxgen] ready");
