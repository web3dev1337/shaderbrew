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
				display: flex; gap: 2px; padding: 4px 8px;
				background: linear-gradient(to top, rgba(6,6,14,0.98), rgba(12,12,24,0.95));
				border-top: 1px solid #2a2a4a;
				z-index: 9999; font-family: monospace;
				justify-content: center; align-items: center;
				height: 44px;
				box-shadow: 0 -2px 12px rgba(0,0,0,0.5);
			}
			#action-dock button {
				padding: 6px 16px; border: 1px solid transparent; border-radius: 6px;
				background: rgba(255,255,255,0.04); color: #aab;
				cursor: pointer; transition: all 0.15s ease;
				font-family: monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.4px;
				display: flex; align-items: center; gap: 6px;
				position: relative; white-space: nowrap;
			}
			#action-dock button:hover {
				background: rgba(233, 69, 96, 0.15); color: #fff;
				border-color: rgba(233, 69, 96, 0.3);
			}
			#action-dock button.active {
				color: #fff; background: rgba(233, 69, 96, 0.2);
				border-color: #e94560;
				box-shadow: 0 0 8px rgba(233,69,96,0.25);
			}
			#action-dock button.active .dock-key {
				background: #e94560; color: #fff; border-color: #e94560;
			}
			#action-dock .dock-key {
				display: inline-flex; align-items: center; justify-content: center;
				min-width: 18px; height: 18px; padding: 0 4px;
				font-size: 10px; font-weight: 700; line-height: 1;
				background: rgba(255,255,255,0.06); color: #888;
				border: 1px solid rgba(255,255,255,0.12); border-radius: 3px;
			}
			#action-dock button:hover .dock-key {
				background: rgba(233,69,96,0.3); color: #ddd;
				border-color: rgba(233,69,96,0.4);
			}
			#action-dock .dock-sep {
				width: 1px; height: 20px; background: #2a2a4a; margin: 0 4px; flex-shrink: 0;
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
		btn.innerHTML = `${label}<span class="dock-key">${shortcut}</span>`;
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
