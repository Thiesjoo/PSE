import * as THREE from 'three'
//@ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ThreeGlobe from 'three-globe'

import Earth from './assets/earth-blue-marble.jpg'
import Gaia from './assets/Gaia.png'
import NightLights from "./assets/night_lights_modified.png"

import { constructSatelliteMesh, SatelliteMeshes, type Satellite, polar2Cartesian } from './Satellite'
import { loadTexture, shiftLeft } from './common/utils'
import {
  EARTH_RADIUS_KM,
  LINE_SIZE,
  MAX_CAMERA_DISTANCE,
  MAX_SATS_TO_RENDER,
  MIN_CAMERA_DISTANCE,
  SAT_COLOR,
  SAT_COLOR_HOVER,
  SAT_COLOR_SELECTED
} from './common/constants'
import { Time } from './Time'
import * as TWEEN from '@tweenjs/tween.js'
import * as satellite from 'satellite.js'
import { Orbit } from './Orbit'
import { WorkerManager } from './worker/manager'

export class ThreeSimulation {
  private satellites: Record<string, Satellite> = {}
  private drawLines = true
  private followSelected = true
  private tweeningStatus: number = 0
  private escapedFollow = false

  private sun!: THREE.DirectionalLight;
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera

  private controls!: OrbitControls
  private globe!: ThreeGlobe
  private stats!: any

  private orbits: Orbit[] = []

  private time: Time = new Time(new Date())

  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private lastPointer = new THREE.Vector2()

  private currentlyHovering: Satellite | null = null
  private currentlySelected: Satellite | null = null

  private eventListeners: Record<string, ((...args: any[]) => void)[]> = {}
  private mesh!: SatelliteMeshes

  private onRightSide = false

  private workerManager = new WorkerManager()

  // TODO: Dit is alleen async om textures te laden, er moet een progress bar of iets bij.
  initAll(canvas: HTMLCanvasElement) {
    this.initScene(canvas).then(() => {
      this.initStats()
      this.initListeners()
    })
  }

  private getSatelliteByMeshID(meshID: number) {
    return Object.values(this.satellites)[meshID]
  }

  private getMeshIDBySatellite(sat: Satellite) {
    return Object.values(this.satellites).indexOf(sat)
  }

  private updatePositionsOfMeshes() {
    const globeRadius = this.globe.getGlobeRadius()
    Object.values(this.satellites).forEach((sat, i) => {
      sat.updatePositionOfMesh(this.mesh, i, globeRadius)
    })

    this.mesh.sat.computeBoundingSphere()
    this.mesh.satClick.computeBoundingSphere()
  }

  private initStats() {
    this.stats = new (Stats as any)()
    document.body.appendChild(this.stats.dom)
  }

  private getSunPosition() {
    // Calculate the position of the sun in our scene
    // This is used for the night lights on the Earth. solar ephemeris
    const time = this.time.time;
    const copy  = new Date(time.getTime());
    // get time in GMT
    const hours = copy.getUTCHours();
    const minutes = copy.getUTCMinutes();
    const seconds = copy.getUTCSeconds();

    // progress in day
    const progress = (hours * 60 * 60 + minutes * 60 + seconds) / (24 * 60 * 60);

    // at 0.00 the sun is at lat0, lon0, 4 hours later at lat 
    const lat = 0;
    const lng = progress * 360 - 180;
    const cartesianPosition = polar2Cartesian(
        lat,
        lng,
        EARTH_RADIUS_KM * 3,
        this.globe.getGlobeRadius()
      )

    return new THREE.Vector3(cartesianPosition.x, cartesianPosition.y, cartesianPosition.z)
  }

