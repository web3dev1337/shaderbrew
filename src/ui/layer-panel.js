/**
 * Layer panel UI: shows layers list with controls for visibility, opacity, blend mode, reorder.
 * Effect picker: categorized grid popup with keyboard navigation replaces raw <select>.
 */
import { BLEND_MODES } from "../shaders/blend.js";
import { EFFECT_TYPES } from "../defaults.js";
import { CUSTOM_EFFECT_TYPES, CUSTOM_PREFIX, isCustomEffect, getCustomShaderKey } from "../custom-shader-registry.js";
import { SHADERS } from "../../shader-defs.js";
import { generateThumbnails, getCachedThumbnail } from "./effect-thumbnails.js";

const EFFECT_CATEGORIES = {
	"Fire & Heat": ["Flame", "FlameEye", "Fire", "FlameLance", "Bonfire", "Explosion", "Explosion2"],
	"Light & Glow": ["Flash", "Flare", "Flare2", "Flare3", "LensFlare", "Sun", "Solar", "Corona", "Spark", "Light", "Energy", "Electric"],
	"Shapes": ["Circle", "Ring", "Cross", "Cone", "Flower", "FlowerFun", "WaveRing", "Pentagon", "DiamondGear", "MagicCircle", "Mandara", "Checker"],
	"Nature": ["Cloud", "Cloud2", "Smoke", "Snow", "Bubbles", "Caustics", "WaterTurbulence", "Wood"],
	"Noise": ["CoherentNoise", "PerlinNoise", "SeamlessNoise", "BooleanNoise", "CellNoise", "TurbulentNoise", "FbmNoise", "FbmNoise2", "FbmNoise3", "RandomNoise", "VoronoiNoise", "SparkNoise", "MarbleNoise", "TessNoise", "GradientNoise"],
	"Beams & Lines": ["Laser", "Laser2", "Gradation", "GradationLine", "Lightning"],
	"Organic": ["Cell", "Speckle", "Grunge", "InkSplat", "BrushStroke", "Squiggles", "Trabeculum"],
	"Particle & FX": ["Particle", "BinaryMatrix"],
	"Custom GLSL": CUSTOM_EFFECT_TYPES,
};

export class LayerPanel {
	constructor(layerManager, onLayerChange) {
		this.layerManager = layerManager;
		this.onLayerChange = onLayerChange;
		this.container = null;
		this.listEl = null;
		this.dragSrcIndex = null;
		this._pickerEl = null;
		this._pickerLayerIdx = -1;
		this._pickerFocusIdx = -1;
		this._pickerItems = [];
		this._renderer = null;
		this._thumbCancel = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "layer-panel";
		this.container.style.cssText = `
			position: fixed; left: 0; top: 0; bottom: 44px; width: 260px;
			background: rgba(8, 8, 16, 0.97); border-right: 1px solid #1f1f2f;
			font-family: monospace; font-size: 12px; color: #ccc;
			display: flex; flex-direction: column; z-index: 9990;
			overflow: hidden;
		`;

		const header = document.createElement("div");
		header.style.cssText = "padding:10px;border-bottom:1px solid #1f1f2f;display:flex;justify-content:space-between;align-items:center";
		header.innerHTML = '<span style="font-size:14px;color:#e0e0ff">Layers</span>';

		const btnGroup = document.createElement("div");
		btnGroup.style.cssText = "display:flex;gap:4px";

		const addBtn = this._makeBtn("+", "Add layer");
		addBtn.addEventListener("click", () => {
			const active = this.layerManager.getActiveLayer();
			const w = active ? active.renderTarget.width : 512;
			const h = active ? active.renderTarget.height : 512;
			this.layerManager.addLayer(w, h);
			this.refresh();
			this.onLayerChange();
		});

		const dupBtn = this._makeBtn("D", "Duplicate layer");
		dupBtn.addEventListener("click", () => {
			this.layerManager.duplicateLayer(this.layerManager.activeLayerIndex);
			this.refresh();
			this.onLayerChange();
		});

		const delBtn = this._makeBtn("-", "Remove layer");
		delBtn.addEventListener("click", () => {
			this.layerManager.removeLayer(this.layerManager.activeLayerIndex);
			this.refresh();
			this.onLayerChange();
		});

		btnGroup.appendChild(addBtn);
		btnGroup.appendChild(dupBtn);
		btnGroup.appendChild(delBtn);
		header.appendChild(btnGroup);
		this.container.appendChild(header);

		this.listEl = document.createElement("div");
		this.listEl.style.cssText = "flex:1;overflow-y:auto;padding:4px";
		this.container.appendChild(this.listEl);

		document.body.appendChild(this.container);
		this._injectPickerStyles();
		this.refresh();
	}

