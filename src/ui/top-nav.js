/**
 * Global top navigation bar for page-to-page navigation.
 */
const NAV_GROUPS = [
	{
		label: "Editor",
		items: [{ label: "Editor", href: "editor.html" }]
	},
	{
		label: "Galleries",
		items: [
			{ label: "Gallery", href: "gallery.html" },
			{ label: "Showcase", href: "showcase.html" },
			{ label: "Demos", href: "demos.html" },
			{ label: "Sprite Gallery", href: "sprite-gallery.html" }
		]
	},
	{
		label: "Particles",
		items: [
			{ label: "Particles", href: "particles.html" },
			{ label: "Particle Gallery", href: "particle-gallery.html" }
		]
	},
	{
		label: "Legacy",
		items: [{ label: "Classic", href: "index.html" }]
	}
];

function initTopNav() {
	if (document.getElementById("top-nav")) return;

	const style = document.createElement("style");
	style.textContent = `
		:root { --top-nav-height: 34px; }
		body.has-top-nav { padding-top: var(--top-nav-height); }
		#top-nav {
			position: fixed; top: 0; left: 0; right: 0; height: var(--top-nav-height);
			display: flex; align-items: center; gap: 10px; padding: 0 12px;
			background: rgba(8, 8, 14, 0.92); border-bottom: 1px solid #222;
			font-family: monospace; font-size: 12px; color: #bbb; z-index: 10000;
			backdrop-filter: blur(8px);
		}
		#top-nav .nav-title { color: #e0e0ff; font-weight: 600; margin-right: 6px; }
		#top-nav .nav-group {
			display: flex; align-items: center; gap: 6px; padding-right: 10px; margin-right: 4px;
			border-right: 1px solid #222;
		}
		#top-nav .nav-group:last-of-type { border-right: none; }
		#top-nav .nav-group-label {
			font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.08em;
		}
		#top-nav a {
			color: #aaa; text-decoration: none; padding: 4px 8px;
			border: 1px solid transparent; border-radius: 4px; transition: all 0.15s;
		}
		#top-nav a:hover { color: #fff; border-color: #444; background: #16162a; }
		#top-nav a.active { color: #fff; border-color: #e94560; background: #1a1a3e; box-shadow: 0 0 0 1px rgba(233,69,96,0.25) inset; }
		#top-nav .nav-spacer { flex: 1; }
	`;
	document.head.appendChild(style);

	const nav = document.createElement("div");
	nav.id = "top-nav";

	const title = document.createElement("div");
	title.className = "nav-title";
	title.textContent = "EffectTextureMaker";
	nav.appendChild(title);

	const path = window.location.pathname.split("/").pop() || "index.html";

	for (const group of NAV_GROUPS) {
		const groupEl = document.createElement("div");
		groupEl.className = "nav-group";

		const label = document.createElement("div");
		label.className = "nav-group-label";
		label.textContent = group.label;
		groupEl.appendChild(label);

		for (const item of group.items) {
			const link = document.createElement("a");
			link.href = item.href;
			link.textContent = item.label;
			if (path === item.href) link.classList.add("active");
			groupEl.appendChild(link);
		}

		nav.appendChild(groupEl);
	}

	const spacer = document.createElement("div");
	spacer.className = "nav-spacer";
	nav.appendChild(spacer);

	document.body.classList.add("has-top-nav");
	document.body.appendChild(nav);

	const toolbar = document.getElementById("toolbar");
	if (toolbar) toolbar.style.top = "var(--top-nav-height)";
	const layerPanel = document.getElementById("layer-panel");
	if (layerPanel) layerPanel.style.top = "var(--top-nav-height)";
	const canvas = document.querySelector("canvas");
	if (canvas && toolbar) {
		canvas.style.top = "calc(var(--top-nav-height) + 36px)";
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initTopNav);
} else {
	initTopNav();
}

export { initTopNav };