  private async initScene(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 7500)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    camera.position.z = 400
    this.camera = camera

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas as HTMLCanvasElement
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.maxDistance = MAX_CAMERA_DISTANCE
    this.controls.minDistance = MIN_CAMERA_DISTANCE
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null
    }

    // Add lights
    this.sun = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI)
    this.scene.add(this.sun)

    const nightLights = await loadTexture(NightLights)

    // Add background
    const envMap = await loadTexture(Gaia)
    envMap.mapping = THREE.EquirectangularReflectionMapping
    this.scene.background = envMap

    const earth = await loadTexture(Earth)
    earth.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshPhongMaterial({
        map: earth,
        emissiveMap: nightLights,
        emissive: new THREE.Color(0xffff88),
    })


    // Code from: https://github.com/franky-adl/threejs-earth
    material.onBeforeCompile = function( shader ) {
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
            vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
            emissiveColor *= 1.0 - smoothstep(-0.2, 0.2, dot(normal, directionalLights[0].direction));
            totalEmissiveRadiance *= emissiveColor.rgb;
        `)
    }

    // Add the Earth
    this.globe = new ThreeGlobe()
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude('alt')
      .objectFacesSurface(false)
      .atmosphereAltitude(0)
      .globeMaterial(material)
      this.sun.position.copy(this.getSunPosition())

    const axialTiltInRadians = 23.5 * (Math.PI / 180)
    this.globe.rotation.x = axialTiltInRadians

    this.mesh = constructSatelliteMesh(this.globe.getGlobeRadius())
    this.scene.add(this.mesh.sat)
    this.scene.add(this.mesh.satClick)
    this.scene.add(this.globe)

    this.animate()
  }

  private updateCamera() {
    if (this.escapedFollow) {
      return
    }
    const satPosition = this.currentlySelected?.realPosition
    const lat = satPosition?.lat
    const lng = satPosition?.lng

    const oldCameraPosition = this.globe.toGeoCoords(this.camera.position)
    const alt = oldCameraPosition.altitude

    if (lat === undefined || lng === undefined || alt == undefined) {
      return
    }
    const newCameraPosition = this.globe.getCoords(lat, lng, alt)

    if (this.tweeningStatus === 0) {
      this.tweeningStatus = 1
      this.tweenCamera(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z, 500, 2)
    }
    if (this.tweeningStatus === 2) {
      this.tweeningStatus = 3
      this.tweenCamera(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z, 50, 4)
    } else if (this.tweeningStatus === 4) {
      this.camera.position.set(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z)
    }
  }

  private tweenCamera(x: number, y: number, z: number, time: number, newStatus: number) {
    new TWEEN.Tween(this.camera.position)
      .to(
        {
          x: x,
          y: y,
          z: z
        },
        time
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .onComplete(() => {
        this.tweeningStatus = newStatus
      })
      .start()
  }

  private async animate() {
    requestAnimationFrame(() => {
      this.animate()
    })
    if (this.onRightSide) {
      this.globe.rotation.y += 0.001
    }

    this.sun.position.copy(this.getSunPosition())
    if (this.workerManager.finishPropagate(this.time.time, satellite.gstime(this.time.time))) {
      this.updatePositionsOfMeshes()
    }
    this.time.step()
    this.updateOrbits()

    if (this.stats) this.stats.update()
    if (this.controls) this.controls.update()
    this.renderer.render(this.scene, this.camera)

    if (this.followSelected && this.currentlySelected) {
      this.updateCamera()
    }
    // Update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)
    if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
      this.dehover()

      const meshID = intersects[0].instanceId
      if (!meshID) return

      const satData = this.getSatelliteByMeshID(meshID)
      if (!satData) return

      this.currentlyHovering = satData
      if (this.currentlyHovering !== this.currentlySelected) {
        satData.setColor(SAT_COLOR_HOVER, meshID, this.mesh)
      }
    } else {
      this.dehover()
    }
  }

  private initListeners() {
    window.addEventListener('pointermove', this.onPointerMove.bind(this), false)
    window.addEventListener('resize', this.onWindowResize.bind(this), false)
    document.getElementById('canvas')!.addEventListener('click', this.onClick.bind(this), false)
    document
      .getElementById('canvas')!
      .addEventListener('mousedown', this.onMouseDown.bind(this), false)
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private onPointerMove(event: PointerEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  private onMouseDown(event: Event) {
    this.lastPointer.x = this.pointer.x
    this.lastPointer.y = this.pointer.y
    this.escapedFollow = true
  }

  private dehover() {
    // If you are hovering over a satellite and you are not selecting it, change the color back to normal.
    if (this.currentlyHovering && this.currentlySelected !== this.currentlyHovering) {
      this.currentlyHovering.setColor(
        SAT_COLOR,
        this.getMeshIDBySatellite(this.currentlyHovering),
        this.mesh
      )
    }
    if (this.currentlyHovering) {
      this.currentlyHovering = null
    }
  }

  deselect() {
    // Only change the color back to normal if you are not selecting the satellite and you are not hovering over it.
    if (this.currentlySelected && this.currentlyHovering !== this.currentlySelected) {
      this.currentlySelected.setColor(
        SAT_COLOR,
        this.getMeshIDBySatellite(this.currentlySelected),
        this.mesh
      )

      this.eventListeners['select']?.forEach((cb) => cb(null))
      this.currentlySelected = null
    }
  }

  private onClick() {
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.00001 || yDif > 0.00001) return

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)
    if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
      this.deselect()

      const meshID = intersects[0].instanceId
      if (meshID === undefined) return
      const satData = this.getSatelliteByMeshID(meshID)
      if (!satData) return
      this.currentlySelected = satData

      satData.setColor(SAT_COLOR_SELECTED, meshID, this.mesh)

      this.eventListeners['select']?.forEach((cb) => cb(satData))
      this.escapedFollow = false
    }
    else {
      this.deselect()
    }
    this.tweeningStatus = 0
  }

  private resetAllMeshes() {
    const matrix = new THREE.Matrix4()
    matrix.compose(
      new THREE.Vector3(0, 0, 0),
      new THREE.Quaternion(0, 0, 0, 0),
      new THREE.Vector3(1, 1, 1)
    )

    for (let i = 0; i < MAX_SATS_TO_RENDER; i++) {
      this.mesh.sat.setMatrixAt(i, matrix)
      this.mesh.satClick.setMatrixAt(i, matrix)
    }

    this.mesh.sat.instanceMatrix.needsUpdate = true
    this.mesh.satClick.instanceMatrix.needsUpdate = true
  }

  reset() {
    this.dehover()
    this.deselect()
    this.satellites = {}
    this.resetAllMeshes()
    this.workerManager.reset()
    this.time.setSpeed(1)
    this.removeAllOrbits();

    this.drawLines = true
    this.currentlyHovering = null
    this.currentlySelected = null
    

    this.eventListeners = {}
  }

  addSatellite(sat: Satellite, updateWorker = true) {
    if (this.satellites[sat.id]) {
      console.warn('Satellite already exists')
      return
    }

    this.satellites[sat.id] = sat
    if (updateWorker) {
        this.workerManager.addSatellites(Object.values(this.satellites))
    }
  }

  addSatellites(sats: Satellite[]) {
    sats.forEach((sat) => this.addSatellite(sat, false))
    this.workerManager.addSatellites(sats)
  }

  resendDataToWorkers() {
    // This should be called when satData is changed 
    this.workerManager.addSatellites(Object.values(this.satellites))
  }

  removeAllSatellites() {
    this.satellites = {}
    this.currentlyHovering = null
    this.currentlySelected = null
    this.resetAllMeshes()

    this.eventListeners['select']?.forEach((cb) => cb(null))
  }

  private updateOrbits() {
    for (const orbit of this.orbits) {
      orbit.updateLine(this.globe)
    }
  }

  addOrbit(sat: Satellite, showUpcoming: boolean) {
    const orbit = new Orbit(sat, this.scene, this.time, this.globe.getGlobeRadius(), showUpcoming)
    if (this.orbits.length > 3) {
      const removedOrbit = this.orbits.shift()
      removedOrbit?.removeLine(this.scene)
    }
    this.orbits.push(orbit)
    return orbit;
  }

  removeOrbit(sat: Satellite) {
    sat.orbit?.removeLine(this.scene)
    this.orbits = this.orbits.filter(function(obj) {
      return obj.satellite.id !== sat.id;
    });
  }

  removeAllOrbits(){
    for (const orbit of this.orbits){
      orbit.removeLine(this.scene)
    }
    this.orbits = [];
  }

  addGroundStation() {}

  moveRight() {
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: null
    }
    new TWEEN.Tween(this.camera.position)
      .to(
        {
          x: 0,
          y: 0,
          z: 500
        },
        500
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start()
    // this.camera.position.set(0, 0, 500);
    new TWEEN.Tween(this.controls.target)
      .to(
        {
          x: -200,
          y: 0,
          z: 0
        },
        500
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start()
    this.controls.target.set(-200, 0, 0)
    this.onRightSide = true
  }

  moveCenter() {
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null
    }
    new TWEEN.Tween(this.controls.target)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        500
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start()
    new TWEEN.Tween(this.globe.rotation)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        500
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start()
    this.onRightSide = false
  }

  setCurrentlySelected(sat: Satellite){
    this.currentlySelected = sat;
  }

  changeColor(color: string, sat: Satellite){
    sat.setColor(
      color,
      this.getMeshIDBySatellite(sat),
      this.mesh
    )
  }

  getTime() {
    return this.time
  }

  enableLineDrawing() {
    this.drawLines = true
  }
  disableLineDrawing() {
    this.drawLines = false
  }

  changeCameraLocation() {}

  // Emits:
  // select(sat | undefined )
  addEventListener(event: 'select', callback: (sat: Satellite | undefined) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }

    this.eventListeners[event].push(callback)
  }
}
