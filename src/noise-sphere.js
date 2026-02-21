/**
 * 3D noise sphere with displacement mapping.
 * Renders when cNoiseSphereEnable is true.
 */
import * as THREE from "three";
import { FxgenShader } from "./pixy-api.js";

export class NoiseSphere {
	constructor() {
		this.scene = new THREE.Scene();
		const shader = new FxgenShader();
		shader.enable("DISPLACEMENT");
		this.uniforms = shader.generateUniforms();
		this.material = shader.createStandardMaterial(this.uniforms);
		const geometry = new THREE.SphereGeometry(1, 1024, 1024);
		this.sphere = new THREE.Mesh(geometry, this.material);
		this.scene.add(this.sphere);
	}

	render(renderer, camera, displacementTexture) {
		this.uniforms.tDisplacement.value = displacementTexture;
		renderer.render(this.scene, camera);
	}
}
