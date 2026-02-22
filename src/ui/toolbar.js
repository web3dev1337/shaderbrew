/**
 * Top toolbar with quick-access buttons for common actions.
 * Positioned above the viewport canvas.
 */
export class Toolbar {
	constructor(app) {
		this.app = app;
		this.container = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "toolbar";
		this.container.style.cssText = `
			position: fixed; top: 0; left: 260px; right: 300px; height: 36px;
			background: rgba(8, 8, 16, 0.97); border-bottom: 1px solid #1f1f2f;
			display: flex; align-items: center; gap: 6px; padding: 0 10px;
			font-family: monospace; font-size: 12px; color: #ccc; z-index: 9990;
		`;

		// 2x2 tiling preview toggle
		this._addToggle("2x2 Tile", false, checked => {
			this.app.tilePreviewPass.enabled = checked;
			this.app.requestRender();
		});

		this._addSep();

		// Animation toggle
		this._addToggle("Animate", this.app.effectController.animate, checked => {
			this.app.effectController.animate = checked;
			if (this.app.gui) this.app.gui.refreshAllDisplays();
		});

		this._addSep();

		// Noise sphere toggle
		this._addToggle("3D Sphere", this.app.effectController.cNoiseSphereEnable, checked => {
			this.app.effectController.cNoiseSphereEnable = checked;
			this.app.requestRender();
		});

		this._addSep();

		// Quick actions
		this._addButton("Reset Params", () => this.app.onResetEffectParameters());
		this._addButton("Reset Color", () => this.app.onResetColorBalance());

		// Spacer
		const spacer = document.createElement("div");
		spacer.style.flex = "1";
		this.container.appendChild(spacer);

		// Resolution indicator
		this.resLabel = document.createElement("span");
		this.resLabel.style.cssText = "color:#666;font-size:11px";
		this.resLabel.textContent = `${this.app.canvas.width}x${this.app.canvas.height}`;
		this.container.appendChild(this.resLabel);

		document.body.appendChild(this.container);
	}

	updateResolution(w, h) {
		if (this.resLabel) this.resLabel.textContent = `${w}x${h}`;
	}

	_addToggle(label, initial, onChange) {
		const wrapper = document.createElement("label");
		wrapper.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer;color:#aaa;font-size:11px;user-select:none";
		const cb = document.createElement("input");
		cb.type = "checkbox";
		cb.checked = initial;
		cb.style.cursor = "pointer";
		cb.addEventListener("change", () => onChange(cb.checked));
		wrapper.appendChild(cb);
		wrapper.appendChild(document.createTextNode(label));
		this.container.appendChild(wrapper);
	}

	_addButton(label, onClick) {
		const btn = document.createElement("button");
		btn.textContent = label;
		btn.style.cssText = `
			padding: 3px 8px; border: 1px solid #2a2a3a; border-radius: 3px;
			background: #111122; color: #888; font-family: monospace;
			font-size: 11px; cursor: pointer; transition: all 0.15s;
		`;
		btn.addEventListener("mouseenter", () => { btn.style.background = "#1a1a3e"; btn.style.borderColor = "#e94560"; btn.style.color = "#fff"; });
		btn.addEventListener("mouseleave", () => { btn.style.background = "#111122"; btn.style.borderColor = "#2a2a3a"; btn.style.color = "#888"; });
		btn.addEventListener("click", onClick);
		this.container.appendChild(btn);
	}

	_addSep() {
		const sep = document.createElement("div");
		sep.style.cssText = "width:1px;height:18px;background:#333";
		this.container.appendChild(sep);
	}
}
