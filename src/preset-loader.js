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
		this.thumbCache = {};
		this.thumbSize = 96;
	}

	buildUI({ showToggle = true } = {}) {
		if (showToggle) this._buildToggle();
		this._buildPanel();
		this._loadThumbCache();
		this._loadManifest();
	}

	_buildToggle() {
		// Toggle handled by ActionDock — no standalone button needed
	}

	_buildPanel() {
		this.panel = document.createElement("div");
		this.panel.id = "preset-browser";
		this.panel.style.cssText = "position:fixed;bottom:44px;left:50%;transform:translateX(-50%);width:min(760px, calc(100vw - 2rem));background:rgba(8,8,16,0.97);border:1px solid #1f1f2f;border-radius:8px 8px 0 0;z-index:9998;display:none;font-family:monospace;color:#ccc;box-shadow:0 -4px 30px rgba(0,0,0,0.4);border-bottom:none";

		const header = document.createElement("div");
		header.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #1f1f2f";

		const title = document.createElement("div");
		title.textContent = "Preset Browser";
		title.style.cssText = "color:#e0e0ff;font-size:13px;margin-right:auto";
		header.appendChild(title);

		this.searchInput = document.createElement("input");
		this.searchInput.type = "text";
		this.searchInput.placeholder = "Search presets or tags";
		this.searchInput.style.cssText = "flex:1;min-width:180px;background:#0a0a14;color:#ddd;border:1px solid #2a2a3a;border-radius:4px;padding:6px 8px;font-family:monospace;font-size:12px";
		this.searchInput.addEventListener("input", () => {
			this.searchTerm = this.searchInput.value.trim().toLowerCase();
			this._renderGrid();
		});
		header.appendChild(this.searchInput);

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "Close";
		closeBtn.style.cssText = "padding:6px 10px;border:1px solid #2a2a3a;border-radius:4px;background:#111122;color:#aaa;font-family:monospace;font-size:11px;cursor:pointer;transition:all 0.15s";
		closeBtn.addEventListener("click", () => this.hide());
		header.appendChild(closeBtn);

		this.panel.appendChild(header);

		this.kindRow = document.createElement("div");
		this.kindRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #1a1a2a";
		this.panel.appendChild(this.kindRow);

		this.categoryRow = document.createElement("div");
		this.categoryRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid #1a1a2a";
		this.panel.appendChild(this.categoryRow);

		this.countEl = document.createElement("div");
		this.countEl.style.cssText = "padding:6px 10px;color:#666;font-size:11px";
		this.panel.appendChild(this.countEl);

		this.grid = document.createElement("div");
		this.grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;padding:10px;max-height:360px;overflow:auto";
		this.panel.appendChild(this.grid);

		document.body.appendChild(this.panel);
	}

	_loadThumbCache() {
		try {
			const raw = localStorage.getItem("fxgen_preset_thumbs");
			if (raw) this.thumbCache = JSON.parse(raw);
		} catch (err) {
			console.warn("[fxgen] failed to load preset thumbs", err);
		}
	}

	_saveThumbCache() {
		try {
			localStorage.setItem("fxgen_preset_thumbs", JSON.stringify(this.thumbCache));
		} catch (err) {
			console.warn("[fxgen] failed to save preset thumbs", err);
		}
	}

	async _loadManifest() {
		try {
			const resp = await fetch(MANIFEST_URL);
			this.manifest = await resp.json();
			this._buildFilters();
			this._renderGrid();
			this._loadFromURL();
			this._generateAllThumbs();
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
			btn.style.cssText = "padding:4px 8px;border:1px solid #2a2a3a;border-radius:4px;background:#0c0c18;color:#aaa;font-family:monospace;font-size:10px;cursor:pointer;transition:all 0.15s";
			btn.addEventListener("click", () => {
				container.querySelectorAll("button").forEach(b => { b.style.background = "#0c0c18"; b.style.borderColor = "#2a2a3a"; b.style.color = "#aaa"; });
				btn.style.background = "rgba(233, 69, 96, 0.12)";
				btn.style.borderColor = "#e94560";
				btn.style.color = "#fff";
				onChange(value);
			});
			container.appendChild(btn);
		});

		const first = container.querySelector("button");
		if (first) {
			first.style.background = "rgba(233, 69, 96, 0.12)";
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
			card.dataset.id = item.id;
			card.className = "preset-card";
			card.style.cssText = "text-align:left;padding:10px;border:1px solid #1a1a2a;border-radius:6px;background:#0a0a14;color:#ddd;font-family:monospace;cursor:pointer;transition:all 0.15s;display:flex;flex-direction:column;gap:6px";
			card.addEventListener("mouseenter", () => { card.style.borderColor = "#e94560"; card.style.background = "#111122"; });
			card.addEventListener("mouseleave", () => {
				card.style.borderColor = this.selectedId === item.id ? "#e94560" : "#1a1a2a";
				card.style.background = this.selectedId === item.id ? "rgba(233, 69, 96, 0.08)" : "#0a0a14";
			});
			card.addEventListener("click", () => this.load(item));

			const thumbWrap = document.createElement("div");
			thumbWrap.className = "preset-thumb-wrap";
			thumbWrap.style.cssText = "width:100%;height:96px;border:1px solid #1a1a2a;border-radius:4px;background:#060610;display:flex;align-items:center;justify-content:center;overflow:hidden";
			const thumbUrl = this.thumbCache[item.id];
			if (thumbUrl) {
				const img = document.createElement("img");
				img.className = "preset-thumb";
				img.src = thumbUrl;
				img.alt = `${item.name || item.id} preview`;
				img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
				thumbWrap.appendChild(img);
			} else {
				const ph = document.createElement("div");
				ph.textContent = "Preview";
				ph.style.cssText = "font-size:10px;color:#444;letter-spacing:1px";
				thumbWrap.appendChild(ph);
			}
			card.appendChild(thumbWrap);

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
				card.style.background = "rgba(233, 69, 96, 0.08)";
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
			this._captureThumb(item.id);
			console.log("[fxgen] loaded", item.kind || "preset", item.id);
		} catch (err) {
			console.error("[fxgen] preset load failed:", err);
		}
	}

	async _captureThumb(id) {
		if (!this.app || !this.app.canvas || !id) return;
		this.app.requestRender();
		await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
		const src = this.app.canvas;
		const cv = document.createElement("canvas");
		cv.width = this.thumbSize;
		cv.height = this.thumbSize;
		const ctx = cv.getContext("2d");
		ctx.drawImage(src, 0, 0, cv.width, cv.height);
		const url = cv.toDataURL("image/png");
		this.thumbCache[id] = url;
		this._saveThumbCache();
		const card = this.grid && this.grid.querySelector(`.preset-card[data-id="${id}"]`);
		if (card) {
			const wrap = card.querySelector(".preset-thumb");
			if (wrap) {
				wrap.src = url;
			} else {
				const holder = card.querySelector(".preset-thumb-wrap");
				if (holder) holder.innerHTML = "";
				const img = document.createElement("img");
				img.className = "preset-thumb";
				img.src = url;
				img.alt = `${id} preview`;
				img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
				holder && holder.appendChild(img);
			}
		}
		return url;
	}

	async _generateAllThumbs() {
		if (this.generatingThumbs || !this.app || !this.manifest.length) return;
		const missing = this.manifest.filter(item => !this.thumbCache[item.id]);
		if (!missing.length) return;
		this.generatingThumbs = true;
		if (this.countEl) this.countEl.textContent = `Generating ${missing.length} previews...`;

		const app = this.app;
		const snapshot = app.getProjectState ? app.getProjectState() : null;
		const prevAnimate = app.effectController.animate;
		const prevLive = app.liveRender;
		const prevHistory = app.historySuspended;

		app.historySuspended = true;
		app.effectController.animate = false;
		app.liveRender = false;
		app.requestRender();

		for (const item of missing) {
			try {
				const resp = await fetch(item.file);
				const payload = await resp.json();
				if (item.kind === "project") app.applyProject(payload);
				else app.applyPreset(payload);
				await this._captureThumb(item.id);
			} catch (err) {
				console.warn("[fxgen] thumbnail generation failed:", item.id, err);
			}
			await new Promise(r => setTimeout(r, 0));
		}

		if (snapshot) {
			app.applyProject(snapshot);
		}
		app.effectController.animate = prevAnimate;
		app.liveRender = prevLive;
		app.historySuspended = prevHistory;
		app.requestRender();
		this.generatingThumbs = false;
		this._renderGrid();
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
