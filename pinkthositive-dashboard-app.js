import * as THREE from "three";
import { PINKTHOSITIVE_DASHBOARD_SHADERS } from "./pinkthositive-dashboard-shaders.js";
import { MATERIAL_VERT, PINKTHOSITIVE_USABLE_MATERIALS } from "./pinkthositive-usable-materials.js";

const FULLSCREEN_VERT = `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=vec4(position.xy,0.0,1.0);
}
`;

class FullscreenShaderCard {
  constructor(card, shaderDef) {
    this.card = card;
    this.canvas = card.querySelector("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) }
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: shaderDef.shader,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false);
    const drawSize = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(drawSize);
    this.uniforms.resolution.value.copy(drawSize);
  }

  render(t) {
    this.uniforms.time.value = t;
    this.renderer.render(this.scene, this.camera);
  }
}

function makeGeometry(type) {
  switch (type) {
    case "box":
      return new THREE.BoxGeometry(1.8, 1.8, 1.8, 24, 24, 24);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1.28, 4);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.34, 2);
    case "torusknot":
      return new THREE.TorusKnotGeometry(0.88, 0.28, 220, 32, 2, 5);
    case "sphere":
    default:
      return new THREE.SphereGeometry(1.28, 120, 72);
  }
}

class MaterialShaderCard {
  constructor(card, materialDef) {
    this.card = card;
    this.canvas = card.querySelector("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040811);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(0, 0.34, 4.3);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.uniforms = {
      uTime: { value: 0 },
      uLightDir: { value: new THREE.Vector3(-0.62, 0.74, 0.48) }
    };

    this.mesh = new THREE.Mesh(
      makeGeometry(materialDef.geometry),
      new THREE.ShaderMaterial({
        vertexShader: MATERIAL_VERT,
        fragmentShader: materialDef.fragmentShader,
        uniforms: this.uniforms
      })
    );
    this.group.add(this.mesh);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.58, 1.8, 0.28, 54),
      new THREE.MeshStandardMaterial({
        color: 0x0d131f,
        roughness: 0.82,
        metalness: 0.16
      })
    );
    base.position.set(0, -1.72, 0);
    this.group.add(base);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.62, 0.05, 14, 80),
      new THREE.MeshBasicMaterial({
        color: 0x5fa9d8,
        transparent: true,
        opacity: 0.38
      })
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(0, -1.5, 0);
    this.group.add(ring);

    const hemi = new THREE.HemisphereLight(0x6f96ba, 0x020306, 0.78);
    this.scene.add(hemi);
    const back = new THREE.PointLight(0x2f6fa4, 0.55, 10);
    back.position.set(-1.8, 1.4, -2.2);
    this.scene.add(back);

    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  render(t) {
    this.uniforms.uTime.value = t;
    this.mesh.rotation.y = t * 0.42;
    this.mesh.rotation.x = Math.sin(t * 0.36) * 0.16;
    this.group.rotation.y = Math.sin(t * 0.2) * 0.08;
    this.renderer.render(this.scene, this.camera);
  }
}

function makePromptList(lines) {
  return lines.map(line => `<li>${line}</li>`).join("");
}

function buildCard(def, statusLabel, extraFactLabel) {
  const article = document.createElement("article");
  article.className = "artifact-card";
  article.innerHTML = `
    <div class="card-head">
      <div>
        <p class="card-kicker">${def.category}</p>
        <h2>${def.title}</h2>
      </div>
      <span class="artifact-badge">${def.artifactType}</span>
    </div>
    <div class="viewport">
      <canvas></canvas>
      <span class="status">${statusLabel}</span>
    </div>
    <div class="card-body">
      <p class="description">${def.description}</p>
      <div class="fact-grid">
        <div class="fact">
          <span>Target</span>
          <strong>${def.targetUse}</strong>
        </div>
        <div class="fact">
          <span>Export Path</span>
          <strong>${def.exportPath}</strong>
        </div>
        <div class="fact fact-wide">
          <span>${extraFactLabel}</span>
          <strong>${def.geometry ? def.geometry : def.artifactType}</strong>
        </div>
      </div>
      <div class="prompt-block">
        <p>Prompt Vector</p>
        <ul>${makePromptList(def.metaPrompt)}</ul>
      </div>
    </div>
  `;
  return article;
}

function mountSection({ defs, gridId, statusLabel, factory, extraFactLabel }) {
  const grid = document.getElementById(gridId);
  return defs.map(def => {
    const el = buildCard(def, statusLabel, extraFactLabel);
    grid.appendChild(el);
    return factory(el, def);
  });
}

function renderDashboard() {
  const heroCards = mountSection({
    defs: PINKTHOSITIVE_DASHBOARD_SHADERS,
    gridId: "dashboard-grid",
    statusLabel: "Live GLSL",
    factory: (el, def) => new FullscreenShaderCard(el, def),
    extraFactLabel: "Artifact"
  });

  const materialCards = mountSection({
    defs: PINKTHOSITIVE_USABLE_MATERIALS,
    gridId: "usable-grid",
    statusLabel: "Live Material",
    factory: (el, def) => new MaterialShaderCard(el, def),
    extraFactLabel: "Preview Mesh"
  });

  const counts = {
    constructs: PINKTHOSITIVE_DASHBOARD_SHADERS.length + PINKTHOSITIVE_USABLE_MATERIALS.length,
    live: PINKTHOSITIVE_DASHBOARD_SHADERS.length,
    usable: PINKTHOSITIVE_USABLE_MATERIALS.length
  };

  document.querySelector("[data-stat='constructs']").textContent = String(counts.constructs);
  document.querySelector("[data-stat='live']").textContent = String(counts.live);
  document.querySelector("[data-stat='usable']").textContent = String(counts.usable);

  const allCards = [...heroCards, ...materialCards];
  const resize = () => {
    for (const card of allCards) {
      card.resize();
    }
  };

  window.addEventListener("resize", resize);
  resize();

  const start = performance.now();
  const frame = now => {
    const t = (now - start) * 0.001;
    for (const card of allCards) {
      card.render(t);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

renderDashboard();
