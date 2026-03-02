/**
 * Generates tiny preview thumbnails for effect types.
 * Uses a single shared mini-pipeline to render each effect at low res,
 * then caches the result as a data URL. Renders in batches to avoid freezing.
 */
import * as THREE from "three";
import { FxgenShader, FxgenShaderUtils } from "../pixy-api.js";
import { getDefaultEffectController, getDefaultEffectParameters } from "../defaults.js";
import { isCustomEffect, getCustomShaderKey } from "../custom-shader-registry.js";
import { SHADERS } from "../../shader-defs.js";

const THUMB_SIZE = 48;
const BATCH_SIZE = 4;
const cache = new Map(); // effectType → dataURL

let renderer = null;
let scene = null;
let camera = null;
let rt = null;
let quad = null;
let readBuf = null;
let thumbCanvas = null;
let thumbCtx = null;

function ensureSetup(sourceRenderer) {
	if (renderer) return;
	renderer = sourceRenderer;
	scene = new THREE.Scene();
	camera = new THREE.Camera();
	quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial());
	scene.add(quad);
	rt = new THREE.WebGLRenderTarget(THUMB_SIZE, THUMB_SIZE, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		stencilBuffer: false
	});
	readBuf = new Uint8Array(THUMB_SIZE * THUMB_SIZE * 4);
	thumbCanvas = document.createElement("canvas");
	thumbCanvas.width = THUMB_SIZE;
	thumbCanvas.height = THUMB_SIZE;
	thumbCtx = thumbCanvas.getContext("2d");
}

function renderOne(effectType) {
	if (cache.has(effectType)) return cache.get(effectType);

	const prevRT = renderer.getRenderTarget();
	try {
		if (isCustomEffect(effectType)) {
			const key = getCustomShaderKey(effectType);
			const src = key && SHADERS[key];
			if (!src) { renderer.setRenderTarget(prevRT); return null; }
			const mat = new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 1.5 },
					resolution: { value: new THREE.Vector2(THUMB_SIZE, THUMB_SIZE) },
					mouse: { value: new THREE.Vector2(0.5, 0.5) },
				},
				vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
				fragmentShader: src,
				depthTest: false, depthWrite: false,
			});
			quad.material = mat;
			renderer.setRenderTarget(rt);
			renderer.render(scene, camera);
			renderer.setRenderTarget(prevRT);
			mat.dispose();
		} else {
			const shader = new FxgenShader();
			shader.enable(effectType.toUpperCase());
			shader.enable("TOON");
			shader.enable("GLSL3");
			const uniforms = shader.generateUniforms();
			const mat = shader.createMaterial(uniforms);
			mat.defines = shader.generateDefines();

			const ec = Object.assign(getDefaultEffectController(), getDefaultEffectParameters());
			ec.type = effectType;
			ec.time = 1.5;

			for (const key in ec) {
				if (uniforms[key] !== undefined) {
					FxgenShaderUtils.SetShaderParameter(uniforms, key, ec[key]);
				}
			}
			FxgenShaderUtils.SetShaderParameter(uniforms, "resolution", new THREE.Vector2(THUMB_SIZE, THUMB_SIZE));
			if (uniforms.time) uniforms.time.value = 1.5;

			quad.material = mat;
			renderer.setRenderTarget(rt);
			renderer.render(scene, camera);
			renderer.setRenderTarget(prevRT);
			mat.dispose();
		}

		// Read pixels and draw to canvas
		renderer.readRenderTargetPixels(rt, 0, 0, THUMB_SIZE, THUMB_SIZE, readBuf);
		const imgData = thumbCtx.createImageData(THUMB_SIZE, THUMB_SIZE);
		// WebGL reads bottom-up, flip vertically
		for (let y = 0; y < THUMB_SIZE; y++) {
			const srcRow = (THUMB_SIZE - 1 - y) * THUMB_SIZE * 4;
			const dstRow = y * THUMB_SIZE * 4;
			for (let x = 0; x < THUMB_SIZE * 4; x++) {
				imgData.data[dstRow + x] = readBuf[srcRow + x];
			}
		}
		thumbCtx.putImageData(imgData, 0, 0);
		const url = thumbCanvas.toDataURL("image/jpeg", 0.7);
		cache.set(effectType, url);
		return url;
	} catch (e) {
		renderer.setRenderTarget(prevRT);
		cache.set(effectType, null);
		return null;
	}
}

/**
 * Generate thumbnails for a list of effect types in batches.
 * Calls onThumb(effectType, dataURL) for each completed thumbnail.
 * Returns a cancel function.
 */
export function generateThumbnails(sourceRenderer, effectTypes, onThumb) {
	ensureSetup(sourceRenderer);
	let idx = 0;
	let cancelled = false;

	function processBatch() {
		if (cancelled || idx >= effectTypes.length) return;
		const end = Math.min(idx + BATCH_SIZE, effectTypes.length);
		for (let i = idx; i < end; i++) {
			const fx = effectTypes[i];
			if (cache.has(fx)) {
				onThumb(fx, cache.get(fx));
			} else {
				const url = renderOne(fx);
				onThumb(fx, url);
			}
		}
		idx = end;
		if (idx < effectTypes.length) {
			requestAnimationFrame(processBatch);
		}
	}

	requestAnimationFrame(processBatch);
	return () => { cancelled = true; };
}

export function getCachedThumbnail(effectType) {
	return cache.get(effectType) || null;
}
