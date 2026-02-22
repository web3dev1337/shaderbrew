/**
 * Global top navigation bar for page-to-page navigation.
 */
const NAV_GROUPS = [
	{
		label: "Build",
		items: [{ label: "Editor", href: "editor.html", primary: true }]
	},
	{
		label: "Explore",
		items: [
			{ label: "Gallery", href: "gallery.html" },
			{ label: "Showcase", href: "showcase.html" },
			{ label: "Demos", href: "demos.html" }
		]
	},
	{
		label: "Particles",
		items: [
			{ label: "Particles", href: "particles.html" },
			{ label: "Particle Gallery", href: "particle-gallery.html" },
			{ label: "Sprite Gallery", href: "sprite-gallery.html" }
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
		:root { --top-nav-height: 44px; }
		body.has-top-nav { padding-top: var(--top-nav-height); }
		#top-nav {
			position: fixed; top: 0; left: 0; right: 0; height: var(--top-nav-height);
			display: flex; align-items: center; gap: 14px; padding: 0 16px;
			background: linear-gradient(180deg, rgba(8, 8, 14, 0.98), rgba(8, 8, 14, 0.92));
			border-bottom: 1px solid #1f1f2f;
			font-family: monospace; font-size: 12px; color: #bbb; z-index: 10000;
			backdrop-filter: blur(8px);
			overflow-x: auto;
			scrollbar-width: none;
		}
		#top-nav::-webkit-scrollbar { display: none; }
		#top-nav .nav-title {
			color: #e0e0ff; font-weight: 700; margin-right: 4px;
			letter-spacing: 0.12em; font-size: 11px;
		}
		#top-nav .nav-group {
			display: flex; align-items: center; gap: 6px; padding-right: 12px; margin-right: 4px;
			border-right: 1px solid #1c1c2a;
		}
		#top-nav .nav-group:last-of-type { border-right: none; }
		#top-nav .nav-group-label {
			font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.12em;
		}
		#top-nav a {
			color: #aaa; text-decoration: none; padding: 4px 8px;
			border: 1px solid transparent; border-radius: 4px; transition: all 0.15s;
		}
		#top-nav a:hover { color: #fff; border-color: #444; background: #16162a; }
		#top-nav a.primary { border-color: #e94560; color: #fff; background: #1a1a3e; }
		#top-nav a.active { color: #fff; border-color: #e94560; background: #1a1a3e; box-shadow: 0 0 0 1px rgba(233,69,96,0.25) inset; }
		#top-nav .nav-group.active-group .nav-group-label { color: #e94560; }
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

		let groupActive = false;
		for (const item of group.items) {
			const link = document.createElement("a");
			link.href = item.href;
			link.textContent = item.label;
			if (item.primary) link.classList.add("primary");
			if (path === item.href) {
				link.classList.add("active");
				groupActive = true;
			}
			groupEl.appendChild(link);
		}
		if (groupActive) groupEl.classList.add("active-group");

		nav.appendChild(groupEl);
	}

	const spacer = document.createElement("div");
	spacer.className = "nav-spacer";
	nav.appendChild(spacer);

	const editorLayout = document.getElementById("toolbar") || document.getElementById("layer-panel");
	if (!editorLayout) document.body.classList.add("has-top-nav");
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
