export class ActionDock {
	constructor(app) {
		this.app = app;
		this.container = null;
		this.buttons = [];
		this._activePanel = null;
	}

	build() {
		if (document.getElementById("action-dock")) return;
		const style = document.createElement("style");
		style.textContent = `
			#action-dock {
				position: fixed; bottom: 0; left: 0; right: 0;
				display: flex; gap: 0; padding: 0;
				background: rgba(8, 8, 16, 0.97);
				border-top: 1px solid #1f1f2f;
				z-index: 9999; font-family: monospace; font-size: 11px; color: #ccc;
				justify-content: center;
				height: 40px;
			}
			#action-dock button {
				padding: 0 14px; border: none; border-right: 1px solid #1a1a2a;
				background: transparent; color: #777; cursor: pointer; transition: all 0.15s;
				font-family: monospace; font-size: 11px; letter-spacing: 0.3px;
				height: 100%; display: flex; align-items: center; gap: 5px;
				position: relative;
			}
			#action-dock button:last-child { border-right: none; }
			#action-dock button:hover { background: rgba(233, 69, 96, 0.08); color: #ccc; }
			#action-dock button.active {
				color: #fff; background: rgba(233, 69, 96, 0.12);
			}
			#action-dock button.active::after {
				content: ''; position: absolute; bottom: 0; left: 25%; right: 25%;
				height: 2px; background: #e94560; border-radius: 1px 1px 0 0;
			}
			#action-dock .dock-sep {
				width: 1px; background: #1a1a2a; margin: 8px 0; flex-shrink: 0;
			}
		`;
		document.head.appendChild(style);

		this.container = document.createElement("div");
		this.container.id = "action-dock";

		this._addButton("Presets", "presets", "B");
		this._addButton("Gradient", "gradient", "G");
		this._addButton("PBR Maps", "pbr", "P");
		this._addSep();
		this._addButton("3D Preview", "preview3d", "3");
		this._addButton("Custom GLSL", "customglsl", "C");
		this._addSep();
		this._addButton("Export", "export", "E");
		this._addButton("Layout", "layout", "L");

		document.body.appendChild(this.container);
		this._updateActive();
	}

	_addButton(label, panelId, shortcut) {
		const btn = document.createElement("button");
		btn.innerHTML = `${label} <span style="font-size:9px;color:#555;margin-left:2px">${shortcut}</span>`;
		btn.dataset.panel = panelId;
		btn.addEventListener("click", () => {
			this.togglePanel(panelId);
		});
		this.container.appendChild(btn);
		this.buttons.push({ btn, panelId });
	}

	_addSep() {
		const sep = document.createElement("div");
		sep.className = "dock-sep";
		this.container.appendChild(sep);
	}

	togglePanel(panelId) {
		const panel = this._getPanel(panelId);
		if (!panel) return;

		const isOpen = this._isPanelOpen(panelId);

		if (panelId === "preview3d") {
			if (isOpen) panel.hide();
			else panel.show();
		} else {
			this._closeAllPopups(panelId);
			if (isOpen) {
				this._hidePanel(panelId);
			} else {
				this._showPanel(panelId);
			}
			this._activePanel = isOpen ? null : panelId;
		}

		this._updateActive();
	}

	_closeAllPopups(exceptId) {
		const panelIds = ["presets", "gradient", "pbr", "export", "customglsl", "layout"];
		for (const id of panelIds) {
			if (id === exceptId) continue;
			this._hidePanel(id);
		}
	}

	_getPanel(panelId) {
		const app = this.app;
		switch (panelId) {
			case "presets": return app.presetLoader;
			case "gradient": return app.gradientEditor;
			case "pbr": return app.pbrPanel;
			case "preview3d": return app.preview3D;
			case "export": return app.exportPanel;
			case "customglsl": return app.customShaderPanel;
			case "layout": return app.layoutPanel;
		}
		return null;
	}

	_isPanelOpen(panelId) {
		const panel = this._getPanel(panelId);
		if (!panel) return false;
		if (panelId === "preview3d") return panel.visible;
		const el = panel.container || panel.panel;
		return el && el.style.display !== "none";
	}

	_showPanel(panelId) {
		const panel = this._getPanel(panelId);
		if (!panel) return;
		if (panelId === "presets") panel.show();
		else panel.show();
	}

	_hidePanel(panelId) {
		const panel = this._getPanel(panelId);
		if (!panel) return;
		if (panelId === "presets") panel.hide();
		else panel.hide();
	}

	_updateActive() {
		for (const item of this.buttons) {
			const active = this._isPanelOpen(item.panelId);
			item.btn.classList.toggle("active", !!active);
		}
	}

	refreshActive() {
		this._updateActive();
	}
}
