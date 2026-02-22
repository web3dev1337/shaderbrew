export class ActionDock {
	constructor(app) {
		this.app = app;
		this.container = null;
		this.buttons = [];
	}

	build() {
		if (document.getElementById("action-dock")) return;
		const style = document.createElement("style");
		style.textContent = `
			#action-dock {
				position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);
				display: flex; gap: 6px; padding: 8px 10px;
				background: rgba(10, 10, 20, 0.95); border: 1px solid #333; border-radius: 8px;
				z-index: 9999; font-family: monospace; font-size: 11px; color: #ccc;
				box-shadow: 0 8px 30px rgba(0,0,0,0.45);
			}
			#action-dock button {
				padding: 5px 10px; border: 1px solid #444; border-radius: 4px;
				background: #1a1a2e; color: #aaa; cursor: pointer; transition: all 0.15s;
				font-family: monospace; font-size: 11px;
			}
			#action-dock button:hover { background: #0f3460; border-color: #e94560; color: #fff; }
			#action-dock button.active {
				background: #1a1a3e; border-color: #e94560; color: #fff;
				box-shadow: 0 0 0 1px rgba(233,69,96,0.3) inset;
			}
		`;
		document.head.appendChild(style);

		this.container = document.createElement("div");
		this.container.id = "action-dock";

		this._addButton("Presets", () => this._togglePresets(), () => this._isPresetsOpen());
		this._addButton("Gradient", () => this._togglePanel(this.app.gradientEditor), () => this._isPanelOpen(this.app.gradientEditor));
		this._addButton("PBR Maps", () => this._togglePanel(this.app.pbrPanel), () => this._isPanelOpen(this.app.pbrPanel));
		this._addButton("3D Preview", () => this._togglePreview(), () => this.app.preview3D && this.app.preview3D.visible);
		this._addButton("Export", () => this._togglePanel(this.app.exportPanel), () => this._isPanelOpen(this.app.exportPanel));
		this._addButton("Layout", () => this._togglePanel(this.app.layoutPanel), () => this._isPanelOpen(this.app.layoutPanel));

		document.body.appendChild(this.container);
		this._updateActive();
		document.addEventListener("click", () => this._updateActive());
	}

	_addButton(label, onClick, isActive) {
		const btn = document.createElement("button");
		btn.textContent = label;
		btn.addEventListener("click", () => {
			onClick();
			this._updateActive();
		});
		this.container.appendChild(btn);
		this.buttons.push({ btn, isActive });
	}

	_updateActive() {
		for (const item of this.buttons) {
			const active = item.isActive ? item.isActive() : false;
			item.btn.classList.toggle("active", !!active);
		}
	}

	_isPanelOpen(panel) {
		return !!(panel && panel.container && panel.container.style.display !== "none");
	}

	_isPresetsOpen() {
		return !!(this.app.presetLoader && this.app.presetLoader.panel && this.app.presetLoader.panel.style.display !== "none");
	}

	_togglePanel(panel) {
		if (!panel) return;
		panel.toggle();
	}

	_togglePresets() {
		if (!this.app.presetLoader) return;
		this.app.presetLoader.toggle();
	}

	_togglePreview() {
		if (!this.app.preview3D) return;
		this.app.preview3D.toggle();
	}
}
