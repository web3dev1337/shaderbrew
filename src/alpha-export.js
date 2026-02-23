/**
 * Alpha channel inference and PNG export utilities.
 * Infers alpha from pixel brightness: alpha = max(R, G, B).
 */

export class AlphaExport {
	constructor() {
		this.threshold = 0;
		this.tolerance = 1;
		this.blur = 0;
		this.visible = false;
		this.needsUpdate = false;

		this.saveCanvas = document.createElement("canvas");
		this.alphaCanvas = document.createElement("canvas");
		this.blur50 = document.createElement("canvas");
		this.blur25 = document.createElement("canvas");

		this.alphaCanvas.style.display = "none";
	}

	attachToDOM(container) {
		container.appendChild(this.alphaCanvas);
	}

	updateSaveBuffer(sourceCanvas, effectType) {
		this.saveCanvas.width = sourceCanvas.width;
		this.saveCanvas.height = sourceCanvas.height;
		const ctx = this.saveCanvas.getContext("2d", { willReadFrequently: true });

		if (this.blur > 0) {
			this._applyBlur(ctx, sourceCanvas);
		} else {
			ctx.drawImage(sourceCanvas, 0, 0);
		}

		const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
		const pixels = imageData.data;
		const t = Math.round(255 * this.threshold);
		const tol = Math.round(255 * this.tolerance);

		if (!["Flame"].includes(effectType)) {
			for (let i = 0; i < pixels.length; i += 4) {
				const r = pixels[i] > tol ? 255 : pixels[i] < t ? 0 : pixels[i];
				const g = pixels[i + 1] > tol ? 255 : pixels[i + 1] < t ? 0 : pixels[i + 1];
				const b = pixels[i + 2] > tol ? 255 : pixels[i + 2] < t ? 0 : pixels[i + 2];
				pixels[i + 3] = Math.round(Math.max(r, g, b));
			}
		}

		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);
	}

	updateAlphaPreview(sourceCanvas, effectType) {
		this.updateSaveBuffer(sourceCanvas, effectType);
		this.alphaCanvas.width = sourceCanvas.width;
		this.alphaCanvas.height = sourceCanvas.height;
		const ctx = this.alphaCanvas.getContext("2d", { willReadFrequently: true });
		ctx.drawImage(this.saveCanvas, 0, 0);

		const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
		const pixels = imageData.data;
		for (let i = 0; i < pixels.length; i += 4) {
			pixels[i] = pixels[i + 1] = pixels[i + 2] = pixels[i + 3];
			pixels[i + 3] = 255;
		}
		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);
	}

	async savePng(sourceCanvas, effectType) {
		this.updateSaveBuffer(sourceCanvas, effectType);
		const blob = await new Promise(r => this.saveCanvas.toBlob(r));
		const handle = await window.showSaveFilePicker({
			types: [{ description: "Images", accept: { "image/png": [".png"] } }],
			suggestedName: "image.png"
		});
		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
	}

	downloadPng(sourceCanvas, effectType) {
		this.updateSaveBuffer(sourceCanvas, effectType);
		this.saveCanvas.toBlob(blob => {
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = "image.png";
			a.click();
		});
	}

	_applyBlur(ctx, sourceCanvas) {
		const w = sourceCanvas.width;
		const h = sourceCanvas.height;
		this.blur50.width = w * 0.5;
		this.blur50.height = h * 0.5;
		this.blur25.width = w * 0.25;
		this.blur25.height = h * 0.25;

		let big = this.blur50;
		let small = this.blur25;
		let bigCtx = big.getContext("2d");
		let smallCtx = small.getContext("2d");

		smallCtx.drawImage(sourceCanvas, 0, 0, w, h, 0, 0, small.width, small.height);
		bigCtx.drawImage(small, 0, 0, small.width, small.height, 0, 0, big.width, big.height);

		for (let i = 0; i < this.blur; i++) {
			smallCtx.drawImage(big, 0, 0, big.width, big.height, 0, 0, small.width, small.height);
			bigCtx.drawImage(small, 0, 0, small.width, small.height, 0, 0, big.width, big.height);
			[big, small, bigCtx, smallCtx] = [small, big, smallCtx, bigCtx];
		}

		ctx.drawImage(big, 0, 0, big.width, big.height, 0, 0, w, h);
	}
}
