/**
 * Preset loading system: manifest-driven browser with search and filters.
 */

const MANIFEST_URL = "presets/manifest.json";

export class PresetLoader {
	constructor(app) {
		this.app = app;
		this.panel = null;
		this.toggleBtn = null;
		this.grid = null;
		this.searchInput = null;
		this.categoryRow = null;
		this.kindRow = null;
		this.countEl = null;
		this.manifest = [];
		this.activeCategory = "all";
		this.activeKind = "all";
		this.searchTerm = "";
		this.selectedId = null;
	}

	buildUI() {
		this._buildToggle();
		this._buildPanel();
		this._loadManifest();
	}

	_buildToggle() {
		this.toggleBtn = document.createElement("button");
		this.toggleBtn.textContent = "Presets";
		this.toggleBtn.style.cssText = "padding:8px 16px;border:1px solid #555;border-radius:4px;background:#1a1a2e;color:#e0e0ff;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s;position:fixed;bottom:55px;left:270px;z-index:9999";
		this.toggleBtn.addEventListener("click", () => this.toggle());
		this.toggleBtn.addEventListener("mouseenter", () => { this.toggleBtn.style.background = "#0f3460"; this.toggleBtn.style.borderColor = "#e94560"; });
		this.toggleBtn.addEventListener("mouseleave", () => { this.toggleBtn.style.background = "#1a1a2e"; this.toggleBtn.style.borderColor = "#555"; });
		document.body.appendChild(this.toggleBtn);
	}

	_buildPanel() {
		this.panel = document.createElement("div");
		this.panel.id = "preset-browser";
		this.panel.style.cssText = "position:fixed;bottom:55px;left:50%;transform:translateX(-50%);width:760px;max-width:calc(100vw - 40px);background:rgba(10,10,20,0.95);border:1px solid #333;border-radius:8px;z-index:9998;display:none;font-family:monospace;color:#ccc;";

		const header = document.createElement("div");
		header.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #333";

		const title = document.createElement("div");
		title.textContent = "Preset Browser";
		title.style.cssText = "color:#e0e0ff;font-size:13px;margin-right:auto";
		header.appendChild(title);

		this.searchInput = document.createElement("input");
		this.searchInput.type = "text";
		this.searchInput.placeholder = "Search presets or tags";
		this.searchInput.style.cssText = "flex:1;min-width:180px;background:#111;color:#ddd;border:1px solid #333;border-radius:4px;padding:6px 8px;font-family:monospace;font-size:12px";
		this.searchInput.addEventListener("input", () => {
			this.searchTerm = this.searchInput.value.trim().toLowerCase();
			this._renderGrid();
		});
		header.appendChild(this.searchInput);

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "Close";
		closeBtn.style.cssText = "padding:6px 10px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#aaa;font-family:monospace;font-size:11px;cursor:pointer";
		closeBtn.addEventListener("click", () => this.hide());
		header.appendChild(closeBtn);

		this.panel.appendChild(header);

		this.kindRow = document.createElement("div");
		this.kindRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #222";
		this.panel.appendChild(this.kindRow);

		this.categoryRow = document.createElement("div");
		this.categoryRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #222";
		this.panel.appendChild(this.categoryRow);

		this.countEl = document.createElement("div");
		this.countEl.style.cssText = "padding:6px 10px;color:#666;font-size:11px";
		this.panel.appendChild(this.countEl);

		this.grid = document.createElement("div");
		this.grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;padding:10px;max-height:360px;overflow:auto";
		this.panel.appendChild(this.grid);

		document.body.appendChild(this.panel);
	}

	async _loadManifest() {
		try {
			const resp = await fetch(MANIFEST_URL);
			this.manifest = await resp.json();
			this._buildFilters();
			this._renderGrid();
			this._loadFromURL();
		} catch (err) {
			console.error("[fxgen] preset manifest load failed:", err);
		}
	}

	_buildFilters() {
		this.kindRow.innerHTML = "";
		this.categoryRow.innerHTML = "";

		const kinds = new Set(["preset", "project"]);
		for (const item of this.manifest) {
			if (item.kind) kinds.add(item.kind);
		}
		this._buildFilterRow(this.kindRow, ["all", ...kinds], value => {
			this.activeKind = value;
			this._renderGrid();
		});

		const categories = new Set(["other"]);
		for (const item of this.manifest) {
			if (item.category) categories.add(item.category);
		}
		const sortedCategories = ["all", ...Array.from(categories).sort()];
		this._buildFilterRow(this.categoryRow, sortedCategories, value => {
			this.activeCategory = value;
			this._renderGrid();
		});
	}

