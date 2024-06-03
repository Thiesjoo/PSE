import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import Albedo from "./assets/Albedo.jpg";

export const loadTexture = async (url: string): Promise<THREE.Texture> => {
    let textureLoader = new THREE.TextureLoader();
    return new Promise((resolve) => {
        textureLoader.load(url, (texture) => {
            resolve(texture);
        });
    });
};

export default class Demo {
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;

    private dirLight!: THREE.DirectionalLight;

    private controls!: OrbitControls;
    private stats!: any;

    private group!: THREE.Group;
    private earth!: THREE.Mesh;

    constructor() {
        this.initScene();
        this.initStats();
        this.initListeners();
    }

    initStats() {
        this.stats = new (Stats as any)();
        document.body.appendChild(this.stats.dom);
    }

    async initScene() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        this.dirLight.position.set(-50, 0, 30);
        this.scene.add(this.dirLight);

        this.group = new THREE.Group();
        // earth's axial tilt is 23.5 degrees
        this.group.rotation.z = (23.5 / 360) * 2 * Math.PI;

        const albedoMap = await loadTexture(Albedo);
        albedoMap.colorSpace = THREE.SRGBColorSpace;

        let earthGeo = new THREE.SphereGeometry(10, 64, 64);
        let earthMat = new THREE.MeshStandardMaterial({
            map: albedoMap,
        });
        this.earth = new THREE.Mesh(earthGeo, earthMat);
        this.group.add(this.earth);

        // set initial rotational position of earth to get a good initial angle
        this.earth.rotateY(-0.3);

        this.scene.add(this.group);

        // Init animation
        this.animate();
    }

    initListeners() {
        window.addEventListener("resize", this.onWindowResize.bind(this), false);

        window.addEventListener("keydown", (event) => {
            const { key } = event;

            switch (key) {
                case "e":
                    const win = window.open("", "Canvas Image");

                    const { domElement } = this.renderer;

                    // Makse sure scene is rendered.
                    this.renderer.render(this.scene, this.camera);

                    const src = domElement.toDataURL();

                    if (!win) return;

                    win.document.write(`<img src='${src}' width='${domElement.width}' height='${domElement.height}'>`);
                    break;

                default:
                    break;
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => {
            this.animate();
        });

        this.earth.rotateY(0.001);

        if (this.stats) this.stats.update();

        if (this.controls) this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
