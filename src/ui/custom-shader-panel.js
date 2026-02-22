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
			position: fixed; top: 0; right: 0; bottom: 44px; width: 300px;
			background: rgba(8, 8, 16, 0.98); border-left: 1px solid #1f1f2f;
			z-index: 9998; display: none; flex-direction: column;
			font-family: monospace; font-size: 12px; color: #ccc;
		`;

		// Header
		const header = document.createElement("div");
		header.style.cssText = "padding:10px 12px;border-bottom:1px solid #1f1f2f;display:flex;align-items:center;justify-content:space-between;flex-shrink:0";

		const title = document.createElement("div");
		title.textContent = "Custom GLSL";
		title.style.cssText = "color:#e0e0ff;font-size:13px;font-weight:bold";
		header.appendChild(title);

		const actions = document.createElement("div");
		actions.style.cssText = "display:flex;gap:6px;align-items:center";

		const link = document.createElement("a");
		link.href = "sprite-gallery.html?source=custom";
		link.textContent = "Gallery";
		link.style.cssText = "color:#e94560;text-decoration:none;font-size:11px";
		actions.appendChild(link);

		const close = document.createElement("button");
		close.textContent = "\u2715";
		close.style.cssText = "width:22px;height:22px;border:1px solid #2a2a3a;border-radius:4px;background:#111122;color:#999;font-size:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center;padding:0";
		close.addEventListener("mouseenter", () => { close.style.background = "rgba(233,69,96,0.2)"; close.style.color = "#fff"; });
		close.addEventListener("mouseleave", () => { close.style.background = "#111122"; close.style.color = "#999"; });
		close.addEventListener("click", () => this.hide());
		actions.appendChild(close);

		header.appendChild(actions);
		this.container.appendChild(header);

		// Scrollable grid
		const grid = document.createElement("div");
		grid.style.cssText = `
			flex: 1; overflow-y: auto; overflow-x: hidden;
			padding: 8px; display: flex; flex-direction: column; gap: 8px;
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
			card.style.cssText = "background:#0a0a14;border:1px solid #1a1a2e;border-radius:6px;overflow:hidden;transition:border-color 0.15s;cursor:pointer;flex-shrink:0";
			card.addEventListener("mouseenter", () => { card.style.borderColor = "#e94560"; });
			card.addEventListener("mouseleave", () => { card.style.borderColor = "#1a1a2e"; });

			const canvas = document.createElement("canvas");
			canvas.width = 276;
			canvas.height = 276;
			canvas.style.cssText = "width:100%;aspect-ratio:1;display:block;background:#000";
			card.appendChild(canvas);

			const label = document.createElement("div");
			label.style.cssText = "padding:6px 8px;border-top:1px solid #1a1a2e";
			label.innerHTML = `<div style="color:#e0e0ff;font-size:12px;font-weight:bold">${item.name}</div><div style="color:#666;font-size:10px;margin-top:2px">${item.desc}</div>`;
			card.appendChild(label);
			grid.appendChild(card);

			const ctx = canvas.getContext("2d");
			const img = new Image();
			img.src = `sprites/${item.file}.png`;
			const entry = { ctx, img, fps: item.fps, frame: 0, last: 0, loaded: false, cell: 276, cw: 276 };
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
		this.container.style.display = "flex";
		// Hide lil-gui so they don't stack
		const gui = document.querySelector(".lil-gui.root");
		if (gui) gui.style.display = "none";
		this._ensureAnim();
	}

	hide() {
		this.visible = false;
		this.container.style.display = "none";
		// Restore lil-gui
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
