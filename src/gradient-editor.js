/**
 * Multi-stop gradient editor with canvas-based UI.
 * Creates a 1D gradient texture for the GradientMapShader.
 */
import * as THREE from "three";

const GRADIENT_WIDTH = 256;

export class GradientEditor {
	constructor() {
		this.stops = [
			{ position: 0.0, color: "#000000" },
			{ position: 1.0, color: "#ffffff" }
		];
		this.enabled = false;
		this.intensity = 1.0;
		this.selectedStop = -1;
		this.dragging = false;

		this.gradientCanvas = document.createElement("canvas");
		this.gradientCanvas.width = GRADIENT_WIDTH;
		this.gradientCanvas.height = 1;

		this.texture = new THREE.CanvasTexture(this.gradientCanvas);
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;
		this.texture.wrapS = THREE.ClampToEdgeWrapping;

		this.container = null;
		this.barCanvas = null;
	}

	buildUI(parentContainer) {
		this.container = document.createElement("div");
		this.container.id = "gradient-editor";
		this.container.style.cssText = `
			position: fixed; bottom: 55px; left: 50%; transform: translateX(-50%);
			background: rgba(10, 10, 20, 0.95); border: 1px solid #333; border-radius: 6px;
			padding: 10px; z-index: 9997; display: none; width: 400px;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		// Title row
		const titleRow = document.createElement("div");
		titleRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";

		const title = document.createElement("span");
		title.textContent = "Gradient Map";
		title.style.cssText = "color:#e0e0ff;font-size:13px";

		const enableCheck = document.createElement("input");
		enableCheck.type = "checkbox";
		enableCheck.checked = this.enabled;
		enableCheck.addEventListener("change", () => {
			this.enabled = enableCheck.checked;
			this._onUpdate();
		});

		const enableLabel = document.createElement("label");
		enableLabel.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer";
		enableLabel.appendChild(enableCheck);
		enableLabel.appendChild(document.createTextNode("Enable"));

		titleRow.appendChild(title);
		titleRow.appendChild(enableLabel);
		this.container.appendChild(titleRow);

		// Gradient bar (clickable)
		this.barCanvas = document.createElement("canvas");
		this.barCanvas.width = 380;
		this.barCanvas.height = 30;
		this.barCanvas.style.cssText = "cursor:crosshair;border:1px solid #444;border-radius:3px;display:block;margin-bottom:8px";

		this.barCanvas.addEventListener("mousedown", e => this._onBarMouseDown(e));
		this.barCanvas.addEventListener("mousemove", e => this._onBarMouseMove(e));
		this.barCanvas.addEventListener("mouseup", () => this._onBarMouseUp());
		this.barCanvas.addEventListener("mouseleave", () => this._onBarMouseUp());
		this.barCanvas.addEventListener("dblclick", e => this._onBarDblClick(e));
		this.barCanvas.addEventListener("contextmenu", e => {
			e.preventDefault();
			this._removeSelectedStop();
		});

		this.container.appendChild(this.barCanvas);

		// Intensity slider
		const intensityRow = document.createElement("div");
		intensityRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px";
		const intensityLabel = document.createElement("span");
		intensityLabel.textContent = "Intensity:";
		const intensitySlider = document.createElement("input");
		intensitySlider.type = "range";
		intensitySlider.min = 0;
		intensitySlider.max = 1;
		intensitySlider.step = 0.01;
		intensitySlider.value = this.intensity;
		intensitySlider.style.cssText = "flex:1";
		intensitySlider.addEventListener("input", () => {
			this.intensity = parseFloat(intensitySlider.value);
			this._onUpdate();
		});
		intensityRow.appendChild(intensityLabel);
		intensityRow.appendChild(intensitySlider);
		this.container.appendChild(intensityRow);

		// Color picker for selected stop
		const colorRow = document.createElement("div");
		colorRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:4px";
		const colorLabel = document.createElement("span");
		colorLabel.textContent = "Stop color:";
		this.colorInput = document.createElement("input");
		this.colorInput.type = "color";
		this.colorInput.value = "#ffffff";
		this.colorInput.style.cssText = "width:40px;height:24px;border:none;cursor:pointer";
		this.colorInput.addEventListener("input", () => {
			if (this.selectedStop >= 0 && this.selectedStop < this.stops.length) {
				this.stops[this.selectedStop].color = this.colorInput.value;
				this._renderBar();
				this._updateTexture();
				this._onUpdate();
			}
		});
		colorRow.appendChild(colorLabel);
		colorRow.appendChild(this.colorInput);

		// Preset buttons
		const presetBtns = document.createElement("div");
		presetBtns.style.cssText = "display:flex;gap:4px;margin-left:auto";
		for (const [name, stops] of Object.entries(GRADIENT_PRESETS)) {
			const btn = document.createElement("button");
			btn.textContent = name;
			btn.style.cssText = "padding:2px 8px;border:1px solid #444;border-radius:3px;background:#1a1a2e;color:#ccc;font-size:10px;font-family:monospace;cursor:pointer";
			btn.addEventListener("click", () => {
				this.stops = stops.map(s => ({ ...s }));
				this.selectedStop = -1;
				this._renderBar();
				this._updateTexture();
				this._onUpdate();
			});
			presetBtns.appendChild(btn);
		}
		colorRow.appendChild(presetBtns);
		this.container.appendChild(colorRow);

		// Help text
		const help = document.createElement("div");
		help.textContent = "Click to select stop | Double-click to add | Right-click to remove";
		help.style.cssText = "color:#555;font-size:10px;text-align:center";
		this.container.appendChild(help);

		(parentContainer || document.body).appendChild(this.container);
		this._renderBar();
		this._updateTexture();
	}

	show() { this.container.style.display = "block"; }
	hide() { this.container.style.display = "none"; }
	toggle() {
		this.container.style.display = this.container.style.display === "none" ? "block" : "none";
	}

	getTexture() { return this.texture; }

	// --- Internal ---

	_onUpdate() {
		if (this.onChange) this.onChange();
	}

	_onBarMouseDown(e) {
		const rect = this.barCanvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;

		// Find closest stop
		let closest = -1;
		let closestDist = Infinity;
		for (let i = 0; i < this.stops.length; i++) {
			const dist = Math.abs(this.stops[i].position - x);
			if (dist < closestDist && dist < 0.03) {
				closestDist = dist;
				closest = i;
			}
		}

		this.selectedStop = closest;
		if (closest >= 0) {
			this.dragging = true;
			this.colorInput.value = this.stops[closest].color;
		}
		this._renderBar();
	}

	_onBarMouseMove(e) {
		if (!this.dragging || this.selectedStop < 0) return;
		const rect = this.barCanvas.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		this.stops[this.selectedStop].position = x;
		this.stops.sort((a, b) => a.position - b.position);
		this.selectedStop = this.stops.findIndex(s => s.position === x);
		this._renderBar();
		this._updateTexture();
		this._onUpdate();
	}

	_onBarMouseUp() {
		this.dragging = false;
	}

	_onBarDblClick(e) {
		const rect = this.barCanvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const color = this._sampleGradientAt(x);
		this.stops.push({ position: x, color });
		this.stops.sort((a, b) => a.position - b.position);
		this.selectedStop = this.stops.findIndex(s => s.position === x);
		this.colorInput.value = color;
		this._renderBar();
		this._updateTexture();
		this._onUpdate();
	}

	_removeSelectedStop() {
		if (this.selectedStop < 0 || this.stops.length <= 2) return;
		this.stops.splice(this.selectedStop, 1);
		this.selectedStop = -1;
		this._renderBar();
		this._updateTexture();
		this._onUpdate();
	}

	_renderBar() {
		const ctx = this.barCanvas.getContext("2d");
		const w = this.barCanvas.width;
		const h = this.barCanvas.height;

		// Draw gradient
		const grad = ctx.createLinearGradient(0, 0, w, 0);
		for (const stop of this.stops) {
			grad.addColorStop(stop.position, stop.color);
		}
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);

		// Draw stop markers
		for (let i = 0; i < this.stops.length; i++) {
			const x = this.stops[i].position * w;
			const selected = i === this.selectedStop;
			ctx.beginPath();
			ctx.moveTo(x, h);
			ctx.lineTo(x - 5, h - 8);
			ctx.lineTo(x + 5, h - 8);
			ctx.closePath();
			ctx.fillStyle = selected ? "#e94560" : "#fff";
			ctx.fill();
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 1;
			ctx.stroke();

			if (selected) {
				ctx.beginPath();
				ctx.arc(x, 8, 4, 0, Math.PI * 2);
				ctx.fillStyle = "#e94560";
				ctx.fill();
				ctx.stroke();
			}
		}
	}

	_updateTexture() {
		const ctx = this.gradientCanvas.getContext("2d");
		const grad = ctx.createLinearGradient(0, 0, GRADIENT_WIDTH, 0);
		for (const stop of this.stops) {
			grad.addColorStop(stop.position, stop.color);
		}
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, GRADIENT_WIDTH, 1);
		this.texture.needsUpdate = true;
	}

	_sampleGradientAt(position) {
		const ctx = this.gradientCanvas.getContext("2d");
		const x = Math.floor(position * (GRADIENT_WIDTH - 1));
		const pixel = ctx.getImageData(x, 0, 1, 1).data;
		return "#" + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0")).join("");
	}
}

const GRADIENT_PRESETS = {
	"Fire": [
		{ position: 0.0, color: "#000000" },
		{ position: 0.25, color: "#8b0000" },
		{ position: 0.5, color: "#ff4500" },
		{ position: 0.75, color: "#ffa500" },
		{ position: 1.0, color: "#ffff00" }
	],
	"Ice": [
		{ position: 0.0, color: "#000022" },
		{ position: 0.3, color: "#003366" },
		{ position: 0.6, color: "#4488cc" },
		{ position: 0.85, color: "#aaddff" },
		{ position: 1.0, color: "#ffffff" }
	],
	"Neon": [
		{ position: 0.0, color: "#0a0020" },
		{ position: 0.2, color: "#6600cc" },
		{ position: 0.5, color: "#ff00ff" },
		{ position: 0.7, color: "#00ffff" },
		{ position: 1.0, color: "#ffffff" }
	],
	"Earth": [
		{ position: 0.0, color: "#1a0f00" },
		{ position: 0.3, color: "#4a3000" },
		{ position: 0.5, color: "#8b6914" },
		{ position: 0.75, color: "#c4a35a" },
		{ position: 1.0, color: "#f5e6c8" }
	],
	"Toxic": [
		{ position: 0.0, color: "#000000" },
		{ position: 0.3, color: "#003300" },
		{ position: 0.5, color: "#00cc00" },
		{ position: 0.75, color: "#66ff00" },
		{ position: 1.0, color: "#ccff66" }
	]
};
