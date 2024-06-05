import * as THREE from "three";
//@ts-ignore
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";

import * as utils from "./common/utils";
import * as satellite from "satellite.js";
import Gaia from "./assets/Gaia.png";
import Earth from "./assets/earth-blue-marble.jpg";
import { EARTH_RADIUS_KM, SAT_SIZE, TIME_STEP } from "./common/constants";


export const loadTexture = async (url: string): Promise<THREE.Texture> => {
    let textureLoader = new THREE.TextureLoader();
    return new Promise((resolve) => {
        textureLoader.load(url, (texture) => {
            resolve(texture);
        });
    });
};

export default class EarthWithSatellites {
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;

    private controls!: OrbitControls;
    private stats!: any;

    private globe!: ThreeGlobe;
    private currentTime: Date = new Date();

    private currentData: utils.SatInformation[] = [];

    constructor() {
        this.initScene();
        this.initStats();
        this.initListeners();
    }

    initStats() {
        this.stats = new (Stats as any)();
        document.body.appendChild(this.stats.dom);
    }

    initialParseSatData(data: string) {
        this.currentData = utils.parseTLEListToSat(data);
    }

    propagateAllSatData(time: Date) {
        const gmst = satellite.gstime(time);
        const currentPositions = this.currentData.map((d) => utils.propagate1Sat(d, time, gmst));
        this.globe.objectsData(currentPositions);
    }

    async initScene() {
        // Fetch satellite data from NORAD
        const rawData = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle").then((res) =>
            res.text()
        );
        this.initialParseSatData(rawData);

        this.scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        camera.position.z = 400;
        this.camera = camera;

        // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Add lights
        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
        this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));

        // Add the Earth
        this.globe = new ThreeGlobe()
            .globeImageUrl(Earth)
            .objectLat("lat")
            .objectLng("lng")
            .objectAltitude("alt")
            .objectFacesSurface(false);

        const satGeometry = new THREE.OctahedronGeometry((SAT_SIZE * this.globe.getGlobeRadius()) / EARTH_RADIUS_KM / 2, 0);
        const satMaterial = new THREE.MeshLambertMaterial({ color: "palegreen", transparent: true, opacity: 0.7 });
        this.globe.objectThreeObject(() => new THREE.Mesh(satGeometry, satMaterial));
        this.scene.add(this.globe);


        // Add background
        const envMap = await loadTexture(Gaia);
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = envMap;

        // Add satellite
        this.propagateAllSatData(this.currentTime);

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

        this.currentTime = new Date(+this.currentTime + TIME_STEP);
        this.propagateAllSatData(this.currentTime);

        if (this.stats) this.stats.update();
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
