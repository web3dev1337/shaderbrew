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
		items: [{ label: "Classic", href: "classic.html" }]
	}
];

function initTopNav() {
	if (document.getElementById("top-nav")) return;

	const isEditor = !!document.getElementById("toolbar") || !!document.getElementById("layer-panel")
		|| document.querySelector('script[src="src/app.js"]');

	const style = document.createElement("style");
	style.textContent = `
		:root { --top-nav-height: 36px; }
		body.has-top-nav { padding-top: var(--top-nav-height); }
		#top-nav {
			position: fixed; top: 0; left: 0; right: 0; height: var(--top-nav-height);
			display: flex; align-items: center; gap: 10px; padding: 0 12px;
			background: rgba(5, 5, 10, 0.98);
			border-bottom: 1px solid #1f1f2f;
			font-family: monospace; font-size: 11px; color: #bbb; z-index: 10000;
			backdrop-filter: blur(8px);
			overflow-x: auto;
			scrollbar-width: none;
		}
		#top-nav::-webkit-scrollbar { display: none; }
		#top-nav .nav-title {
			color: #e0e0ff; font-weight: 700; margin-right: 2px;
			letter-spacing: 0.1em; font-size: 10px; white-space: nowrap;
			opacity: 0.7;
		}
		#top-nav .nav-group {
			display: flex; align-items: center; gap: 4px; padding-right: 10px; margin-right: 2px;
			border-right: 1px solid #1a1a2a;
		}
		#top-nav .nav-group:last-of-type { border-right: none; }
		#top-nav .nav-group-label {
			font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.1em;
		}
		#top-nav a {
			color: #888; text-decoration: none; padding: 3px 7px;
			border: 1px solid transparent; border-radius: 3px; transition: all 0.15s;
			white-space: nowrap;
		}
		#top-nav a:hover { color: #ddd; border-color: #333; background: rgba(255,255,255,0.03); }
		#top-nav a.primary { border-color: #e94560; color: #e0e0ff; background: rgba(233, 69, 96, 0.08); }
		#top-nav a.active { color: #fff; border-color: #e94560; background: rgba(233, 69, 96, 0.12); }
		#top-nav .nav-group.active-group .nav-group-label { color: #e94560; }
		#top-nav .nav-spacer { flex: 1; }
		#top-nav .nav-credit {
			color: #444; font-size: 9px; white-space: nowrap;
			text-decoration: none; transition: color 0.15s;
		}
		#top-nav .nav-credit:hover { color: #888; }
	`;
	document.head.appendChild(style);

	const nav = document.createElement("div");
	nav.id = "top-nav";

	const title = document.createElement("div");
	title.className = "nav-title";
	title.textContent = "SHADERBREW";
	nav.appendChild(title);

	const raw = window.location.pathname.split("/").pop() || "index.html";
	const path = raw === "index.html" ? "showcase.html" : raw;

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

	const ghLink = document.createElement("a");
	ghLink.className = "nav-credit";
	ghLink.href = "https://github.com/web3dev1337/shaderbrew";
	ghLink.target = "_blank";
	ghLink.style.cssText = "color:#666;font-size:10px;margin-right:8px";
	ghLink.textContent = "GitHub";
	nav.appendChild(ghLink);

	const credit = document.createElement("a");
	credit.className = "nav-credit";
	credit.href = "https://github.com/mebiusbox/EffectTextureMaker";
	credit.target = "_blank";
	credit.textContent = "Based on EffectTextureMaker by mebiusbox";
	nav.appendChild(credit);

	if (!isEditor) document.body.classList.add("has-top-nav");
	document.body.appendChild(nav);

	if (isEditor) {
		const toolbar = document.getElementById("toolbar");
		if (toolbar) toolbar.style.top = "var(--top-nav-height)";
		const layerPanel = document.getElementById("layer-panel");
		if (layerPanel) layerPanel.style.top = "var(--top-nav-height)";
		const canvas = document.querySelector("canvas");
		if (canvas && toolbar) {
			canvas.style.top = "calc(var(--top-nav-height) + 36px)";
		}
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initTopNav);
} else {
	initTopNav();
}

export { initTopNav };
