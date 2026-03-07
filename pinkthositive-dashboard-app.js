import * as THREE from "three";
import { PINKTHOSITIVE_DASHBOARD_SHADERS } from "./pinkthositive-dashboard-shaders.js";

const FULLSCREEN_VERT = `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=vec4(position.xy,0.0,1.0);
}
`;

class ShaderCard {
  constructor(card, shaderDef) {
    this.card = card;
    this.canvas = card.querySelector("canvas");
    this.shaderDef = shaderDef;
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

function makePromptList(lines) {
  return lines.map(line => `<li>${line}</li>`).join("");
}

function buildCard(shaderDef) {
  const article = document.createElement("article");
  article.className = "artifact-card";
  article.innerHTML = `
    <div class="card-head">
      <div>
        <p class="card-kicker">${shaderDef.category}</p>
        <h2>${shaderDef.title}</h2>
      </div>
      <span class="artifact-badge">${shaderDef.artifactType}</span>
    </div>
    <div class="viewport">
      <canvas></canvas>
      <span class="status">Live GLSL</span>
    </div>
    <div class="card-body">
      <p class="description">${shaderDef.description}</p>
      <div class="fact-grid">
        <div class="fact">
          <span>Target</span>
          <strong>${shaderDef.targetUse}</strong>
        </div>
        <div class="fact">
          <span>Export Path</span>
          <strong>${shaderDef.exportPath}</strong>
        </div>
      </div>
      <div class="prompt-block">
        <p>Prompt Vector</p>
        <ul>${makePromptList(shaderDef.metaPrompt)}</ul>
      </div>
    </div>
  `;
  return article;
}

function renderDashboard() {
  const grid = document.getElementById("dashboard-grid");
  const cardElements = PINKTHOSITIVE_DASHBOARD_SHADERS.map(shaderDef => {
    const el = buildCard(shaderDef);
    grid.appendChild(el);
    return new ShaderCard(el, shaderDef);
  });

  const counts = {
    constructs: PINKTHOSITIVE_DASHBOARD_SHADERS.length,
    live: PINKTHOSITIVE_DASHBOARD_SHADERS.filter(item => item.artifactType === "Hero Render").length
  };
  document.querySelector("[data-stat='constructs']").textContent = String(counts.constructs);
  document.querySelector("[data-stat='live']").textContent = String(counts.live);

  const resize = () => {
    for (const card of cardElements) {
      card.resize();
    }
  };

  window.addEventListener("resize", resize);
  resize();

  const start = performance.now();
  const frame = now => {
    const t = (now - start) * 0.001;
    for (const card of cardElements) {
      card.render(t);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

renderDashboard();
