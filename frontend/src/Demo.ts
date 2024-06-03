import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import Albedo from "./assets/Albedo.jpg";
import Bump from "./assets/Bump.jpg";
import Ocean from "./assets/Ocean.png";
import NightLights from "./assets/night_lights_modified.png";
import Gaia from "./assets/Gaia.png";

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
        this.group.rotation.z = 23.5 / 360 * 2 * Math.PI;

        const albedoMap = await loadTexture(Albedo);
        albedoMap.colorSpace = THREE.SRGBColorSpace;

        const bumpMap = await loadTexture(Bump);
        const oceanMap = await loadTexture(Ocean);
        const lightsMap = await loadTexture(NightLights);

        let earthGeo = new THREE.SphereGeometry(10, 64, 64);
        let earthMat = new THREE.MeshStandardMaterial({
            map: albedoMap,
            bumpMap: bumpMap,
            bumpScale: 0.03,
            roughnessMap: oceanMap,
            metalness: 0.1,
            metalnessMap: oceanMap,
            emissiveMap: lightsMap,
            emissive: new THREE.Color(0xffff88),
        });
        this.earth = new THREE.Mesh(earthGeo, earthMat);
        this.group.add(this.earth);

        earthMat.onBeforeCompile = function (shader) {
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <roughnessmap_fragment>",
                `
              float roughnessFactor = roughness;
      
              #ifdef USE_ROUGHNESSMAP
      
                vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
                // reversing the black and white values because we provide the ocean map
                texelRoughness = vec4(1.0) - texelRoughness;
      
                // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
                roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
      
              #endif
            `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <emissivemap_fragment>",
                `
            #ifdef USE_EMISSIVEMAP
    
              vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
    
              // Methodology of showing night lights only:
              // going through the shader calculations in the meshphysical shader chunks (mostly on the vertex side),
              // we can confirm that geometryNormal is the normalized normal in view space,
              // for the night side of the earth, the dot product between geometryNormal and the directional light would be negative
              // since the direction vector actually points from target to position of the DirectionalLight,
              // for lit side of the earth, the reverse happens thus emissiveColor would be multiplied with 0.
              // The smoothstep is to smoothen the change between night and day
              
              emissiveColor *= 1.0 - smoothstep(-0.1, 0.1, dot(normal, directionalLights[0].direction));
              
              totalEmissiveRadiance *= emissiveColor.rgb;

              float intensity = 1.4 - dot( normal, vec3( 0.0, 0.0, 1.0 ) );
              vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow(intensity, 5.0);
             
              diffuseColor.rgb += atmosphere;
            #endif
          `
            );

            earthMat.userData.shader = shader;
        };

        // set initial rotational position of earth to get a good initial angle
        this.earth.rotateY(-0.3);
        this.scene.add(this.group);

        const envMap = await loadTexture(Gaia)
        envMap.mapping = THREE.EquirectangularReflectionMapping
        this.scene.background = envMap

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

        this.earth.rotateY(0.005);

        if (this.stats) this.stats.update();
        if (this.controls) this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
}
