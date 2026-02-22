export class CustomShaderPanel {
	constructor() {
		this.container = null;
		this.entries = [];
		this.visible = false;
		this.animStarted = false;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "custom-shader-panel";
		this.container.style.cssText = `
			position: fixed; bottom: 55px; left: 50%; transform: translateX(-50%);
			background: rgba(10, 10, 20, 0.96); border: 1px solid #333; border-radius: 8px;
			padding: 12px; z-index: 9997; display: none; width: min(960px, 94vw);
			font-family: monospace; font-size: 12px; color: #ccc;
			box-shadow: 0 10px 40px rgba(0,0,0,0.45);
		`;

		const header = document.createElement("div");
		header.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px";

		const title = document.createElement("div");
		title.textContent = "Custom GLSL Library";
		title.style.cssText = "color:#e0e0ff;font-size:13px;letter-spacing:0.5px";
		header.appendChild(title);

		const actions = document.createElement("div");
		actions.style.cssText = "display:flex;gap:8px;align-items:center";

		const link = document.createElement("a");
		link.href = "sprite-gallery.html?source=custom";
		link.textContent = "Open Full Gallery";
		link.style.cssText = "color:#e94560;text-decoration:none;font-size:11px";
		actions.appendChild(link);

		const close = document.createElement("button");
		close.textContent = "Close";
		close.style.cssText = "padding:4px 8px;border:1px solid #444;border-radius:4px;background:#1a1a2e;color:#ccc;font-family:monospace;font-size:11px;cursor:pointer";
		close.addEventListener("mouseenter", () => { close.style.background = "#0f3460"; close.style.borderColor = "#e94560"; close.style.color = "#fff"; });
		close.addEventListener("mouseleave", () => { close.style.background = "#1a1a2e"; close.style.borderColor = "#444"; close.style.color = "#ccc"; });
		close.addEventListener("click", () => this.hide());
		actions.appendChild(close);

		header.appendChild(actions);
		this.container.appendChild(header);

		const sub = document.createElement("div");
		sub.textContent = "52 hand-written fragment shaders rendered as 6×6 sprite sheets. Click the gallery link to explore all builds.";
		sub.style.cssText = "color:#666;font-size:11px;margin-bottom:10px";
		this.container.appendChild(sub);

		const grid = document.createElement("div");
		grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;max-height:52vh;overflow:auto;padding-right:4px";
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
			card.style.cssText = "background:#0a0a14;border:1px solid #1a1a2e;border-radius:6px;overflow:hidden";
			const canvas = document.createElement("canvas");
			canvas.width = 160;
			canvas.height = 160;
			canvas.style.cssText = "width:100%;aspect-ratio:1;display:block;background:#000";
			card.appendChild(canvas);
			const label = document.createElement("div");
			label.style.cssText = "padding:6px 8px;font-size:10px;color:#777;border-top:1px solid #1a1a2e";
			label.innerHTML = `<div style="color:#e0e0ff;font-size:11px;font-weight:bold">${item.name}</div>${item.desc}`;
			card.appendChild(label);
			grid.appendChild(card);

			const ctx = canvas.getContext("2d");
			const img = new Image();
			img.src = `sprites/${item.file}.png`;
			const entry = { ctx, img, fps: item.fps, frame: 0, last: 0, loaded: false, cell: 160 };
			img.onload = () => {
				entry.loaded = true;
				entry.cell = Math.round(img.naturalWidth / 6);
				this._drawFrame(entry);
			};
			this.entries.push(entry);
		}

		document.body.appendChild(this.container);
	}

	show() {
		this.visible = true;
		this.container.style.display = "block";
		this._ensureAnim();
	}

	hide() {
		this.visible = false;
		this.container.style.display = "none";
	}

	toggle() {
		if (this.container.style.display === "none") this.show();
		else this.hide();
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
		entry.ctx.clearRect(0, 0, 160, 160);
		entry.ctx.drawImage(entry.img, col * c, row * c, c, c, 0, 0, 160, 160);
	}
}
