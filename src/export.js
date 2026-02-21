/**
 * Enhanced export system.
 * Supports PNG/JPEG with quality control, resolution up to 4096,
 * and ZIP bundle of all PBR maps + preset JSON via JSZip (CDN loaded).
 */
import * as THREE from "three";

export class ExportManager {
	constructor(app) {
		this.app = app;
		this.jszip = null;
	}

	/**
	 * Export a single map as PNG download.
	 */
	exportPNG(name, texture) {
		const canvas = this._textureToCanvas(texture);
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = `${name}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	}

	/**
	 * Export a single map as JPEG download with quality control.
	 */
	exportJPEG(name, texture, quality = 0.92) {
		const canvas = this._textureToCanvas(texture);
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = `${name}.jpg`;
		link.href = canvas.toDataURL("image/jpeg", quality);
		link.click();
	}

	/**
	 * Export all PBR maps + color + preset as ZIP bundle.
	 */
	async exportZIP() {
		const JSZip = await this._loadJSZip();
		if (!JSZip) {
			console.error("[export] Failed to load JSZip");
			return;
		}

		const zip = new JSZip();
		const renderer = this.app.renderer;
		const pipeline = this.app.pipeline;
		const pbr = this.app.pbrGenerator;
		const effectType = this.app.effectController.type;

		// Color map
		const colorRT = pipeline.layers[pipeline.layers.length - 2]?.renderTarget;
		if (colorRT) {
			const colorPNG = this._rtToPNGBlob(renderer, colorRT);
			if (colorPNG) zip.file(`${effectType}_color.png`, colorPNG);
		}

		// PBR maps (if enabled)
		if (pbr.enabled) {
			const maps = { normal: pbr.normalRT, roughness: pbr.roughnessRT, ao: pbr.aoRT, metallic: pbr.metallicRT };
			for (const [name, rt] of Object.entries(maps)) {
				const blob = this._rtToPNGBlob(renderer, rt);
				if (blob) zip.file(`${effectType}_${name}.png`, blob);
			}
		}

		// Preset JSON
		const preset = { ...this.app.effectController };
		zip.file(`${effectType}_preset.json`, JSON.stringify(preset, null, "\t"));

		// Generate and download
		const content = await zip.generateAsync({ type: "blob" });
		const link = document.createElement("a");
		link.download = `${effectType}_textures.zip`;
		link.href = URL.createObjectURL(content);
		link.click();
		URL.revokeObjectURL(link.href);
	}

	/**
	 * Export at a specific resolution (temporarily resizes, exports, then restores).
	 */
	exportAtResolution(resolution, format = "png", quality = 0.92) {
		const origW = this.app.canvas.width;
		const origH = this.app.canvas.height;

		// Resize to target
		this.app.canvas.width = resolution;
		this.app.canvas.height = resolution;
		this.app._onResize();
		this.app.render();

		// Export
		const name = `${this.app.effectController.type}_${resolution}`;
		const colorRT = this.app.pipeline.layers[this.app.pipeline.layers.length - 2]?.renderTarget;
		if (colorRT) {
			if (format === "jpeg") {
				this.exportJPEG(name, colorRT.texture, quality);
			} else {
				this.exportPNG(name, colorRT.texture);
			}
		}

		// Restore
		this.app.canvas.width = origW;
		this.app.canvas.height = origH;
		this.app._onResize();
	}

	_textureToCanvas(texture) {
		if (!texture) return null;
		const renderer = this.app.renderer;

		// Find the RT that owns this texture
		const rt = this._findRT(texture);
		if (!rt) return null;

		const w = rt.width;
		const h = rt.height;
		const pixels = new Uint8Array(w * h * 4);
		renderer.readRenderTargetPixels(rt, 0, 0, w, h, pixels);

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		const imgData = ctx.createImageData(w, h);

		// Flip Y
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const srcIdx = ((h - 1 - y) * w + x) * 4;
				const dstIdx = (y * w + x) * 4;
				imgData.data[dstIdx] = pixels[srcIdx];
				imgData.data[dstIdx + 1] = pixels[srcIdx + 1];
				imgData.data[dstIdx + 2] = pixels[srcIdx + 2];
				imgData.data[dstIdx + 3] = pixels[srcIdx + 3] || 255;
			}
		}

		ctx.putImageData(imgData, 0, 0);
		return canvas;
	}

	_findRT(texture) {
		const pipeline = this.app.pipeline;
		for (const pass of pipeline.layers) {
			if (pass.renderTarget && pass.renderTarget.texture === texture) return pass.renderTarget;
		}
		const pbr = this.app.pbrGenerator;
		for (const name of ["normalRT", "roughnessRT", "aoRT", "metallicRT"]) {
			if (pbr[name] && pbr[name].texture === texture) return pbr[name];
		}
		return null;
	}

	_rtToPNGBlob(renderer, rt) {
		const w = rt.width;
		const h = rt.height;
		const pixels = new Uint8Array(w * h * 4);
		renderer.readRenderTargetPixels(rt, 0, 0, w, h, pixels);

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		const imgData = ctx.createImageData(w, h);

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const srcIdx = ((h - 1 - y) * w + x) * 4;
				const dstIdx = (y * w + x) * 4;
				imgData.data[dstIdx] = pixels[srcIdx];
				imgData.data[dstIdx + 1] = pixels[srcIdx + 1];
				imgData.data[dstIdx + 2] = pixels[srcIdx + 2];
				imgData.data[dstIdx + 3] = pixels[srcIdx + 3] || 255;
			}
		}
		ctx.putImageData(imgData, 0, 0);

		// Convert to blob synchronously via data URL
		const dataUrl = canvas.toDataURL("image/png");
		const binary = atob(dataUrl.split(",")[1]);
		const array = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
		return array;
	}

	async _loadJSZip() {
		if (this.jszip) return this.jszip;
		try {
			const module = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");
			this.jszip = window.JSZip || module.default;
			return this.jszip;
		} catch (e) {
			// Fallback: load via script tag
			return new Promise((resolve, reject) => {
				if (window.JSZip) { this.jszip = window.JSZip; resolve(this.jszip); return; }
				const script = document.createElement("script");
				script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
				script.onload = () => { this.jszip = window.JSZip; resolve(this.jszip); };
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}
	}
}
