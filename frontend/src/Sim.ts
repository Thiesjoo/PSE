import * as THREE from 'three';
//@ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeGlobe from 'three-globe';

import Earth from "./assets/earth-blue-marble.jpg"
import Gaia from "./assets/Gaia.png"
import type { Satellite } from './Satellite';
import { loadTexture } from './common/utils';

import {Time} from './Time';

import * as satellite from 'satellite.js';

export class ThreeSimulation { 
    private satellites: Record<string, Satellite> = {};
    private drawLines = true;

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;

    private controls!: OrbitControls;
    private globe!: ThreeGlobe;
    private stats!: any;


    private time: Time = new Time(new Date());

    private raycaster = new THREE.Raycaster();
    private pointer = new THREE.Vector2();

    private currentlyHovering: Satellite | null = null;
    private currentlySelected: Satellite | null = null;
    

    constructor() {
        // TODO: Dit is alleen async om textures te laden, er moet een progress bar of iets bij.
        this.initScene().then(() => {
            this.initStats();
            this.initListeners();
            // this.initLine();
        })
    }

    private propagateAllSatData() {
        const gmst = satellite.gstime(this.time.time);
        const currentPositions = Object.values(this.satellites).map(sat => sat.propagate(this.time.time, gmst));
        this.globe.objectsData(currentPositions);
    }

    private initStats() {
        this.stats = new (Stats as any)();
        document.body.appendChild(this.stats.dom);
    }

    private async initScene() {
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
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Add lights
        this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
        this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));

        // Add the Earth
        this.globe = new ThreeGlobe()
            .globeImageUrl(Earth)
            .objectLat('lat')
            .objectLng('lng')
            .objectAltitude('alt')
            .objectFacesSurface(false)
            .atmosphereAltitude(0);
        this.globe.objectThreeObject(d => {
            if ('id' in d) {
                const thisSatellite = this.satellites[d.id as string];
                if (thisSatellite) {
                    return thisSatellite.render(this.currentlySelected?.id == d.id, this.currentlyHovering?.id == d.id, this.globe.getGlobeRadius());
                }
                
                return new THREE.Mesh();
            } else {
                return new THREE.Mesh();
            }
        });
        this.scene.add(this.globe);

        // Add background
        const envMap = await loadTexture(Gaia);
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = envMap;

        // Add satellite
        this.propagateAllSatData();
        this.animate();
    }

    private animate() {
        requestAnimationFrame(() => {
            this.animate();
        });

        this.time.step();
        this.propagateAllSatData();
        if (this.stats) this.stats.update();
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);

        // TODO: Line drawing

        // Update the picking ray with the camera and pointer position
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
            const ourSatellite = intersects[0].object.userData as {
                satellite: string;
            };
            this.currentlyHovering = this.satellites[ourSatellite.satellite];
        } else {
            this.currentlyHovering = null;
        }
    }


    private initListeners() {
        window.addEventListener('pointermove', this.onPointerMove.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        window.addEventListener('click', this.onClick.bind(this), false);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private onPointerMove(event: PointerEvent) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    private onClick(event: Event) {
        // TODO: Port to new popup system?
        // if (
        //     event.target &&
        //     //@ts-ignore // This is to prevent the popup from closing when clicking on the popup itself
        //     (event.target.id === 'pop-up' ||
        //         //@ts-ignore
        //         event.target.parentNode.id === 'pop-up')
        // )
        //     return;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
            const satData = this.satellites[intersects[0].object.userData.satellite];
            if (!satData) return;

            this.currentlySelected = satData;
            // TODO: Emit Event;
        } else {
            this.currentlySelected = null;
        }
    }


    addSatellite(sat: Satellite) {
        if (this.satellites[sat.id]) {
            console.warn('Satellite already exists');
            return;
        }

        this.satellites[sat.id] = sat;
    };

    addGroundStation() {};

    setTime(time: Date) {};
    setTimeSpeed(speed: number) {
        this.time.setSpeed(speed);
    };

    enableLineDrawing() {};
    disableLineDrawing() {};

    changeCameraLocation() {};

    // Emits:
    // select(sat | undefined )

    addEventListener(event: 'select', callback: (sat: Satellite | undefined) => void) {
        // TODO
    }

}

