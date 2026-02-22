/**
 * 3D material preview.
 * Renders a sphere/cube/plane with generated PBR maps applied via MeshStandardMaterial.
 * Uses a separate renderer and scene to avoid interfering with the main effect pipeline.
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
	}

	build() {
		// Container
		this.container = document.createElement("div");
		this.container.id = "preview-3d";
		this.container.style.cssText = `
			position: fixed; top: 36px; right: 300px; width: 300px; height: 300px;
			background: #111; border: 1px solid #333; border-radius: 0 0 0 6px;
			z-index: 9996; display: none; overflow: hidden;
		`;

		// Toolbar
		const toolbar = document.createElement("div");
		toolbar.style.cssText = "position:absolute;top:0;left:0;right:0;height:28px;background:rgba(10,10,20,0.9);display:flex;align-items:center;gap:4px;padding:0 6px;z-index:1;border-bottom:1px solid #333";

		const title = document.createElement("span");
		title.textContent = "3D Preview";
		title.style.cssText = "color:#e0e0ff;font-family:monospace;font-size:11px;margin-right:auto";
		toolbar.appendChild(title);

		// Mesh type selector
		const meshSelect = document.createElement("select");
		meshSelect.style.cssText = "background:#222;color:#ccc;border:1px solid #444;border-radius:3px;font-size:10px;padding:1px 4px;font-family:monospace";
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

		// Auto-rotate toggle
		const rotLabel = document.createElement("label");
		rotLabel.style.cssText = "display:flex;align-items:center;gap:2px;color:#888;font-family:monospace;font-size:10px;cursor:pointer";
		const rotCb = document.createElement("input");
		rotCb.type = "checkbox";
		rotCb.checked = this.autoRotate;
		rotCb.addEventListener("change", () => { this.autoRotate = rotCb.checked; });
		rotLabel.appendChild(rotCb);
		rotLabel.appendChild(document.createTextNode("Spin"));
		toolbar.appendChild(rotLabel);

		// Close button
		const closeBtn = document.createElement("button");
		closeBtn.textContent = "x";
		closeBtn.style.cssText = "width:18px;height:18px;border:1px solid #444;border-radius:3px;background:#1a1a2e;color:#ccc;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;font-family:monospace";
		closeBtn.addEventListener("click", () => this.hide());
		toolbar.appendChild(closeBtn);

		this.container.appendChild(toolbar);

		// Status bar
		this.statusEl = document.createElement("div");
		this.statusEl.style.cssText = `
			position:absolute;left:0;right:0;bottom:0;height:18px;
			background:rgba(10,10,20,0.85);border-top:1px solid #222;
			display:flex;align-items:center;justify-content:center;
			font-family:monospace;font-size:10px;color:#666;letter-spacing:0.3px;
			pointer-events:none;z-index:1;
		`;
		this.statusEl.textContent = "Color: Base • Gradient: Off • Balance: Off";
		this.container.appendChild(this.statusEl);

		// WebGL renderer for 3D preview
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setSize(300, 272);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.2;
		this.renderer.domElement.style.cssText = "position:absolute;top:28px;left:0";
		this.container.appendChild(this.renderer.domElement);

		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x111111);

		// Camera
		this.camera = new THREE.PerspectiveCamera(45, 300 / 272, 0.1, 100);
		this.camera.position.set(0, 0, 3);

		// Controls
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		// Lighting
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

		// Material
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

	updateMaps(colorTexture) {
		if (!this.visible) return;

		// Apply color map
		this.material.map = colorTexture;
		this.material.map.needsUpdate = true;

		// Apply PBR maps if available
		if (this.pbrGenerator.enabled) {
			const maps = this.pbrGenerator.getMapTextures();
			this.material.normalMap = maps.normal;
			this.material.normalScale.set(1, 1);
			this.material.roughnessMap = maps.roughness;
			this.material.aoMap = maps.ao;
			this.material.metalnessMap = maps.metallic;
		} else {
			this.material.normalMap = null;
			this.material.roughnessMap = null;
			this.material.aoMap = null;
			this.material.metalnessMap = null;
		}

		this.material.needsUpdate = true;
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
	}
}
