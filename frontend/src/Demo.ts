import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";

import * as satellite from "satellite.js";
import Gaia from "./assets/Gaia.png";

const EARTH_RADIUS_KM = 6371; // km
const SAT_SIZE = 80; // km
const TIME_STEP = 3000; // ms

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

    private controls!: OrbitControls;
    private stats!: any;

    private globe!: ThreeGlobe;
    private currentTime: Date = new Date();

    private rawData = "";
    private currentData: any[] = [];

    constructor() {
        this.initScene();
        this.initStats();
        this.initListeners();
    }

    initStats() {
        this.stats = new (Stats as any)();
        document.body.appendChild(this.stats.dom);
    }

    initialParseSatData() {
        const tleData = this.rawData
            .replace(/\r/g, "")
            .split(/\n(?=[^12])/)
            .map((tle) => tle.split("\n"));
        const satData = tleData.map(([name, ...tle]) => ({
            //@ts-ignore
            satrec: satellite.twoline2satrec(...tle),
            name: name.trim().replace(/^0 /, ""),
        })) as { satrec: any; name: string; lat: number; lng: number; alt: number }[];
        this.currentData = satData;
    }

    satData(time: Date) {
        const gmst = satellite.gstime(time);
        this.currentData.forEach((d) => {
            const eci = satellite.propagate(d.satrec, time);
            if (eci.position) {
                //@ts-ignore
                const gdPos = satellite.eciToGeodetic(eci.position, gmst);
                d.lat = satellite.degreesLat(gdPos.latitude);
                d.lng = satellite.degreesLong(gdPos.longitude);
                d.alt = gdPos.height / EARTH_RADIUS_KM;
            }
        });

        this.globe.objectsData(this.currentData);
    }

    async initScene() {
        this.rawData =await  fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle").then((res) => res.text());
        this.initialParseSatData();

        this.scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera();
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        camera.position.z = 400;

        this.camera = camera;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
        this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));

        const globe = new ThreeGlobe()
            .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
            .objectLat("lat")
            .objectLng("lng")
            .objectAltitude("alt")
            .objectFacesSurface(false);

        const satGeometry = new THREE.OctahedronGeometry((SAT_SIZE * globe.getGlobeRadius()) / EARTH_RADIUS_KM / 2, 0);
        const satMaterial = new THREE.MeshLambertMaterial({ color: "palegreen", transparent: true, opacity: 0.7 });
        globe.objectThreeObject(() => new THREE.Mesh(satGeometry, satMaterial));
        this.globe = globe;

        const envMap = await loadTexture(Gaia);
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = envMap;

        // Add satellite
        this.satData(this.currentTime);
        this.scene.add(globe);

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
        this.satData(this.currentTime);

        if (this.stats) this.stats.update();
        if (this.controls) this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
