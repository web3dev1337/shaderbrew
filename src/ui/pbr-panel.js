/**
 * PBR map preview panel.
 * Shows small previews of Normal, Roughness, AO, and Metallic maps.
 * Controls for PBR generation parameters.
 */
export class PBRPanel {
	constructor(pbrGenerator, onUpdate) {
		this.pbr = pbrGenerator;
		this.onUpdate = onUpdate;
		this.container = null;
		this.previews = {};
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "pbr-panel";
		this.container.style.cssText = `
			position: fixed; bottom: 55px; left: 265px;
			background: rgba(10, 10, 20, 0.95); border: 1px solid #333; border-radius: 6px;
			padding: 10px; z-index: 9997; display: none; width: 520px;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		// Title row
		const titleRow = document.createElement("div");
		titleRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";

		const title = document.createElement("span");
		title.textContent = "PBR Maps";
		title.style.cssText = "color:#e0e0ff;font-size:13px";

		const enableCheck = document.createElement("input");
		enableCheck.type = "checkbox";
		enableCheck.checked = this.pbr.enabled;
		enableCheck.addEventListener("change", () => {
			this.pbr.enabled = enableCheck.checked;
			this._updatePreviewVisibility();
			this.onUpdate();
		});

		const enableLabel = document.createElement("label");
		enableLabel.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer";
		enableLabel.appendChild(enableCheck);
		enableLabel.appendChild(document.createTextNode("Enable"));

		titleRow.appendChild(title);
		titleRow.appendChild(enableLabel);
		this.container.appendChild(titleRow);

		// Preview canvases row
		const previewRow = document.createElement("div");
		previewRow.id = "pbr-preview-row";
		previewRow.style.cssText = "display:flex;gap:8px;margin-bottom:8px;justify-content:center";

		for (const mapName of ["Color", "Normal", "Roughness", "AO", "Metallic"]) {
			const wrap = document.createElement("div");
			wrap.style.cssText = "text-align:center";
			const label = document.createElement("div");
			label.textContent = mapName;
			label.style.cssText = "color:#888;font-size:10px;margin-bottom:2px";

			const canvas = document.createElement("canvas");
			canvas.width = 90;
			canvas.height = 90;
			canvas.style.cssText = "border:1px solid #444;border-radius:3px;background:#111;image-rendering:pixelated";

			wrap.appendChild(label);
			wrap.appendChild(canvas);
			previewRow.appendChild(wrap);
			this.previews[mapName.toLowerCase()] = canvas;
		}
		this.container.appendChild(previewRow);

		// Parameter controls
		const paramsDiv = document.createElement("div");
		paramsDiv.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:4px 12px";

		this._addSlider(paramsDiv, "Normal Strength", "normalStrength", 0, 10, 0.1);
		this._addSlider(paramsDiv, "Roughness Bias", "roughnessBias", 0, 1, 0.01);
		this._addSlider(paramsDiv, "Roughness Contrast", "roughnessContrast", 0, 3, 0.1);
		this._addSlider(paramsDiv, "AO Intensity", "aoIntensity", 0, 3, 0.1);
		this._addSlider(paramsDiv, "AO Radius", "aoRadius", 1, 8, 0.5);
		this._addSlider(paramsDiv, "Metalness", "metalness", 0, 1, 0.01);

		this.container.appendChild(paramsDiv);
		document.body.appendChild(this.container);
	}

	show() { this.container.style.display = "block"; }
	hide() { this.container.style.display = "none"; }
	toggle() {
		this.container.style.display = this.container.style.display === "none" ? "block" : "none";
	}

	updatePreviews(renderer, colorTexture) {
		if (!this.pbr.enabled) return;

		const maps = {
			color: colorTexture,
			normal: this.pbr.normalRT.texture,
			roughness: this.pbr.roughnessRT.texture,
			ao: this.pbr.aoRT.texture,
			metallic: this.pbr.metallicRT.texture
		};

		for (const [name, texture] of Object.entries(maps)) {
			const canvas = this.previews[name];
			if (!canvas || !texture) continue;
			this._readTextureToCanvas(renderer, texture, canvas);
		}
	}

	_readTextureToCanvas(renderer, texture, canvas) {
		const w = texture.image ? texture.image.width : texture.source?.data?.width || this.pbr.width;
		const h = texture.image ? texture.image.height : texture.source?.data?.height || this.pbr.height;

		// Read pixels from render target
		const rt = texture.isRenderTargetTexture ?
			this._findRT(texture) :
			this._textureToRT(renderer, texture);

		if (!rt) return;

		const pixels = new Uint8Array(w * h * 4);
		renderer.readRenderTargetPixels(rt, 0, 0, w, h, pixels);

		// Draw to preview canvas (scaled)
		const ctx = canvas.getContext("2d");
		const imgData = ctx.createImageData(w, h);

		// Flip Y (WebGL reads bottom-up)
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const srcIdx = ((h - 1 - y) * w + x) * 4;
				const dstIdx = (y * w + x) * 4;
				imgData.data[dstIdx] = pixels[srcIdx];
				imgData.data[dstIdx + 1] = pixels[srcIdx + 1];
				imgData.data[dstIdx + 2] = pixels[srcIdx + 2];
				imgData.data[dstIdx + 3] = 255;
			}
		}

		const tmpCanvas = document.createElement("canvas");
		tmpCanvas.width = w;
		tmpCanvas.height = h;
		tmpCanvas.getContext("2d").putImageData(imgData, 0, 0);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
	}

	_findRT(texture) {
		// Find render target that owns this texture
		for (const rtName of ["normalRT", "roughnessRT", "aoRT", "metallicRT"]) {
			if (this.pbr[rtName] && this.pbr[rtName].texture === texture) return this.pbr[rtName];
		}
		return null;
	}

	_textureToRT(renderer, texture) {
		// For regular textures, we need to render to a temporary RT
		if (!this._tmpRT) {
			const THREE = window.THREE || (async () => await import("three"))();
			return null; // Will be handled via import
		}
		return null;
	}

	_updatePreviewVisibility() {
		const row = document.getElementById("pbr-preview-row");
		if (row) row.style.opacity = this.pbr.enabled ? "1" : "0.3";
	}

	_addSlider(parent, label, param, min, max, step) {
		const row = document.createElement("div");
		row.style.cssText = "display:flex;align-items:center;gap:4px";

		const lbl = document.createElement("span");
		lbl.textContent = label + ":";
		lbl.style.cssText = "min-width:110px;font-size:11px;color:#888";

		const slider = document.createElement("input");
		slider.type = "range";
		slider.min = min;
		slider.max = max;
		slider.step = step;
		slider.value = this.pbr.params[param];
		slider.style.cssText = "flex:1;height:14px";
		slider.addEventListener("input", () => {
			this.pbr.params[param] = parseFloat(slider.value);
			this.onUpdate();
		});

		row.appendChild(lbl);
		row.appendChild(slider);
		parent.appendChild(row);
	}
}
