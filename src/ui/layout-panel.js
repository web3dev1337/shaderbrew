export class LayoutPanel {
	constructor(app) {
		this.app = app;
		this.container = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "layout-panel";
		this.container.style.cssText = `
			position: fixed; bottom: 55px; left: 50%; transform: translateX(-50%);
			background: rgba(10, 10, 20, 0.95); border: 1px solid #333; border-radius: 6px;
			padding: 12px; z-index: 9997; display: none; width: 360px;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		const title = document.createElement("div");
		title.textContent = "Workspace";
		title.style.cssText = "color:#e0e0ff;font-size:13px;margin-bottom:10px;text-align:center";
		this.container.appendChild(title);

		const row = document.createElement("div");
		row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-bottom:10px";
		this.container.appendChild(row);

		this._addToggle(row, "Layers", this.app.layout.showLayers, checked => {
			this.app.layout.showLayers = checked;
			this.app.updateLayout();
		});
		this._addToggle(row, "Parameters", this.app.layout.showParams, checked => {
			this.app.layout.showParams = checked;
			this.app.updateLayout();
		});
		this._addToggle(row, "Toolbar", this.app.layout.showToolbar, checked => {
			this.app.layout.showToolbar = checked;
			this.app.updateLayout();
		});
		this._addToggle(row, "Stats", this.app.layout.showStats, checked => {
			this.app.layout.showStats = checked;
			this.app.updateLayout();
		});

		const perfTitle = document.createElement("div");
		perfTitle.textContent = "Performance:";
		perfTitle.style.cssText = "color:#888;font-size:11px;margin:6px 0";
		this.container.appendChild(perfTitle);

		const perfRow = document.createElement("div");
		perfRow.style.cssText = "display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap";

		const liveToggle = this._makeToggle("Live Render", this.app.liveRender, checked => {
			this.app.liveRender = checked;
			this.app.requestRender();
		});
		perfRow.appendChild(liveToggle);

		const renderBtn = document.createElement("button");
		renderBtn.textContent = "Render Once";
		renderBtn.style.cssText = "padding:6px 10px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#ccc;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.15s";
		renderBtn.addEventListener("mouseenter", () => { renderBtn.style.background = "#0f3460"; renderBtn.style.borderColor = "#e94560"; renderBtn.style.color = "#fff"; });
		renderBtn.addEventListener("mouseleave", () => { renderBtn.style.background = "#1a1a2e"; renderBtn.style.borderColor = "#444"; renderBtn.style.color = "#ccc"; });
		renderBtn.addEventListener("click", () => this.app.requestRender());
		perfRow.appendChild(renderBtn);

		this.container.appendChild(perfRow);

		const resetRow = document.createElement("div");
		resetRow.style.cssText = "margin-top:10px;text-align:center";
		const resetBtn = document.createElement("button");
		resetBtn.textContent = "Reset Layout";
		resetBtn.style.cssText = "padding:6px 12px;border:1px solid #e94560;border-radius:4px;background:#2a1030;color:#ff6b8a;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.15s";
		resetBtn.addEventListener("mouseenter", () => { resetBtn.style.background = "#0f3460"; resetBtn.style.color = "#fff"; });
		resetBtn.addEventListener("mouseleave", () => { resetBtn.style.background = "#2a1030"; resetBtn.style.color = "#ff6b8a"; });
		resetBtn.addEventListener("click", () => {
			this.app.layout.showLayers = true;
			this.app.layout.showParams = true;
			this.app.layout.showToolbar = true;
			this.app.layout.showStats = false;
			this.app.updateLayout();
			this._syncToggles();
		});
		resetRow.appendChild(resetBtn);
		this.container.appendChild(resetRow);

		const helpRow = document.createElement("div");
		helpRow.style.cssText = "margin-top:8px;text-align:center";
		const helpBtn = document.createElement("button");
		helpBtn.textContent = "Quick Start";
		helpBtn.style.cssText = "padding:6px 12px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#ccc;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.15s";
		helpBtn.addEventListener("mouseenter", () => { helpBtn.style.background = "#0f3460"; helpBtn.style.borderColor = "#e94560"; helpBtn.style.color = "#fff"; });
		helpBtn.addEventListener("mouseleave", () => { helpBtn.style.background = "#1a1a2e"; helpBtn.style.borderColor = "#444"; helpBtn.style.color = "#ccc"; });
		helpBtn.addEventListener("click", () => this.app.quickStart?.show(true));
		helpRow.appendChild(helpBtn);
		this.container.appendChild(helpRow);

		document.body.appendChild(this.container);
		this._syncToggles();
	}

	show() { this.container.style.display = "block"; }
	hide() { this.container.style.display = "none"; }
	toggle() {
		this.container.style.display = this.container.style.display === "none" ? "block" : "none";
	}

	_addToggle(parent, label, initial, onChange) {
		const wrap = this._makeToggle(label, initial, onChange);
		parent.appendChild(wrap);
	}

	_makeToggle(label, initial, onChange) {
		const wrapper = document.createElement("label");
		wrapper.style.cssText = "display:flex;align-items:center;gap:6px;cursor:pointer;color:#aaa;font-size:11px;user-select:none";
		const cb = document.createElement("input");
		cb.type = "checkbox";
		cb.checked = initial;
		cb.style.cursor = "pointer";
		cb.addEventListener("change", () => onChange(cb.checked));
		wrapper.appendChild(cb);
		wrapper.appendChild(document.createTextNode(label));
		wrapper.dataset.toggle = label;
		return wrapper;
	}

	_syncToggles() {
		if (!this.container) return;
		const toggles = this.container.querySelectorAll("label[data-toggle]");
		toggles.forEach(label => {
			const cb = label.querySelector("input");
			if (!cb) return;
			if (label.dataset.toggle === "Layers") cb.checked = this.app.layout.showLayers;
			if (label.dataset.toggle === "Parameters") cb.checked = this.app.layout.showParams;
			if (label.dataset.toggle === "Toolbar") cb.checked = this.app.layout.showToolbar;
			if (label.dataset.toggle === "Stats") cb.checked = this.app.layout.showStats;
			if (label.dataset.toggle === "Live Render") cb.checked = this.app.liveRender;
		});
	}
}
