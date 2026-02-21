/**
 * Preset loading system: bottom bar UI + URL parameter support.
 */

const PRESETS = [
	"helix-nebula", "magma-channels", "storm-eye", "bioluminescent-deep",
	"solar-chromosphere", "neural-tissue", "crystal-voronoi", "frozen-lightning",
	"inferno-vortex", "alien-nebula", "plasma-storm", "ocean-caustics", "dark-matter"
];

export class PresetLoader {
	constructor(app) {
		this.app = app;
		this.bar = null;
	}

	buildUI() {
		this.bar = document.createElement("div");
		this.bar.id = "preset-bar";
		this.bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;gap:8px;padding:10px;background:rgba(0,0,0,0.85);z-index:9999;border-top:1px solid #333";

		for (const name of PRESETS) {
			const btn = document.createElement("button");
			btn.textContent = name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
			btn.style.cssText = "padding:8px 16px;border:1px solid #555;border-radius:4px;background:#1a1a2e;color:#e0e0ff;font-family:monospace;font-size:13px;cursor:pointer;transition:all 0.2s";
			btn.addEventListener("mouseenter", () => { btn.style.background = "#16213e"; btn.style.borderColor = "#0f3460"; btn.style.color = "#fff"; });
			btn.addEventListener("mouseleave", () => { btn.style.background = "#1a1a2e"; btn.style.borderColor = "#555"; btn.style.color = "#e0e0ff"; });
			btn.addEventListener("click", () => {
				this.bar.querySelectorAll("button").forEach(b => { b.style.background = "#1a1a2e"; b.style.borderColor = "#555"; });
				btn.style.background = "#0f3460";
				btn.style.borderColor = "#e94560";
				this.load(name);
			});
			this.bar.appendChild(btn);
		}

		document.body.appendChild(this.bar);
		this._loadFromURL();
	}

	async load(name) {
		try {
			const resp = await fetch("presets/" + name + ".json");
			const preset = await resp.json();
			this.app.applyPreset(preset);
			console.log("[fxgen] loaded preset:", name);
		} catch (err) {
			console.error("[fxgen] preset load failed:", err);
		}
	}

	_loadFromURL() {
		const url = new URL(window.location.href);
		const preset = url.searchParams.get("preset") || PRESETS[0];
		this.load(preset);
		setTimeout(() => {
			const first = this.bar.querySelector("button");
			if (first) { first.style.background = "#0f3460"; first.style.borderColor = "#e94560"; }
		}, 100);
	}
}
