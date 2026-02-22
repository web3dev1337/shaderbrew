/**
 * lil-gui setup for effect parameters.
 * Builds the GUI panels: root, parameters, toon, tiling, normalMap, colorBalance, spriteSheet, alpha.
 */
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { EFFECT_TYPES, EFFECT_PARAMETERS, PARAMETER_CONFIG, PARAMETER_OVERRIDES } from "../defaults.js";

export class GuiSetup {
	constructor(app) {
		this.app = app;
		this.root = null;
		this.pars = null;
		this.parsItems = [];
		this.tone = null;
		this.tiling = null;
		this.normalMap = null;
		this.cb = null;
	}

	build(effectController, spriteSheet, alphaExport) {
		const app = this.app;

		// File input for loading presets
		this.fileInput = document.createElement("input");
		this.fileInput.type = "file";
		this.fileInput.addEventListener("change", () => app.onLoadFile(this.fileInput));
		this.fileInput.addEventListener("click", e => { e.target.value = null; });

		this.root = new GUI();
		this.root.add(app, "load").name("Load JSON");
		this.root.add(app, "save").name("Save Effect");
		this.root.add(app, "saveProject").name("Save Project");

		const resCtrl = this.root.add(effectController, "resolution", ["8", "16", "32", "64", "128", "256", "512", "1024", "2048"]);
		this._track(resCtrl, val => app.onResolutionChange(val), true);

		const typeCtrl = this.root.add(effectController, "type", EFFECT_TYPES);
		this._track(typeCtrl, type => app.onTypeChange(type), true);

		this._track(this.root.add(effectController, "time", 0, 100));
		this._track(this.root.add(effectController, "animate"), null, true);

		// Parameters folder
		this.pars = this.root.addFolder("Parameters");
		this.pars.add(app, "onResetEffectParameters").name("reset");

		this._track(this.root.add(effectController, "polarConversion"), null, true);

		// Toon folder
		this.tone = this.root.addFolder("Toon");
		this._track(this.tone.add(effectController, "cToonEnable").name("enable"), null, true);
		this._track(this.tone.add(effectController, "cToonDark", 0, 1).name("dark"));
		this._track(this.tone.add(effectController, "cToonLight", 0, 1).name("light"));
		this.tone.open(false);

		// Tiling folder
		const tilingFolder = this.root.addFolder("Tiling");
		this._track(tilingFolder.add(effectController, "tiling").name("enable"), null, true);
		this._track(tilingFolder.add(effectController, "cRadialMask", 0, 1).name("radial mask"));
		tilingFolder.open(false);
		this.tiling = tilingFolder;

		// NormalMap folder
		const nmFolder = this.root.addFolder("NormalMap");
		this._track(nmFolder.add(effectController, "normalMap").name("Generate"), null, true);
		this._track(nmFolder.add(effectController, "cHeightScale", 0, 10));
		nmFolder.open(false);
		this.normalMap = nmFolder;

		// Color Balance folder
		const cbFolder = this.root.addFolder("ColorBalance");
		this._track(cbFolder.add(effectController, "cColorBalanceShadowsR", -1, 1, 0.025).name("Shadows-R"));
		this._track(cbFolder.add(effectController, "cColorBalanceShadowsG", -1, 1, 0.025).name("Shadows-G"));
		this._track(cbFolder.add(effectController, "cColorBalanceShadowsB", -1, 1, 0.025).name("Shadows-B"));
		this._track(cbFolder.add(effectController, "cColorBalanceMidtonesR", -1, 1, 0.025).name("Midtones-R"));
		this._track(cbFolder.add(effectController, "cColorBalanceMidtonesG", -1, 1, 0.025).name("Midtones-G"));
		this._track(cbFolder.add(effectController, "cColorBalanceMidtonesB", -1, 1, 0.025).name("Midtones-B"));
		this._track(cbFolder.add(effectController, "cColorBalanceHighlightsR", -1, 1, 0.025).name("Highlights-R"));
		this._track(cbFolder.add(effectController, "cColorBalanceHighlightsG", -1, 1, 0.025).name("Highlights-G"));
		this._track(cbFolder.add(effectController, "cColorBalanceHighlightsB", -1, 1, 0.025).name("Highlights-B"));
		cbFolder.add(app, "onResetColorBalance").name("reset");
		cbFolder.open(false);
		this.cb = cbFolder;

		// SpriteSheet folder
		const ssFolder = this.root.addFolder("SpriteSheet");
		ssFolder.add(spriteSheet, "dimension", 2, 32).step(1);
		ssFolder.add(spriteSheet, "time", 0, 1000);
		ssFolder.add(spriteSheet, "timeLength", 0.1, 1000);
		ssFolder.add(spriteSheet, "timeStep", 0.0001, 100);
		ssFolder.add(app, "onSaveSpriteSheet").name("Save (SpriteSheet)");
		ssFolder.add(app, "onSaveSpriteSheetPng").name("Save (SpriteSheet with alpha)");
		ssFolder.add(app, "onDownloadSpriteSheetPng").name("Download (SpriteSheet with alpha)");
		ssFolder.open(false);

		// Alpha PNG folder
		const alphaFolder = this.root.addFolder("Image with alpha (PNG)");
		alphaFolder.add(alphaExport, "threshold", 0, 1).onChange(() => { alphaExport.needsUpdate = true; });
		alphaFolder.add(alphaExport, "tolerance", 0, 1).onChange(() => { alphaExport.needsUpdate = true; });
		alphaFolder.add(alphaExport, "blur", 0, 10, 1).onChange(() => { alphaExport.needsUpdate = true; });
		alphaFolder.add(alphaExport, "visible").onChange(v => app.onAlphaVisibilityChange(v));
		alphaFolder.add(app, "onSavePng").name("Save (PNG)");
		alphaFolder.add(app, "onDownloadPng").name("Download (PNG)");
		alphaFolder.open(false);

		this.root.add(app, "onSaveImage").name("Save");
	}

