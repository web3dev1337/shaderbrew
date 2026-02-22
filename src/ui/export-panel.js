/**
 * Export panel UI.
 * Provides buttons for exporting textures in various formats and resolutions.
 */
export class ExportPanel {
	constructor(exportManager) {
		this.exportManager = exportManager;
		this.container = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "export-panel";
		this.container.style.cssText = `
			position: fixed; bottom: 55px; left: 50%; transform: translateX(-50%);
			background: rgba(10, 10, 20, 0.95); border: 1px solid #333; border-radius: 6px;
			padding: 12px; z-index: 9997; display: none; width: 360px;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		// Title
		const title = document.createElement("div");
		title.textContent = "Export Textures";
		title.style.cssText = "color:#e0e0ff;font-size:13px;margin-bottom:10px;text-align:center";
		this.container.appendChild(title);

		// Quick export row
		const quickRow = document.createElement("div");
		quickRow.style.cssText = "display:flex;gap:6px;margin-bottom:10px;justify-content:center";

		this._addExportBtn(quickRow, "PNG", () => {
			this.exportManager.app.render();
			const colorRT = this.exportManager.getColorRenderTarget();
			if (colorRT) this.exportManager.exportPNG(this.exportManager.app.effectController.type, colorRT);
		});

		this._addExportBtn(quickRow, "JPEG (92%)", () => {
			this.exportManager.app.render();
			const colorRT = this.exportManager.getColorRenderTarget();
			if (colorRT) this.exportManager.exportJPEG(this.exportManager.app.effectController.type, colorRT, 0.92);
		});

		this._addExportBtn(quickRow, "ZIP Bundle", () => this.exportManager.exportZIP(), true);

		this.container.appendChild(quickRow);

		// Resolution export section
		const resTitle = document.createElement("div");
		resTitle.textContent = "Export at Resolution:";
		resTitle.style.cssText = "color:#888;font-size:11px;margin-bottom:6px";
		this.container.appendChild(resTitle);

		const resRow = document.createElement("div");
		resRow.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;justify-content:center";

		for (const res of [256, 512, 1024, 2048, 4096]) {
			this._addExportBtn(resRow, `${res}px`, () => {
				this.exportManager.exportAtResolution(res);
			});
		}

		this.container.appendChild(resRow);

		// PBR individual maps section
		const pbrTitle = document.createElement("div");
		pbrTitle.textContent = "Individual PBR Maps:";
		pbrTitle.style.cssText = "color:#888;font-size:11px;margin:10px 0 6px";
		this.container.appendChild(pbrTitle);

		const pbrRow = document.createElement("div");
		pbrRow.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;justify-content:center";

		for (const [label, rtName] of [["Normal", "normalRT"], ["Roughness", "roughnessRT"], ["AO", "aoRT"], ["Metallic", "metallicRT"]]) {
			this._addExportBtn(pbrRow, label, () => {
				const pbr = this.exportManager.app.pbrGenerator;
				if (!pbr.enabled) { alert("Enable PBR Maps first!"); return; }
				const rt = pbr[rtName];
				if (rt) this.exportManager.exportPNG(`${this.exportManager.app.effectController.type}_${label.toLowerCase()}`, rt.texture);
			});
		}

		this.container.appendChild(pbrRow);

		// Project section
		const projectTitle = document.createElement("div");
		projectTitle.textContent = "Project:";
		projectTitle.style.cssText = "color:#888;font-size:11px;margin:10px 0 6px";
		this.container.appendChild(projectTitle);

		const projectRow = document.createElement("div");
		projectRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;justify-content:center";

		this._addExportBtn(projectRow, "Save Project", () => {
			this.exportManager.app.saveProject();
		});

		this._addExportBtn(projectRow, "Load JSON", () => {
			this.exportManager.app.load();
		});

		this.container.appendChild(projectRow);

		document.body.appendChild(this.container);
	}

	show() { this.container.style.display = "block"; }
	hide() { this.container.style.display = "none"; }
	toggle() {
		this.container.style.display = this.container.style.display === "none" ? "block" : "none";
	}

	_addExportBtn(parent, label, onClick, highlight = false) {
		const btn = document.createElement("button");
		btn.textContent = label;
		btn.style.cssText = `
			padding: 6px 12px; border: 1px solid ${highlight ? "#e94560" : "#444"}; border-radius: 4px;
			background: ${highlight ? "#2a1030" : "#1a1a2e"}; color: ${highlight ? "#ff6b8a" : "#ccc"};
			font-family: monospace; font-size: 11px; cursor: pointer; transition: all 0.15s;
		`;
		btn.addEventListener("mouseenter", () => { btn.style.background = "#0f3460"; btn.style.borderColor = "#e94560"; btn.style.color = "#fff"; });
		btn.addEventListener("mouseleave", () => { btn.style.background = highlight ? "#2a1030" : "#1a1a2e"; btn.style.borderColor = highlight ? "#e94560" : "#444"; btn.style.color = highlight ? "#ff6b8a" : "#ccc"; });
		btn.addEventListener("click", onClick);
		parent.appendChild(btn);
	}
}
