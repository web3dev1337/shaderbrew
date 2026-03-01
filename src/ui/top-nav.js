/**
 * Global top navigation bar for page-to-page navigation.
 */
const NAV_GROUPS = [
	{
		label: "Build",
		items: [{ label: "Editor", href: "editor.html" }]
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
];

function initTopNav() {
	if (document.getElementById("top-nav")) return;

	const isEditor = !!document.getElementById("toolbar") || !!document.getElementById("layer-panel")
		|| document.querySelector('script[src="src/app.js"]');

	const style = document.createElement("style");
	style.textContent = `
		:root { --top-nav-height: 44px; }
		body.has-top-nav { padding-top: var(--top-nav-height); }
		#top-nav {
			position: fixed; top: 0; left: 0; right: 0; height: var(--top-nav-height);
			display: flex; align-items: center; gap: 6px; padding: 0 16px;
			background: linear-gradient(180deg, rgba(12, 12, 20, 0.99) 0%, rgba(8, 8, 14, 0.99) 100%);
			border-bottom: 1px solid #2a2a3f;
			font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
			font-size: 13px; color: #ccc; z-index: 10000;
			backdrop-filter: blur(12px);
			overflow-x: auto;
			scrollbar-width: none;
		}
		#top-nav::-webkit-scrollbar { display: none; }
		#top-nav .nav-title {
			color: #e0e0ff; font-weight: 700; margin-right: 10px;
			letter-spacing: 0.12em; font-size: 15px; white-space: nowrap;
			font-family: monospace;
		}
		#top-nav .nav-sep {
			width: 1px; height: 20px; background: #2a2a40; margin: 0 4px; flex-shrink: 0;
		}
		#top-nav a {
			color: #b0b0c0; text-decoration: none; padding: 6px 12px;
			border-radius: 6px; transition: all 0.15s;
			white-space: nowrap; font-weight: 500;
		}
		#top-nav a:hover { color: #fff; background: rgba(255,255,255,0.07); }
		#top-nav a.active {
			color: #fff; background: rgba(233, 69, 96, 0.15);
			box-shadow: inset 0 0 0 1px rgba(233, 69, 96, 0.4);
		}
		#top-nav .nav-spacer { flex: 1; }
		#top-nav .nav-right a { color: #8888aa; font-size: 12px; padding: 5px 10px; }
		#top-nav .nav-right a:hover { color: #ddd; background: rgba(255,255,255,0.05); }
		#site-footer {
			border-top: 1px solid #1a1a2e; padding: 18px 24px; margin-top: 40px;
			display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
			font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #999;
		}
		#site-footer a { color: #aaa; text-decoration: none; transition: color .15s; }
		#site-footer a:hover { color: #e0e0ff; }
		#site-footer .footer-credit { color: #999; }
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

	for (let gi = 0; gi < NAV_GROUPS.length; gi++) {
		const group = NAV_GROUPS[gi];
		if (gi > 0) {
			const sep = document.createElement("div");
			sep.className = "nav-sep";
			nav.appendChild(sep);
		}
		for (const item of group.items) {
			const link = document.createElement("a");
			link.href = item.href;
			link.textContent = item.label;
			if (path === item.href) link.classList.add("active");
			nav.appendChild(link);
		}
	}

	const spacer = document.createElement("div");
	spacer.className = "nav-spacer";
	nav.appendChild(spacer);

	const rightGroup = document.createElement("div");
	rightGroup.className = "nav-right";
	rightGroup.style.cssText = "display:flex;align-items:center;gap:2px";

	const creditsLink = document.createElement("a");
	creditsLink.href = "credits.html";
	creditsLink.textContent = "Credits";
	if (path === "credits.html") creditsLink.classList.add("active");
	rightGroup.appendChild(creditsLink);

	const ghLink = document.createElement("a");
	ghLink.href = "https://github.com/web3dev1337/shaderbrew";
	ghLink.target = "_blank";
	ghLink.textContent = "GitHub";
	rightGroup.appendChild(ghLink);

	nav.appendChild(rightGroup);

	if (!isEditor) document.body.classList.add("has-top-nav");
	document.body.appendChild(nav);

	if (!isEditor && path !== "credits.html") {
		const footer = document.createElement("div");
		footer.id = "site-footer";
		footer.innerHTML = `<span class="footer-credit">Shader library: <a href="https://github.com/mebiusbox/pixy.js" target="_blank">pixy.js</a> by <a href="https://github.com/mebiusbox" target="_blank">mebiusbox</a> (MIT) · Includes <a href="credits.html">Shadertoy community shaders</a></span><span><a href="credits.html">Credits</a> · <a href="https://github.com/web3dev1337/shaderbrew" target="_blank">GitHub</a></span>`;
		document.body.appendChild(footer);
	}

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