	refresh() {
		this.listEl.innerHTML = "";
		const layers = this.layerManager.layers;

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			const isActive = i === this.layerManager.activeLayerIndex;

			const row = document.createElement("div");
			row.draggable = true;
			row.dataset.index = i;
			row.style.cssText = `
				padding:6px 8px; margin:2px 0; border-radius:4px; cursor:pointer;
				border: 1px solid ${isActive ? "#e94560" : "#1a1a2a"};
				background: ${isActive ? "rgba(233, 69, 96, 0.08)" : "#0c0c18"};
				transition: all 0.15s;
			`;

			row.addEventListener("dragstart", e => {
				this.dragSrcIndex = parseInt(e.target.dataset.index);
				e.dataTransfer.effectAllowed = "move";
			});
			row.addEventListener("dragover", e => {
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
				row.style.borderColor = "#4488cc";
			});
			row.addEventListener("dragleave", () => {
				row.style.borderColor = isActive ? "#e94560" : "#1a1a2a";
			});
			row.addEventListener("drop", e => {
				e.preventDefault();
				const toIndex = parseInt(row.dataset.index);
				if (this.dragSrcIndex !== null && this.dragSrcIndex !== toIndex) {
					this.layerManager.moveLayer(this.dragSrcIndex, toIndex);
					this.refresh();
					this.onLayerChange();
				}
				this.dragSrcIndex = null;
			});

			row.addEventListener("click", e => {
				if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.closest(".fx-picker-trigger")) return;
				this.layerManager.setActiveLayer(i);
				this.refresh();
				this.onLayerChange();
			});

			// Top row: visibility + name
			const topRow = document.createElement("div");
			topRow.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:4px";

			const visCheck = document.createElement("input");
			visCheck.type = "checkbox";
			visCheck.checked = layer.visible;
			visCheck.style.cssText = "cursor:pointer";
			visCheck.addEventListener("change", () => {
				layer.visible = visCheck.checked;
				this.onLayerChange();
			});

			const nameSpan = document.createElement("span");
			nameSpan.textContent = layer.name;
			nameSpan.style.cssText = `flex:1;color:${isActive ? "#fff" : "#aaa"};font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;

			topRow.appendChild(visCheck);
			topRow.appendChild(nameSpan);
			row.appendChild(topRow);

			// Effect type picker button (always visible)
			const typeRow = document.createElement("div");
			typeRow.style.cssText = "margin-top:4px";
			const typeBtn = document.createElement("button");
			typeBtn.className = "fx-picker-trigger";
			typeBtn.textContent = layer.effectController.type;
			typeBtn.style.cssText = `
				width:100%; text-align:left; padding:4px 8px;
				background:#111122; color:${isActive ? "#e0e0ff" : "#999"};
				border:1px solid #2a2a3a; border-radius:4px;
				font-size:11px; font-family:monospace; cursor:pointer;
				transition: all 0.15s; position: relative;
			`;
			typeBtn.addEventListener("mouseenter", () => {
				typeBtn.style.borderColor = "#e94560";
				typeBtn.style.color = "#fff";
			});
			typeBtn.addEventListener("mouseleave", () => {
				typeBtn.style.borderColor = "#2a2a3a";
				typeBtn.style.color = isActive ? "#e0e0ff" : "#999";
			});
			typeBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.layerManager.setActiveLayer(i);
				this._openPicker(i, layer, typeBtn);
			});
			typeRow.appendChild(typeBtn);
			row.appendChild(typeRow);

			// Blend mode + opacity (always visible)
			const ctrlRow = document.createElement("div");
			ctrlRow.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:4px";

			const blendSelect = document.createElement("select");
			blendSelect.style.cssText = `background:#111122;color:${isActive ? "#ddd" : "#999"};border:1px solid #2a2a3a;border-radius:3px;font-size:11px;padding:2px;font-family:monospace`;
			for (const mode of BLEND_MODES) {
				const opt = document.createElement("option");
				opt.value = mode;
				opt.textContent = mode;
				opt.selected = mode === layer.blendMode;
				blendSelect.appendChild(opt);
			}
			blendSelect.addEventListener("change", () => {
				layer.blendMode = blendSelect.value;
				this.onLayerChange();
			});

