/**
 * 3D material preview.
 * Renders a sphere/cube/plane with generated PBR maps applied via MeshStandardMaterial.
 * Uses a separate renderer — textures are copied via canvas to bridge GL contexts.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MESH_TYPES = ["Sphere", "Cube", "Cylinder", "Plane"];

export class Preview3D {
	constructor(pbrGenerator) {
		this.pbrGenerator = pbrGenerator;
		this.visible = false;
		this.meshType = "Sphere";
		this.autoRotate = true;
		this.container = null;
		this.renderer = null;
		this.scene = null;
		this.camera = null;
		this.controls = null;
		this.mesh = null;
		this.material = null;
		this.envMap = null;
		this.statusEl = null;
		this._colorTex = null;
		this._copyCanvas = null;
	}

	build() {
		this.container = document.createElement("div");
		this.container.id = "preview-3d";
		this.container.style.cssText = `
			position: fixed; top: 36px; right: 300px; width: 300px; height: 300px;
			background: #0a0a14; border: 1px solid #1f1f2f; border-radius: 0 0 0 8px;
			z-index: 9996; display: none; overflow: hidden;
			box-shadow: -4px 4px 20px rgba(0,0,0,0.3);
		`;

		const toolbar = document.createElement("div");
		toolbar.style.cssText = "position:absolute;top:0;left:0;right:0;height:28px;background:rgba(5,5,10,0.95);display:flex;align-items:center;gap:4px;padding:0 6px;z-index:1;border-bottom:1px solid #1f1f2f";

		const title = document.createElement("span");
		title.textContent = "3D Preview";
		title.style.cssText = "color:#e0e0ff;font-family:monospace;font-size:11px;margin-right:auto";
		toolbar.appendChild(title);

		const meshSelect = document.createElement("select");
		meshSelect.style.cssText = "background:#111122;color:#ccc;border:1px solid #2a2a3a;border-radius:3px;font-size:10px;padding:1px 4px;font-family:monospace";
		for (const t of MESH_TYPES) {
			const opt = document.createElement("option");
			opt.value = t;
			opt.textContent = t;
			opt.selected = t === this.meshType;
			meshSelect.appendChild(opt);
		}
		meshSelect.addEventListener("change", () => {
			this.meshType = meshSelect.value;
			this._updateMesh();
		});
		toolbar.appendChild(meshSelect);

		const rotLabel = document.createElement("label");
		rotLabel.style.cssText = "display:flex;align-items:center;gap:2px;color:#888;font-family:monospace;font-size:10px;cursor:pointer";
		const rotCb = document.createElement("input");
		rotCb.type = "checkbox";
		rotCb.checked = this.autoRotate;
		rotCb.addEventListener("change", () => { this.autoRotate = rotCb.checked; });
		rotLabel.appendChild(rotCb);
		rotLabel.appendChild(document.createTextNode("Spin"));
		toolbar.appendChild(rotLabel);

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "x";
		closeBtn.style.cssText = "width:18px;height:18px;border:1px solid #2a2a3a;border-radius:3px;background:#111122;color:#ccc;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;font-family:monospace;transition:all 0.15s";
		closeBtn.addEventListener("mouseenter", () => { closeBtn.style.borderColor = "#e94560"; closeBtn.style.color = "#fff"; });
		closeBtn.addEventListener("mouseleave", () => { closeBtn.style.borderColor = "#2a2a3a"; closeBtn.style.color = "#ccc"; });
		closeBtn.addEventListener("click", () => this.hide());
		toolbar.appendChild(closeBtn);

		this.container.appendChild(toolbar);

		this.statusEl = document.createElement("div");
		this.statusEl.style.cssText = `
			position:absolute;left:0;right:0;bottom:0;height:18px;
			background:rgba(5,5,10,0.9);border-top:1px solid #1f1f2f;
			display:flex;align-items:center;justify-content:center;
			font-family:monospace;font-size:10px;color:#555;letter-spacing:0.3px;
			pointer-events:none;z-index:1;
		`;
		this.statusEl.textContent = "Color: Base";
		this.container.appendChild(this.statusEl);

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setSize(300, 272);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.2;
		this.renderer.domElement.style.cssText = "position:absolute;top:28px;left:0";
		this.container.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x111111);

		this.camera = new THREE.PerspectiveCamera(45, 300 / 272, 0.1, 100);
		this.camera.position.set(0, 0, 3);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
		this.scene.add(ambientLight);

		const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
		dirLight1.position.set(3, 3, 3);
		this.scene.add(dirLight1);

		const dirLight2 = new THREE.DirectionalLight(0x6688cc, 0.8);
		dirLight2.position.set(-2, 1, -1);
		this.scene.add(dirLight2);

		const rimLight = new THREE.DirectionalLight(0xff4444, 0.3);
		rimLight.position.set(0, -2, -3);
		this.scene.add(rimLight);

		this.material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			roughness: 0.5,
			metalness: 0.0,
			side: THREE.DoubleSide
		});

		this._updateMesh();
		document.body.appendChild(this.container);
	}

	show() {
		this.visible = true;
		this.container.style.display = "block";
	}

	hide() {
		this.visible = false;
		this.container.style.display = "none";
	}

	toggle() {
		if (this.visible) this.hide();
		else this.show();
	}

	/**
	 * Update 3D preview with the main canvas as the color source.
	 * Uses the screen canvas directly — works across GL contexts.
	 */
	updateFromCanvas(mainCanvas) {
		if (!this.visible || !mainCanvas) return;

		if (!this._colorTex) {
			this._colorTex = new THREE.CanvasTexture(mainCanvas);
		} else {
			this._colorTex.image = mainCanvas;
		}
		this._colorTex.needsUpdate = true;
		this.material.map = this._colorTex;

		// PBR maps need pixel copy from render targets
		if (this.pbrGenerator && this.pbrGenerator.enabled) {
			this._applyPBR();
		} else {
			this.material.normalMap = null;
			this.material.roughnessMap = null;
			this.material.aoMap = null;
			this.material.metalnessMap = null;
		}

		this.material.needsUpdate = true;
	}

	_applyPBR() {
		// PBR maps are render target textures from the main renderer.
		// Read pixels → canvas → CanvasTexture to bridge GL contexts.
		const maps = this.pbrGenerator.getMapTextures();
		const mainRenderer = this.pbrGenerator.renderer;
		if (!mainRenderer) return;

		this._copyRT(maps.normal, this.pbrGenerator.normalRT, mainRenderer, "_pbrNormalTex", tex => {
			this.material.normalMap = tex;
			this.material.normalScale.set(1, 1);
		});
		this._copyRT(maps.roughness, this.pbrGenerator.roughnessRT, mainRenderer, "_pbrRoughTex", tex => {
			this.material.roughnessMap = tex;
		});
		this._copyRT(maps.ao, this.pbrGenerator.aoRT, mainRenderer, "_pbrAoTex", tex => {
			this.material.aoMap = tex;
		});
		this._copyRT(maps.metallic, this.pbrGenerator.metallicRT, mainRenderer, "_pbrMetalTex", tex => {
			this.material.metalnessMap = tex;
		});
	}

	_copyRT(texture, rt, mainRenderer, cacheKey, applyFn) {
		if (!texture || !rt) return;

		const w = rt.width, h = rt.height;
		if (!this._copyCanvas) this._copyCanvas = document.createElement("canvas");
		this._copyCanvas.width = w;
		this._copyCanvas.height = h;

		const buf = new Uint8Array(w * h * 4);
		mainRenderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);

		const ctx = this._copyCanvas.getContext("2d", { willReadFrequently: true });
		const imgData = ctx.createImageData(w, h);
		for (let y = 0; y < h; y++) {
			const srcRow = (h - 1 - y) * w * 4;
			const dstRow = y * w * 4;
			imgData.data.set(buf.subarray(srcRow, srcRow + w * 4), dstRow);
		}
		ctx.putImageData(imgData, 0, 0);

		if (!this[cacheKey]) {
			this[cacheKey] = new THREE.CanvasTexture(this._copyCanvas);
		} else {
			this[cacheKey].image = this._copyCanvas;
		}
		this[cacheKey].needsUpdate = true;
		applyFn(this[cacheKey]);
	}

	setStatus({ gradientEnabled, gradientIntensity, colorBalanceActive }) {
		if (!this.statusEl) return;
		const gradActive = !!gradientEnabled && (gradientIntensity ?? 1) > 0.001;
		const gradText = gradActive ? `Gradient: On (${(gradientIntensity ?? 1).toFixed(2)})` : "Gradient: Off";
		const balanceText = colorBalanceActive ? "Balance: On" : "Balance: Off";
		const sourceText = gradActive ? "Color: Gradient" : "Color: Base";
		this.statusEl.textContent = `${sourceText} • ${gradText} • ${balanceText}`;
	}

	render() {
		if (!this.visible) return;

		if (this.autoRotate && this.mesh) {
			this.mesh.rotation.y += 0.005;
		}

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}

	_updateMesh() {
		if (this.mesh) {
			this.scene.remove(this.mesh);
			this.mesh.geometry.dispose();
		}

		let geometry;
		switch (this.meshType) {
			case "Sphere":
				geometry = new THREE.SphereGeometry(1, 64, 64);
				break;
			case "Cube":
				geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 4, 4, 4);
				break;
			case "Cylinder":
				geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 64);
				break;
			case "Plane":
				geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
				break;
		}

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.scene.add(this.mesh);
	}

	dispose() {
		if (this.renderer) this.renderer.dispose();
		if (this.material) this.material.dispose();
		if (this.mesh) this.mesh.geometry.dispose();
		if (this._colorTex) this._colorTex.dispose();
	}
}