	/**
	 * Rebuild the Parameters folder for the current effect type.
	 */
	rebuildParameters(effectType, effectController, defaultUniforms) {
		for (const item of this.parsItems) item.destroy();
		this.parsItems = [];

		const paramNames = EFFECT_PARAMETERS[effectType] || [];
		const overrides = PARAMETER_OVERRIDES[effectType] || {};

		for (const paramName of paramNames) {
			// Reset to default uniform value if available
			if (paramName in defaultUniforms) {
				effectController[paramName] = defaultUniforms[paramName].value;
			}

			const config = PARAMETER_CONFIG[paramName];
			if (!config) continue;

			if (paramName.indexOf("Enable") >= 0) {
				const ctrl = this.pars.add(effectController, paramName).name(config.name);
				this._track(ctrl, null, true);
				this.parsItems.push(ctrl);
			} else {
				const override = overrides[paramName];
				if (override) {
					if ("defaultValue" in override) {
						effectController[paramName] = override.defaultValue;
					}
					const ctrl = this.pars.add(effectController, paramName, override.minValue, override.maxValue).name(config.name);
					if ("step" in config) ctrl.step(config.step);
					if ("step" in override) ctrl.step(override.step);
					this._track(ctrl);
					this.parsItems.push(ctrl);
				} else {
					const ctrl = this.pars.add(effectController, paramName, config.minValue, config.maxValue).name(config.name);
					if ("step" in config) ctrl.step(config.step);
					this._track(ctrl);
					this.parsItems.push(ctrl);
				}
			}
		}
	}

	refreshAllDisplays() {
		for (const k in this.root.controllers) this.root.controllers[k].updateDisplay();
		for (const k in this.pars.controllers) this.pars.controllers[k].updateDisplay();
		for (const k in this.tone.controllers) this.tone.controllers[k].updateDisplay();
		for (const k in this.tiling.controllers) this.tiling.controllers[k].updateDisplay();
		for (const k in this.normalMap.controllers) this.normalMap.controllers[k].updateDisplay();
		for (const k in this.cb.controllers) this.cb.controllers[k].updateDisplay();
	}

	_track(ctrl, onChange, immediate = false) {
		if (!ctrl) return ctrl;
		ctrl.onChange(value => {
			if (onChange) onChange(value);
			if (this.app && this.app.requestRender) this.app.requestRender();
			if (!this.app.history || this.app.historySuspended) return;
			if (immediate) this.app.history.recordImmediate();
			else this.app.history.record();
		});
		if (!immediate && ctrl.onFinishChange) {
			ctrl.onFinishChange(() => {
				if (this.app.history) this.app.history.recordImmediate();
			});
		}
		return ctrl;
	}
}
