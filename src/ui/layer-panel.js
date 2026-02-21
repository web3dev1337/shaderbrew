/**
 * Layer panel UI: shows layers list with controls for visibility, opacity, blend mode, reorder.
 */
import { BLEND_MODES } from "../shaders/blend.js";
import { EFFECT_TYPES } from "../defaults.js";

export class LayerPanel {
	constructor(layerManager, onLayerChange) {
		this.layerManager = layerManager;
		this.onLayerChange = onLayerChange;
		this.container = null;
		this.listEl = null;
		this.dragSrcIndex = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "layer-panel";
		this.container.style.cssText = `
			position: fixed; left: 0; top: 0; bottom: 50px; width: 260px;
			background: rgba(10, 10, 20, 0.95); border-right: 1px solid #333;
			font-family: monospace; font-size: 12px; color: #ccc;
			display: flex; flex-direction: column; z-index: 9998;
			overflow: hidden;
		`;

		// Header
		const header = document.createElement("div");
		header.style.cssText = "padding:10px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center";
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

		// Layer list (scrollable)
		this.listEl = document.createElement("div");
		this.listEl.style.cssText = "flex:1;overflow-y:auto;padding:4px";
		this.container.appendChild(this.listEl);

		document.body.appendChild(this.container);
		this.refresh();
	}

	refresh() {
		this.listEl.innerHTML = "";
		const layers = this.layerManager.layers;

		// Render bottom-to-top (bottom layer = first in array, displayed at bottom)
		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			const isActive = i === this.layerManager.activeLayerIndex;

			const row = document.createElement("div");
			row.draggable = true;
			row.dataset.index = i;
			row.style.cssText = `
				padding:6px 8px; margin:2px 0; border-radius:4px; cursor:pointer;
				border: 1px solid ${isActive ? "#e94560" : "#222"};
				background: ${isActive ? "#1a1a3e" : "#111"};
				transition: border-color 0.15s;
			`;

			// Drag events for reorder
			row.addEventListener("dragstart", e => {
				this.dragSrcIndex = parseInt(e.target.dataset.index);
				e.dataTransfer.effectAllowed = "move";
			});
			row.addEventListener("dragover", e => {
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
				row.style.borderColor = "#0f3460";
			});
			row.addEventListener("dragleave", () => {
				row.style.borderColor = isActive ? "#e94560" : "#222";
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

			// Click to select
			row.addEventListener("click", e => {
				if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
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

			// Bottom row: blend mode + opacity (only show for active layer to save space)
			if (isActive) {
				const ctrlRow = document.createElement("div");
				ctrlRow.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:4px";

				const blendSelect = document.createElement("select");
				blendSelect.style.cssText = "background:#222;color:#ccc;border:1px solid #444;border-radius:3px;font-size:11px;padding:2px;font-family:monospace";
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

				const opacityLabel = document.createElement("span");
				opacityLabel.textContent = "Op:";
				opacityLabel.style.cssText = "color:#666;font-size:10px";

				const opacityInput = document.createElement("input");
				opacityInput.type = "range";
				opacityInput.min = 0;
				opacityInput.max = 1;
				opacityInput.step = 0.01;
				opacityInput.value = layer.opacity;
				opacityInput.style.cssText = "flex:1;height:14px;cursor:pointer";
				opacityInput.addEventListener("input", () => {
					layer.opacity = parseFloat(opacityInput.value);
					this.onLayerChange();
				});

				ctrlRow.appendChild(blendSelect);
				ctrlRow.appendChild(opacityLabel);
				ctrlRow.appendChild(opacityInput);
				row.appendChild(ctrlRow);

				// Effect type selector
				const typeRow = document.createElement("div");
				typeRow.style.cssText = "margin-top:4px";
				const typeSelect = document.createElement("select");
				typeSelect.style.cssText = "width:100%;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;font-size:11px;padding:2px;font-family:monospace";
				for (const t of EFFECT_TYPES) {
					const opt = document.createElement("option");
					opt.value = t;
					opt.textContent = t;
					opt.selected = t === layer.effectController.type;
					typeSelect.appendChild(opt);
				}
				typeSelect.addEventListener("change", () => {
					layer.effectController.type = typeSelect.value;
					layer.name = typeSelect.value + " " + layer.id;
					layer.pipeline.buildPasses(typeSelect.value);
					this.refresh();
					this.onLayerChange();
				});
				typeRow.appendChild(typeSelect);
				row.appendChild(typeRow);
			}

			this.listEl.appendChild(row);
		}
	}

	_makeBtn(text, title) {
		const btn = document.createElement("button");
		btn.textContent = text;
		btn.title = title;
		btn.style.cssText = "width:24px;height:24px;border:1px solid #444;border-radius:3px;background:#1a1a2e;color:#ccc;cursor:pointer;font-family:monospace;font-size:14px;display:flex;align-items:center;justify-content:center";
		btn.addEventListener("mouseenter", () => { btn.style.background = "#0f3460"; btn.style.borderColor = "#e94560"; });
		btn.addEventListener("mouseleave", () => { btn.style.background = "#1a1a2e"; btn.style.borderColor = "#444"; });
		return btn;
	}
}
