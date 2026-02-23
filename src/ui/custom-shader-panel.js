import { CUSTOM_SHADER_CATALOG, CUSTOM_PREFIX } from "../custom-shader-registry.js";

const ALL_CUSTOM_SHADERS = [
	{ file: "101-volumetric-nebula", name: "Volumetric Nebula" },
	{ file: "102-black-hole", name: "Black Hole" },
	{ file: "103-shockwave-pulse", name: "Shockwave Pulse" },
	{ file: "104-plasma-containment", name: "Plasma Containment" },
	{ file: "105-julia-fractal-morph", name: "Julia Fractal Morph" },
	{ file: "106-warp-tunnel", name: "Warp Tunnel" },
	{ file: "107-warp-inferno", name: "Warp Inferno" },
	{ file: "108-warp-void", name: "Warp Void" },
	{ file: "109-warp-electric", name: "Warp Electric" },
	{ file: "110-warp-rainbow", name: "Warp Rainbow" },
	{ file: "111-tornado-vortex", name: "Tornado Vortex" },
	{ file: "112-bioluminescent", name: "Bioluminescent" },
	{ file: "113-singularity", name: "Singularity" },
	{ file: "114-aurora-borealis", name: "Aurora Borealis" },
	{ file: "115-cosmic-jellyfish", name: "Cosmic Jellyfish" },
	{ file: "116-god-rays", name: "God Rays" },
	{ file: "117-reality-glitch", name: "Reality Glitch" },
	{ file: "118-crystal-geode", name: "Crystal Geode" },
	{ file: "119-phoenix-rebirth", name: "Phoenix Rebirth" },
	{ file: "120-supernova", name: "Supernova" },
	{ file: "121-dimensional-portal", name: "Dimensional Portal" },
	{ file: "122-deep-ocean", name: "Deep Ocean" },
	{ file: "123-galaxy-spiral", name: "Galaxy Spiral" },
	{ file: "124-mandelbrot-zoom", name: "Mandelbrot Zoom" },
	{ file: "125-chain-lightning", name: "Chain Lightning" },
	{ file: "126-solar-flare", name: "Solar Flare" },
	{ file: "127-whirlpool", name: "Whirlpool" },
	{ file: "128-dna-helix", name: "DNA Helix" },
	{ file: "129-lava-flow", name: "Lava Flow" },
	{ file: "130-time-vortex", name: "Time Vortex" },
	{ file: "131-fluid-ink", name: "Fluid Ink" },
	{ file: "132-quantum-entangle", name: "Quantum Entangle" },
	{ file: "133-gravity-well", name: "Gravity Well" },
	{ file: "134-sound-visualizer", name: "Sound Visualizer" },
	{ file: "135-smoke-ring", name: "Smoke Ring" },
	{ file: "136-magic-runes", name: "Magic Runes" },
	{ file: "137-dissolve", name: "Dissolve" },
	{ file: "138-energy-shield", name: "Energy Shield" },
	{ file: "139-reality-shatter", name: "Reality Shatter" },
	{ file: "140-blood-moon", name: "Blood Moon" },
	{ file: "141-particle-collider", name: "Particle Collider" },
	{ file: "142-dragon-breath", name: "Dragon Breath" },
	{ file: "143-neural-network", name: "Neural Network" },
	{ file: "144-cosmic-eye", name: "Cosmic Eye" },
	{ file: "145-hypercube", name: "Hypercube" },
	{ file: "146-soul-extraction", name: "Soul Extraction" },
	{ file: "147-neon-rain", name: "Neon Rain" },
	{ file: "148-galaxy-collision", name: "Galaxy Collision" },
	{ file: "149-emp-blast", name: "EMP Blast" },
	{ file: "150-void-tendril", name: "Void Tendril" },
	{ file: "151-summoning-circle", name: "Summoning Circle" },
	{ file: "152-lightning-smite", name: "Lightning Smite" },
];

