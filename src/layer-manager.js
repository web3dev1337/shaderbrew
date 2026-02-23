/**
 * LayerManager: manages multiple effect layers, each with its own pipeline and parameters.
 */
import * as THREE from "three";
import { getDefaultEffectController, getDefaultEffectParameters } from "./defaults.js";
import { RenderPipeline } from "./render-pipeline.js";
import { BLEND_MODES } from "./shaders/blend.js";
import { isCustomEffect, getCustomShaderKey } from "./custom-shader-registry.js";
import { SHADERS } from "../shader-defs.js";

let layerIdCounter = 0;

export class LayerManager {
	constructor(renderer) {
		this.renderer = renderer;
		this.layers = [];
		this.activeLayerIndex = 0;
	}

	addLayer(width, height, effectType = "Wood") {
		const id = ++layerIdCounter;
		const ec = Object.assign(
			getDefaultEffectController(),
			getDefaultEffectParameters(),
			{ type: effectType }
		);
		const pipeline = new RenderPipeline(this.renderer, width, height);
		if (isCustomEffect(effectType)) {
			const key = getCustomShaderKey(effectType);
			const src = key && SHADERS[key];
			if (src) pipeline.buildCustomPass(src);
			else pipeline.buildPasses("Wood");
		} else {
			pipeline.buildPasses(effectType);
		}

		const layer = {
			id,
			name: effectType + " " + id,
			effectController: ec,
			pipeline,
			opacity: 1.0,
			blendMode: "Normal",
			visible: true,
			renderTarget: new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				stencilBuffer: false
			})
		};

		this.layers.push(layer);
		this.activeLayerIndex = this.layers.length - 1;
		return layer;
	}

	removeLayer(index) {
		if (this.layers.length <= 1) return;
		const layer = this.layers[index];
		layer.pipeline.disposePasses();
		layer.renderTarget.dispose();
		this.layers.splice(index, 1);
		if (this.activeLayerIndex >= this.layers.length) {
			this.activeLayerIndex = this.layers.length - 1;
		}
	}

	moveLayer(fromIndex, toIndex) {
		if (fromIndex === toIndex) return;
		if (toIndex < 0 || toIndex >= this.layers.length) return;
		const [layer] = this.layers.splice(fromIndex, 1);
		this.layers.splice(toIndex, 0, layer);
		if (this.activeLayerIndex === fromIndex) {
			this.activeLayerIndex = toIndex;
		}
	}

	duplicateLayer(index) {
		const source = this.layers[index];
		const layer = this.addLayer(
			source.renderTarget.width,
			source.renderTarget.height,
			source.effectController.type
		);
		Object.assign(layer.effectController, JSON.parse(JSON.stringify(source.effectController)));
		layer.opacity = source.opacity;
		layer.blendMode = source.blendMode;
		layer.name = source.name + " copy";
		return layer;
	}

	getActiveLayer() {
		return this.layers[this.activeLayerIndex] || null;
	}

	setActiveLayer(index) {
		this.activeLayerIndex = Math.max(0, Math.min(index, this.layers.length - 1));
	}

	/**
	 * Render all layers to their individual render targets.
	 * Returns array of { texture, opacity, blendMode, visible } for the compositor.
	 */
	renderAll(mouse, camera, grungeTexture) {
		const results = [];
		for (const layer of this.layers) {
			if (!layer.visible) {
				results.push({ texture: null, opacity: 0, blendMode: layer.blendMode, visible: false });
				continue;
			}
			layer.pipeline.render(layer.effectController, mouse, camera, grungeTexture, layer.renderTarget);
			results.push({
				texture: layer.renderTarget.texture,
				opacity: layer.opacity,
				blendMode: layer.blendMode,
				visible: true
			});
		}
		return results;
	}

	resize(width, height) {
		for (const layer of this.layers) {
			layer.pipeline.resize(width, height);
			layer.renderTarget.dispose();
			layer.renderTarget = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				stencilBuffer: false
			});
		}
	}

	/**
	 * Serialize all layers to JSON (for save/load).
	 */
	toJSON() {
		return this.layers.map(l => ({
			name: l.name,
			effectController: { ...l.effectController },
			opacity: l.opacity,
			blendMode: l.blendMode,
			visible: l.visible
		}));
	}

	/**
	 * Load layers from JSON. Creates new pipelines.
	 */
	fromJSON(data, width, height) {
		this.disposeAll();
		for (const item of data) {
			const layer = this.addLayer(width, height, item.effectController.type);
			Object.assign(layer.effectController, item.effectController);
			layer.name = item.name;
			layer.opacity = item.opacity;
			layer.blendMode = item.blendMode;
			layer.visible = item.visible;
		}
		this.activeLayerIndex = 0;
	}

	disposeAll() {
		for (const layer of this.layers) {
			layer.pipeline.disposePasses();
			layer.renderTarget.dispose();
		}
		this.layers = [];
		this.activeLayerIndex = 0;
	}
}