	_buildFilterRow(container, values, onChange) {
		values.forEach(value => {
			const btn = document.createElement("button");
			btn.textContent = value === "all" ? "All" : value.replace(/-/g, " ");
			btn.dataset.value = value;
			btn.style.cssText = "padding:4px 8px;border:1px solid #333;border-radius:4px;background:#141424;color:#aaa;font-family:monospace;font-size:10px;cursor:pointer";
			btn.addEventListener("click", () => {
				container.querySelectorAll("button").forEach(b => { b.style.background = "#141424"; b.style.borderColor = "#333"; b.style.color = "#aaa"; });
				btn.style.background = "#0f3460";
				btn.style.borderColor = "#e94560";
				btn.style.color = "#fff";
				onChange(value);
			});
			container.appendChild(btn);
		});

		const first = container.querySelector("button");
		if (first) {
			first.style.background = "#0f3460";
			first.style.borderColor = "#e94560";
			first.style.color = "#fff";
		}
	}

	_renderGrid() {
		this.grid.innerHTML = "";
		const term = this.searchTerm;

		const filtered = this.manifest.filter(item => {
			const kind = item.kind || "preset";
			const category = item.category || "other";
			if (this.activeKind !== "all" && kind !== this.activeKind) return false;
			if (this.activeCategory !== "all" && category !== this.activeCategory) return false;
			if (!term) return true;
			const tags = (item.tags || []).join(" ");
			const hay = `${item.name || ""} ${item.id || ""} ${category} ${tags}`.toLowerCase();
			return hay.includes(term);
		});

		this.countEl.textContent = `Showing ${filtered.length} of ${this.manifest.length}`;

		filtered.forEach(item => {
			const card = document.createElement("button");
			card.className = "preset-card";
			card.style.cssText = "text-align:left;padding:10px;border:1px solid #222;border-radius:6px;background:#0f0f1a;color:#ddd;font-family:monospace;cursor:pointer;transition:all 0.15s;display:flex;flex-direction:column;gap:6px";
			card.addEventListener("mouseenter", () => { card.style.borderColor = "#e94560"; card.style.background = "#15152a"; });
			card.addEventListener("mouseleave", () => {
				card.style.borderColor = this.selectedId === item.id ? "#e94560" : "#222";
				card.style.background = this.selectedId === item.id ? "#1a1a3e" : "#0f0f1a";
			});
			card.addEventListener("click", () => this.load(item));

			const name = document.createElement("div");
			name.textContent = item.name || item.id;
			name.style.cssText = "font-size:12px;color:#fff";
			card.appendChild(name);

			const meta = document.createElement("div");
			meta.style.cssText = "display:flex;gap:6px;align-items:center;font-size:10px;color:#777";
			const kindBadge = document.createElement("span");
			kindBadge.textContent = (item.kind || "preset").toUpperCase();
			kindBadge.style.cssText = "padding:2px 6px;border:1px solid #333;border-radius:10px;color:#aaa";
			meta.appendChild(kindBadge);

			const cat = document.createElement("span");
			cat.textContent = (item.category || "other").replace(/-/g, " ");
			cat.style.cssText = "color:#666";
			meta.appendChild(cat);
			card.appendChild(meta);

			if (item.description) {
				const desc = document.createElement("div");
				desc.textContent = item.description;
				desc.style.cssText = "font-size:11px;color:#aaa;line-height:1.3";
				card.appendChild(desc);
			}

			if (this.selectedId === item.id) {
				card.style.borderColor = "#e94560";
				card.style.background = "#1a1a3e";
			}

			this.grid.appendChild(card);
		});
	}

	async load(item) {
		if (!item || !item.file) return;
		try {
			const resp = await fetch(item.file);
			const payload = await resp.json();
			if (item.kind === "project") this.app.applyProject(payload);
			else this.app.applyPreset(payload);
			this.selectedId = item.id;
			this._renderGrid();
			console.log("[fxgen] loaded", item.kind || "preset", item.id);
		} catch (err) {
			console.error("[fxgen] preset load failed:", err);
		}
	}

	_loadFromURL() {
		const url = new URL(window.location.href);
		const presetId = url.searchParams.get("preset");
		const projectId = url.searchParams.get("project");
		const match = this.manifest.find(item => item.id === (projectId || presetId));
		if (match) {
			this.load(match);
			return;
		}
		if (this.manifest.length > 0) this.load(this.manifest[0]);
	}

	show() { this.panel.style.display = "block"; }
	hide() { this.panel.style.display = "none"; }
	toggle() {
		this.panel.style.display = this.panel.style.display === "none" ? "block" : "none";
	}
}
