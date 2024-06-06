import * as THREE from "three";
//@ts-ignore
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";

import * as utils from "./common/utils";
import * as satellite from "satellite.js";
import Gaia from "./assets/Gaia.png";
import Earth from "./assets/earth-blue-marble.jpg";
import {
    EARTH_RADIUS_KM,
    SAT_SIZE,
    TIME_STEP,
    SAT_COLOR,
    SAT_COLOR_HOVER,
} from "./common/constants";

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

    private raycaster = new THREE.Raycaster();
    private pointer = new THREE.Vector2();

    private text = document.getElementById("info");

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
        this.currentData = utils.parseTLEListToSat(data).slice(0, 100);
    }

    propagateAllSatData(time: Date) {
        const gmst = satellite.gstime(time);
        const currentPositions = this.currentData.map((d) =>
            utils.propagate1Sat(d, time, gmst)
        );
        this.globe.objectsData(currentPositions);
    }

    async initScene() {
        // Fetch satellite data from NORAD
        // const rawData = await fetch(
        //     "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle"
        // ).then((res) => res.text());
        const rawData = `STARLINK-1007
1 44713U 19074A   24156.82459657  .00000816  00000+0  73650-4 0  9993
2 44713  53.0529 192.5476 0001172  90.8030 269.3093 15.06396363251855
STARLINK-1008
1 44714U 19074B   24157.13517451  .00006350  00000+0  44491-3 0  9995
2 44714  53.0519 191.1521 0001241  97.6985 262.4145 15.06393120252077
STARLINK-1009
1 44715U 19074C   24156.79237041 -.00000485  00000+0 -13676-4 0  9998
2 44715  53.0545 192.6942 0001336  86.7518 273.3623 15.06397043251840
STARLINK-1010
1 44716U 19074D   24156.81079537  .00000435  00000+0  48119-4 0  9999
2 44716  53.0530 192.6103 0001258  88.5207 271.5926 15.06398836251838
STARLINK-1011
1 44717U 19074E   24157.14069345  .00002181  00000+0  16523-3 0  9996
2 44717  53.0519 211.1316 0001388  83.4011 276.7135 15.06408079251795`;
        this.initialParseSatData(rawData);

        this.scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(50, 1, 1);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        camera.position.z = 400;
        this.camera = camera;

        // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        // Add lights
        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
        this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));

        // Add the Earth
        this.globe = new ThreeGlobe()
            .globeImageUrl(Earth)
            .objectLat("lat")
            .objectLng("lng")
            .objectAltitude("alt")
            .objectFacesSurface(false)
            .atmosphereAltitude(0);
        this.globe.objectThreeObject((d) => {
            const satGeometry = new THREE.OctahedronGeometry(
                (SAT_SIZE * this.globe.getGlobeRadius()) / EARTH_RADIUS_KM / 2,
                0
            );
            const satMaterial = new THREE.MeshLambertMaterial({
                color: SAT_COLOR,
                transparent: true,
                opacity: 0.7,
            });

            const sat = new THREE.Mesh(satGeometry, satMaterial);
            // @ts-ignore
            sat.userData = { satellite: d["id"] };
            return sat;
        });
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
        window.addEventListener(
            "pointermove",
            this.onPointerMove.bind(this),
            false
        );

        window.addEventListener(
            "resize",
            this.onWindowResize.bind(this),
            false
        );

        window.addEventListener("click", this.onClick.bind(this), false);

        window.addEventListener("mouseover", this.onHoverIn.bind(this), false);
        window.addEventListener("mouseout", this.onHoverOut.bind(this), false);

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

                    win.document.write(
                        `<img src='${src}' width='${domElement.width}' height='${domElement.height}'>`
                    );
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

    onPointerMove(event: PointerEvent) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick(event: MouseEvent) {
        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (
            intersects.length > 0 &&
            "satellite" in intersects[0].object.userData
        ) {
            console.log(intersects[0].object.userData);

            // make html with class popup
            const satData = this.currentData.find(
                (d) =>
                    d.satrec.satnum === intersects[0].object.userData.satellite
            );

            if (!satData) return;

            const popup = document.getElementById("pop-up");
            if (!popup) return;

            const SatelliteName = document.getElementById("SatelliteName");
            const SatelliteID = document.getElementById("SatelliteId");
            if (!SatelliteName || !SatelliteID) return;

            popup.style.display = "block";

            SatelliteName.innerHTML = satData.name;
            SatelliteID.innerHTML = satData.satrec.satnum;
        } else {
            const popup = document.getElementById("pop-up");
            if (!popup) return;

            popup.style.display = "none";
        }
    }

    onHoverIn(event: MouseEvent) {
        // Change color of satellite on hover
        // this.scene.satMaterial.color = SAT_COLOR_HOVER;

        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (
            intersects.length > 0 &&
            "satellite" in intersects[0].object.userData
        ) {
            this.text!.innerText = "Hovering";
        } else {
            this.text!.innerText = "Kapot";
        }
    }

    onHoverOut(event: MouseEvent) {
        this.text!.innerText = "";
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

        // Update the picking ray with the camera and pointer position
        this.raycaster.setFromCamera(this.pointer, this.camera);
        // const intersects = this.raycaster.intersectObjects(this.scene.children);

        // if (
        //     intersects.length > 0 &&
        //     "satellite" in intersects[0].object.userData
        // ) {
        //     this.text!.innerText = `Satellite: ${intersects[0].object.userData.satellite}`;
        // } else {
        //     this.text!.innerText = "";
        // }
    }
}