export class CustomShaderPanel {
	constructor(app) {
		this.app = app;
		this.container = null;
		this.entries = [];
		this.visible = false;
		this.animStarted = false;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "custom-shader-panel";
		this.container.style.cssText = `
			position: fixed; top: 0; right: 0; bottom: 44px; width: 300px;
			background: rgba(8, 8, 16, 0.98); border-left: 1px solid #1f1f2f;
			z-index: 9998; display: none; flex-direction: column;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		// Header
		const header = document.createElement("div");
		header.style.cssText = "padding:10px 12px;border-bottom:1px solid #1f1f2f;display:flex;align-items:center;justify-content:space-between;flex-shrink:0";

		const titleWrap = document.createElement("div");
		const title = document.createElement("div");
		title.textContent = "Custom GLSL";
		title.style.cssText = "color:#e0e0ff;font-size:13px;font-weight:bold";
		titleWrap.appendChild(title);
		const count = document.createElement("div");
		count.textContent = ALL_CUSTOM_SHADERS.length + " shaders";
		count.style.cssText = "color:#555;font-size:10px;margin-top:2px";
		titleWrap.appendChild(count);
		header.appendChild(titleWrap);

		const close = document.createElement("button");
		close.textContent = "\u2715";
		close.style.cssText = "width:22px;height:22px;border:1px solid #2a2a3a;border-radius:4px;background:#111122;color:#999;font-size:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;padding:0";
		close.addEventListener("mouseenter", () => { close.style.background = "rgba(233,69,96,0.2)"; close.style.color = "#fff"; });
		close.addEventListener("mouseleave", () => { close.style.background = "#111122"; close.style.color = "#999"; });
		close.addEventListener("click", () => this.hide());
		header.appendChild(close);
		this.container.appendChild(header);

		// Scrollable list
		const list = document.createElement("div");
		list.style.cssText = "flex:1;overflow-y:auto;overflow-x:hidden;padding:6px";
		this.container.appendChild(list);

		for (const item of ALL_CUSTOM_SHADERS) {
			const card = document.createElement("div");
			card.style.cssText = "background:#0a0a14;border:1px solid #1a1a2e;border-radius:6px;overflow:hidden;transition:border-color 0.15s;cursor:pointer;margin-bottom:6px";
			card.addEventListener("mouseenter", () => { card.style.borderColor = "#e94560"; });
			card.addEventListener("mouseleave", () => { card.style.borderColor = "#1a1a2e"; });
			card.addEventListener("click", () => {
				this._applyShader(item.name);
			});

			const canvas = document.createElement("canvas");
			canvas.width = 288;
			canvas.height = 288;
			canvas.style.cssText = "width:100%;aspect-ratio:1;display:block;background:#000";
			card.appendChild(canvas);

			const label = document.createElement("div");
			label.style.cssText = "padding:6px 8px;border-top:1px solid #1a1a2e";
			label.innerHTML = `<span style="color:#e0e0ff;font-size:12px">${item.name}</span>`;
			card.appendChild(label);
			list.appendChild(card);

			const ctx = canvas.getContext("2d");
			const img = new Image();
			img.src = `sprites/${item.file}.png`;
			const entry = { ctx, img, frame: 0, last: 0, loaded: false, cell: 288, cw: 288, el: card };
			img.onload = () => {
				entry.loaded = true;
				entry.cell = Math.round(img.naturalWidth / 6);
				this._drawFrame(entry);
			};
			this.entries.push(entry);
		}

		// Lazy animation — only animate visible cards
		this._list = list;
		document.body.appendChild(this.container);
	}

	show() {
		this.visible = true;
		this.container.style.display = "flex";
		const gui = document.querySelector(".lil-gui.root");
		if (gui) gui.style.display = "none";
		this._ensureAnim();
	}

	hide() {
		this.visible = false;
		this.container.style.display = "none";
		const gui = document.querySelector(".lil-gui.root");
		if (gui) gui.style.display = "";
	}

	toggle() {
		if (this.visible) this.hide();
		else this.show();
	}

	_ensureAnim() {
		if (this.animStarted) return;
		this.animStarted = true;
		requestAnimationFrame(ts => this._animate(ts));
	}

	_animate(ts) {
		if (this.visible && !document.hidden) {
			const listRect = this._list.getBoundingClientRect();
			for (const entry of this.entries) {
				if (!entry.loaded) continue;
				// Only animate cards in view
				const r = entry.el.getBoundingClientRect();
				if (r.bottom < listRect.top || r.top > listRect.bottom) continue;
				if (ts - entry.last < 140) continue;
				entry.last = ts;
				entry.frame = (entry.frame + 1) % 36;
				this._drawFrame(entry);
			}
		}
		requestAnimationFrame(t => this._animate(t));
	}

	_drawFrame(entry) {
		const c = entry.cell;
		const col = entry.frame % 6;
		const row = Math.floor(entry.frame / 6);
		entry.ctx.clearRect(0, 0, entry.cw, entry.cw);
		entry.ctx.drawImage(entry.img, col * c, row * c, c, c, 0, 0, entry.cw, entry.cw);
	}

	_applyShader(name) {
		if (!this.app) return;
		const effectType = CUSTOM_PREFIX + name;
		const layer = this.app.layerManager.getActiveLayer();
		if (layer) {
			this.app.onTypeChange(effectType);
			layer.effectController.type = effectType;
			layer.effectController.animate = true;
			if (this.app.layerPanel) this.app.layerPanel.refresh();
		}
		this.hide();
	}
}
