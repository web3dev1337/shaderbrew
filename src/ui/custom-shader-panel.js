export class CustomShaderPanel {
	constructor() {
		this.backdrop = null;
		this.container = null;
		this.entries = [];
		this.visible = false;
		this.animStarted = false;
	}

	build() {
		// Backdrop dims the whole editor
		this.backdrop = document.createElement("div");
		this.backdrop.id = "custom-shader-backdrop";
		this.backdrop.style.cssText = `
			position: fixed; inset: 0; z-index: 10000;
			background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
			display: none;
		`;
		this.backdrop.addEventListener("click", (e) => {
			if (e.target === this.backdrop) this.hide();
		});

		this.container = document.createElement("div");
		this.container.id = "custom-shader-panel";
		this.container.style.cssText = `
			position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
			width: min(900px, calc(100vw - 2rem)); max-height: min(680px, calc(100vh - 4rem));
			background: rgba(10, 10, 20, 0.98); border: 1px solid #2a2a4a; border-radius: 10px;
			padding: 20px 24px; z-index: 10001; display: none;
			font-family: monospace; font-size: 12px; color: #ccc;
			box-shadow: 0 16px 64px rgba(0,0,0,0.7), 0 0 1px rgba(233,69,96,0.3);
			overflow: hidden; display: none; flex-direction: column;
		`;

		const header = document.createElement("div");
		header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0";

		const titleArea = document.createElement("div");
		const title = document.createElement("div");
		title.textContent = "Custom GLSL Library";
		title.style.cssText = "color:#e0e0ff;font-size:16px;font-weight:bold;letter-spacing:0.5px";
		titleArea.appendChild(title);
		const sub = document.createElement("div");
		sub.textContent = "Hand-written fragment shaders rendered as 6\u00d76 sprite sheets";
		sub.style.cssText = "color:#666;font-size:11px;margin-top:4px";
		titleArea.appendChild(sub);
		header.appendChild(titleArea);

		const actions = document.createElement("div");
		actions.style.cssText = "display:flex;gap:10px;align-items:center";

		const link = document.createElement("a");
		link.href = "sprite-gallery.html?source=custom";
		link.textContent = "Full Gallery \u2192";
		link.style.cssText = "color:#e94560;text-decoration:none;font-size:12px;padding:6px 12px;border:1px solid rgba(233,69,96,0.3);border-radius:5px;transition:all 0.15s";
		link.addEventListener("mouseenter", () => { link.style.background = "rgba(233,69,96,0.15)"; link.style.borderColor = "#e94560"; });
		link.addEventListener("mouseleave", () => { link.style.background = "transparent"; link.style.borderColor = "rgba(233,69,96,0.3)"; });
		actions.appendChild(link);

		const close = document.createElement("button");
		close.innerHTML = "\u2715";
		close.style.cssText = "width:32px;height:32px;border:1px solid #2a2a3a;border-radius:6px;background:#111122;color:#999;font-size:16px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center";
		close.addEventListener("mouseenter", () => { close.style.background = "rgba(233,69,96,0.2)"; close.style.borderColor = "#e94560"; close.style.color = "#fff"; });
		close.addEventListener("mouseleave", () => { close.style.background = "#111122"; close.style.borderColor = "#2a2a3a"; close.style.color = "#999"; });
		close.addEventListener("click", () => this.hide());
		actions.appendChild(close);

		header.appendChild(actions);
		this.container.appendChild(header);

		const grid = document.createElement("div");
		grid.style.cssText = `
			display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 12px; overflow-y: auto; overflow-x: hidden; flex: 1;
			padding: 4px 2px 4px 0;
		`;
		this.container.appendChild(grid);

		const items = [
			{ name: "Volumetric Nebula", file: "101-volumetric-nebula", fps: 6, desc: "Raymarched emission" },
			{ name: "Black Hole", file: "102-black-hole", fps: 5, desc: "Lensing + accretion disk" },
			{ name: "Warp Tunnel", file: "106-warp-tunnel", fps: 10, desc: "Hyperspace streaks" },
			{ name: "Cosmic Jellyfish", file: "115-cosmic-jellyfish", fps: 6, desc: "Bioluminescent flow" },
			{ name: "God Rays", file: "116-god-rays", fps: 6, desc: "Volumetric beams" },
			{ name: "Phoenix Rebirth", file: "119-phoenix-rebirth", fps: 8, desc: "Flame wings" },
			{ name: "Dimensional Portal", file: "121-dimensional-portal", fps: 8, desc: "Ring distortion" },
			{ name: "Time Vortex", file: "130-time-vortex", fps: 8, desc: "Clockwork spiral" },
			{ name: "Reality Shatter", file: "139-reality-shatter", fps: 7, desc: "Fractured space" },
			{ name: "Particle Collider", file: "141-particle-collider", fps: 10, desc: "Beam collision" },
			{ name: "Void Tendril", file: "150-void-tendril", fps: 7, desc: "Abyssal reach" },
			{ name: "Summoning Circle", file: "151-summoning-circle", fps: 7, desc: "Arcane sigils" }
		];

		for (const item of items) {
			const card = document.createElement("div");
			card.style.cssText = "background:#0a0a14;border:1px solid #1a1a2e;border-radius:8px;overflow:hidden;transition:all 0.15s;cursor:pointer";
			card.addEventListener("mouseenter", () => { card.style.borderColor = "#e94560"; card.style.boxShadow = "0 4px 16px rgba(233,69,96,0.15)"; });
			card.addEventListener("mouseleave", () => { card.style.borderColor = "#1a1a2e"; card.style.boxShadow = "none"; });

			const canvas = document.createElement("canvas");
			canvas.width = 192;
			canvas.height = 192;
			canvas.style.cssText = "width:100%;aspect-ratio:1;display:block;background:#000";
			card.appendChild(canvas);

			const label = document.createElement("div");
			label.style.cssText = "padding:8px 10px;font-size:10px;color:#777;border-top:1px solid #1a1a2e";
			label.innerHTML = `<div style="color:#e0e0ff;font-size:12px;font-weight:bold;margin-bottom:2px">${item.name}</div>${item.desc}`;
			card.appendChild(label);
			grid.appendChild(card);

			const ctx = canvas.getContext("2d");
			const img = new Image();
			img.src = `sprites/${item.file}.png`;
			const entry = { ctx, img, fps: item.fps, frame: 0, last: 0, loaded: false, cell: 192, cw: 192 };
			img.onload = () => {
				entry.loaded = true;
				entry.cell = Math.round(img.naturalWidth / 6);
				this._drawFrame(entry);
			};
			this.entries.push(entry);
		}

		// Escape key to close
		this._onKey = (e) => {
			if (e.key === "Escape" && this.visible) {
				e.preventDefault();
				this.hide();
			}
		};
		document.addEventListener("keydown", this._onKey);

		document.body.appendChild(this.backdrop);
		document.body.appendChild(this.container);
	}

	show() {
		this.visible = true;
		this.backdrop.style.display = "block";
		this.container.style.display = "flex";
		this._ensureAnim();
	}

	hide() {
		this.visible = false;
		this.backdrop.style.display = "none";
		this.container.style.display = "none";
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
			for (const entry of this.entries) {
				if (!entry.loaded) continue;
				if (ts - entry.last < 1000 / entry.fps) continue;
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
}