			const opacityVal = document.createElement("span");
			opacityVal.textContent = Math.round(layer.opacity * 100) + "%";
			opacityVal.style.cssText = "color:#666;font-size:10px;min-width:28px;text-align:right";

			const opacityInput = document.createElement("input");
			opacityInput.type = "range";
			opacityInput.min = 0;
			opacityInput.max = 1;
			opacityInput.step = 0.01;
			opacityInput.value = layer.opacity;
			opacityInput.style.cssText = "flex:1;height:14px;cursor:pointer;accent-color:#e94560";
			opacityInput.addEventListener("input", () => {
				layer.opacity = parseFloat(opacityInput.value);
				opacityVal.textContent = Math.round(layer.opacity * 100) + "%";
				this.onLayerChange();
			});

			ctrlRow.appendChild(blendSelect);
			ctrlRow.appendChild(opacityInput);
			ctrlRow.appendChild(opacityVal);
			row.appendChild(ctrlRow);

			this.listEl.appendChild(row);
		}
	}

	_openPicker(layerIdx, layer, triggerBtn) {
		this._closePicker();
		this._pickerLayerIdx = layerIdx;
		this._pickerItems = [];
		this._pickerFocusIdx = -1;

		const picker = document.createElement("div");
		picker.className = "fx-picker";
		this._pickerEl = picker;

		// Search bar
		const search = document.createElement("input");
		search.type = "text";
		search.placeholder = "Search effects...";
		search.className = "fx-picker-search";
		picker.appendChild(search);

		// Grid area
		const grid = document.createElement("div");
		grid.className = "fx-picker-grid";

		const currentType = layer.effectController.type;
		const TRANSPARENT_PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

		const makePickerItem = (fx, idx) => {
			const item = document.createElement("button");
			item.className = "fx-picker-item" + (fx === currentType ? " selected" : "");
			item.dataset.fx = fx;
			item.dataset.idx = idx;

			const thumb = getCachedThumbnail(fx);
			const img = document.createElement("img");
			img.className = "fx-picker-thumb";
			img.src = thumb || TRANSPARENT_PX;
			img.dataset.fx = fx;
			item.appendChild(img);

			const label = document.createElement("span");
			label.className = "fx-picker-label";
			label.textContent = isCustomEffect(fx) ? fx.slice(CUSTOM_PREFIX.length) : fx;
			item.appendChild(label);

			item.addEventListener("click", () => this._selectEffect(fx, layer));
			item.addEventListener("mouseenter", () => {
				this._pickerFocusIdx = parseInt(item.dataset.idx);
				this._updatePickerFocus();
			});
			return item;
		};

		const renderItems = (filter) => {
			grid.innerHTML = "";
			this._pickerItems = [];
			let idx = 0;

			for (const [cat, effects] of Object.entries(EFFECT_CATEGORIES)) {
				const filtered = effects.filter(e => !filter || e.toLowerCase().includes(filter));
				if (!filtered.length) continue;

				const catLabel = document.createElement("div");
				catLabel.className = "fx-picker-cat";
				catLabel.textContent = cat;
				grid.appendChild(catLabel);

				const catGrid = document.createElement("div");
				catGrid.className = "fx-picker-cat-grid";

				for (const fx of filtered) {
					const item = makePickerItem(fx, idx);
					catGrid.appendChild(item);
					this._pickerItems.push(item);
					if (fx === currentType) this._pickerFocusIdx = idx;
					idx++;
				}
				grid.appendChild(catGrid);
			}

			// Uncategorized effects
			const categorized = new Set(Object.values(EFFECT_CATEGORIES).flat());
			const uncategorized = EFFECT_TYPES.filter(e => !categorized.has(e) && (!filter || e.toLowerCase().includes(filter)));
			if (uncategorized.length) {
				const catLabel = document.createElement("div");
				catLabel.className = "fx-picker-cat";
				catLabel.textContent = "Other";
				grid.appendChild(catLabel);

				const catGrid = document.createElement("div");
				catGrid.className = "fx-picker-cat-grid";
				for (const fx of uncategorized) {
					const item = makePickerItem(fx, idx);
					catGrid.appendChild(item);
					this._pickerItems.push(item);
					if (fx === currentType) this._pickerFocusIdx = idx;
					idx++;
				}
				grid.appendChild(catGrid);
			}
		};

		renderItems("");
		picker.appendChild(grid);

		// Generate thumbnails lazily and update picker items as they complete
		if (this._thumbCancel) this._thumbCancel();
		if (this._renderer) {
			const allEffects = Object.values(EFFECT_CATEGORIES).flat()
				.concat(EFFECT_TYPES.filter(e => !new Set(Object.values(EFFECT_CATEGORIES).flat()).has(e)));
			this._thumbCancel = generateThumbnails(this._renderer, allEffects, (fx, url) => {
				if (!this._pickerEl) return;
				const img = this._pickerEl.querySelector(`img.fx-picker-thumb[data-fx="${CSS.escape(fx)}"]`);
				if (img && url) img.src = url;
			});
		}

		// Keyboard handling
		const onKey = (e) => {
			const len = this._pickerItems.length;
			if (!len) return;
			if (e.key === "ArrowDown" || e.key === "ArrowRight") {
				e.preventDefault();
				this._pickerFocusIdx = (this._pickerFocusIdx + 1) % len;
				this._updatePickerFocus();
				this._scrollPickerItem();
			} else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
				e.preventDefault();
				this._pickerFocusIdx = (this._pickerFocusIdx - 1 + len) % len;
				this._updatePickerFocus();
				this._scrollPickerItem();
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (this._pickerFocusIdx >= 0 && this._pickerFocusIdx < len) {
					this._selectEffect(this._pickerItems[this._pickerFocusIdx].dataset.fx, layer);
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				this._closePicker();
			}
		};

		search.addEventListener("input", () => {
			const f = search.value.trim().toLowerCase();
			renderItems(f);
			this._pickerFocusIdx = this._pickerItems.length ? 0 : -1;
			this._updatePickerFocus();
		});

		search.addEventListener("keydown", onKey);

		// Click outside to close
		const onClickOutside = (e) => {
			if (!picker.contains(e.target) && e.target !== triggerBtn) {
				this._closePicker();
				document.removeEventListener("mousedown", onClickOutside);
			}
		};
		setTimeout(() => document.addEventListener("mousedown", onClickOutside), 0);

		picker._cleanup = () => {
			document.removeEventListener("mousedown", onClickOutside);
		};

		// Position: to the right of the layer panel
		document.body.appendChild(picker);
		search.focus();

		// Scroll to current selection
		if (this._pickerFocusIdx >= 0) {
			this._updatePickerFocus();
			this._scrollPickerItem();
		}
	}

	_selectEffect(fx, layer) {
		layer.effectController.type = fx;
		const displayName = isCustomEffect(fx) ? fx.slice(CUSTOM_PREFIX.length) : fx;
		layer.name = displayName + " " + layer.id;
		if (isCustomEffect(fx)) {
			const key = getCustomShaderKey(fx);
			const src = key && SHADERS[key];
			if (src) layer.pipeline.buildCustomPass(src);
			else layer.pipeline.buildPasses("Wood");
		} else {
			layer.pipeline.buildPasses(fx);
		}
		this._closePicker();
		this.refresh();
		this.onLayerChange();
	}

	_updatePickerFocus() {
		for (const item of this._pickerItems) {
			item.classList.remove("focused");
		}
		if (this._pickerFocusIdx >= 0 && this._pickerFocusIdx < this._pickerItems.length) {
			this._pickerItems[this._pickerFocusIdx].classList.add("focused");
		}
	}

	_scrollPickerItem() {
		if (this._pickerFocusIdx >= 0 && this._pickerFocusIdx < this._pickerItems.length) {
			this._pickerItems[this._pickerFocusIdx].scrollIntoView({ block: "nearest" });
		}
	}

	_closePicker() {
		if (this._thumbCancel) { this._thumbCancel(); this._thumbCancel = null; }
		if (this._pickerEl) {
			if (this._pickerEl._cleanup) this._pickerEl._cleanup();
			this._pickerEl.remove();
			this._pickerEl = null;
		}
		this._pickerItems = [];
		this._pickerFocusIdx = -1;
	}

	_injectPickerStyles() {
		const style = document.createElement("style");
		style.textContent = `
			.fx-picker {
				position: fixed; left: 264px; top: 40px;
				width: 420px; max-height: calc(100vh - 100px);
				background: rgba(10,10,20,0.98); border: 1px solid #2a2a4a;
				border-radius: 8px; z-index: 10000;
				display: flex; flex-direction: column;
				box-shadow: 0 8px 32px rgba(0,0,0,0.6);
				font-family: monospace;
			}
			.fx-picker-search {
				margin: 8px; padding: 6px 10px;
				background: #0c0c18; color: #ddd; border: 1px solid #2a2a3a;
				border-radius: 4px; font-family: monospace; font-size: 12px;
				outline: none;
			}
			.fx-picker-search:focus { border-color: #e94560; }
			.fx-picker-grid {
				flex: 1; overflow-y: auto; padding: 0 8px 8px;
			}
			.fx-picker-cat {
				font-size: 10px; color: #e94560; text-transform: uppercase;
				letter-spacing: 1px; padding: 8px 4px 4px; font-weight: 700;
			}
			.fx-picker-cat-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, 72px);
				gap: 6px;
			}
			.fx-picker-item {
				display: flex; flex-direction: column; align-items: center;
				width: 72px; padding: 4px 2px;
				border: 1px solid #1a1a2a; border-radius: 6px;
				background: #0c0c18; color: #aab; cursor: pointer;
				font-family: monospace; font-size: 9px;
				transition: all 0.1s; overflow: hidden;
			}
			.fx-picker-item:hover, .fx-picker-item.focused {
				background: rgba(233,69,96,0.15); color: #fff;
				border-color: rgba(233,69,96,0.4);
			}
			.fx-picker-item.selected {
				background: rgba(233,69,96,0.2); color: #fff;
				border-color: #e94560;
			}
			.fx-picker-item.focused.selected {
				box-shadow: 0 0 6px rgba(233,69,96,0.4);
			}
			.fx-picker-thumb {
				width: 48px; height: 48px; border-radius: 4px;
				background: #111; object-fit: cover;
				image-rendering: pixelated;
			}
			.fx-picker-label {
				margin-top: 3px; text-align: center;
				line-height: 1.1; word-break: break-word;
				max-width: 68px;
			}
		`;
		document.head.appendChild(style);
	}

	setRenderer(renderer) {
		this._renderer = renderer;
	}

	_makeBtn(text, title) {
		const btn = document.createElement("button");
		btn.textContent = text;
		btn.title = title;
		btn.style.cssText = "width:24px;height:24px;border:1px solid #2a2a3a;border-radius:4px;background:#111122;color:#ccc;cursor:pointer;font-family:monospace;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.15s";
		btn.addEventListener("mouseenter", () => { btn.style.background = "#1a1a3e"; btn.style.borderColor = "#e94560"; btn.style.color = "#fff"; });
		btn.addEventListener("mouseleave", () => { btn.style.background = "#111122"; btn.style.borderColor = "#2a2a3a"; btn.style.color = "#ccc"; });
		return btn;
	}
}
