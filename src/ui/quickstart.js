const STORAGE_KEY = "fxgen_quickstart_done";

export class QuickStart {
	constructor(app) {
		this.app = app;
		this.container = null;
	}

	build() {
		if (document.getElementById("quickstart")) return;
		const style = document.createElement("style");
		style.textContent = `
			#quickstart {
				position: fixed; inset: 0; z-index: 10050; display: none;
				background: rgba(2, 2, 6, 0.82); backdrop-filter: blur(2px);
				font-family: monospace; color: #ccc;
			}
			#quickstart .qs-card {
				width: min(560px, calc(100vw - 40px));
				margin: 8vh auto 0; background: #0a0a14; border: 1px solid #222;
				border-radius: 10px; padding: 16px 18px 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.55);
			}
			#quickstart h2 { color: #e0e0ff; font-size: 18px; margin: 0 0 6px; letter-spacing: 1px; }
			#quickstart p { color: #777; font-size: 12px; margin: 0 0 12px; }
			#quickstart ul { margin: 0 0 12px 18px; padding: 0; font-size: 12px; color: #aaa; }
			#quickstart li { margin: 4px 0; }
			#quickstart .qs-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
			#quickstart button {
				padding: 6px 12px; border: 1px solid #444; border-radius: 4px;
				background: #1a1a2e; color: #aaa; cursor: pointer; transition: all 0.15s;
				font-family: monospace; font-size: 11px;
			}
			#quickstart button.primary { border-color: #e94560; background: #2a1030; color: #ff6b8a; }
			#quickstart button:hover { background: #0f3460; border-color: #e94560; color: #fff; }
			#quickstart .qs-hint { margin-top: 10px; color: #555; font-size: 11px; }
		`;
		document.head.appendChild(style);

		const wrap = document.createElement("div");
		wrap.id = "quickstart";

		const card = document.createElement("div");
		card.className = "qs-card";
		card.innerHTML = `
			<h2>Quick Start</h2>
			<p>Make your first texture in under a minute.</p>
			<ul>
				<li>Open a preset or project from the Presets browser.</li>
				<li>Adjust effect parameters on the right panel.</li>
				<li>Add layers on the left for blends and composites.</li>
				<li>Enable Gradient or PBR for color + material maps.</li>
				<li>Export PNG/ZIP when you like the result.</li>
			</ul>
			<div class="qs-actions">
				<button class="primary" data-action="presets">Open Presets (B)</button>
				<button data-action="blank">Start Blank</button>
				<button data-action="close">Close</button>
			</div>
			<div class="qs-hint">Shortcuts: B presets · G gradient · P PBR · 3 preview · E export · L layout</div>
		`;
		wrap.appendChild(card);
		document.body.appendChild(wrap);
		this.container = wrap;

		wrap.addEventListener("click", e => {
			if (e.target === wrap) this.hide();
		});
		card.addEventListener("click", e => e.stopPropagation());

		card.querySelector("[data-action='presets']").addEventListener("click", () => {
			this.hide();
			this.app.presetLoader?.show();
			this.app.actionDock?.refreshActive();
		});
		card.querySelector("[data-action='blank']").addEventListener("click", () => this.hide());
		card.querySelector("[data-action='close']").addEventListener("click", () => this.hide());

		this.show(false);
	}

	show(force = false) {
		if (!this.container) return;
		if (!force && localStorage.getItem(STORAGE_KEY)) return;
		this.container.style.display = "block";
	}

	hide() {
		if (!this.container) return;
		this.container.style.display = "none";
		localStorage.setItem(STORAGE_KEY, "1");
	}
}
