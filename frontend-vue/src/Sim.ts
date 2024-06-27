/**
 * This file contains the ThreeSimulation class, which is responsible for rendering the 3D scene.
 *
 * It is the core of our application, and is responsible for rendering the Earth, satellites, and other objects.
 */

import * as THREE from 'three'
//@ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ThreeGlobe from 'three-globe'

import Earth from './assets/earth-blue-marble.jpg'
import Gaia from './assets/Gaia.png'
import NightLights from './assets/night_lights_modified.png'

import {
  constructSatelliteMesh,
  SatelliteMeshes,
  type Satellite,
  polar2Cartesian
} from './Satellite'
import { GeoCoords, loadTexture } from './common/utils'
import {
  EARTH_RADIUS_KM,
  MAX_CAMERA_DISTANCE,
  MAX_SATS_TO_RENDER,
  MIN_CAMERA_DISTANCE,
  SAT_COLOR,
  SAT_COLOR_HOVER,
  SAT_COLOR_SELECTED,
  TWEEN_DURATION
} from './common/constants'
import { Time } from './Time'
import * as TWEEN from '@tweenjs/tween.js'
import * as satellite from 'satellite.js'
import { Orbit } from './Orbit'
import { WorkerManager } from './worker/manager'
import { AllSatLinks } from './SatLinks'
import { LocationMarker } from './LocationMarker'
import { reactive } from 'vue'

export enum TweeningStatus {
  NOOP,
  START_TO_TWEEN_TO_SAT,
  FOLLOW_CAMERA
}

// Define the ThreeSimulation class
export class ThreeSimulation {
  private satellites: Record<string, Satellite> = {}
  private followSelected = true
  private tweeningStatus: TweeningStatus = TweeningStatus.START_TO_TWEEN_TO_SAT
  private escapedFollow = false
  private satClicking = true

  private sun!: THREE.DirectionalLight
  private renderer!: THREE.WebGLRenderer
  scene!: THREE.Scene

  private camera!: THREE.PerspectiveCamera

  private controls!: OrbitControls
  private globe!: ThreeGlobe
  private stats!: any

  private orbits: Orbit[] = []
  public satelliteLinks: AllSatLinks | null = null
  private locationMarkers: LocationMarker[] = []

  public time: Time = new Time(new Date())

  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private lastPointer = new THREE.Vector2()

  private currentlyHovering: Satellite | null = null
  private currentlySelected: Satellite | null = null

  private eventListeners: Record<string, ((...args: any[]) => void)[]> = {}
  private mesh!: SatelliteMeshes

  // If the earth is on the side, it will rotate
  private onTheSide = false
  private workerManager = new WorkerManager()
  private finishedLoading = false
  public mobile = reactive({ value: false })

  // Initializes the entire scene and its components
  initAll(canvas: HTMLCanvasElement): Promise<void> {
    console.time('initAll')
    return this.initScene(canvas).then(() => {
      if (import.meta.env.DEV) {
        this.initStats()
      }
      this.initListeners()
      console.timeEnd('initAll')
      this.finishedLoading = true
    })
  }

  public waitUntilFinishedLoading() {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.finishedLoading) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
  }

  private getSatelliteByMeshID(meshID: number) {
    return Object.values(this.satellites)[meshID]
  }

  private getMeshIDBySatellite(sat: Satellite) {
    return Object.values(this.satellites).indexOf(sat)
  }

  // Updates the positions of satellite meshes
  private updatePositionsOfMeshes() {
    const globeRadius = this.globe.getGlobeRadius()
    Object.values(this.satellites).forEach((sat, i) => {
      sat.updatePositionOfMesh(this.mesh, i, globeRadius)
    })

    this.mesh.sat.computeBoundingSphere()
    this.mesh.satClick.computeBoundingSphere()
  }

  // Initializes performance stats for development mode
  private initStats() {
    this.stats = new (Stats as any)()
    document.body.appendChild(this.stats.dom)
  }

  // Calculates the position of the sun in the scene
  private getSunPosition() {
    const time = this.time.time
    const copy = new Date(time.getTime())
    const hours = copy.getUTCHours()
    const minutes = copy.getUTCMinutes()
    const seconds = copy.getUTCSeconds()

    const progress = (hours * 60 * 60 + minutes * 60 + seconds) / (24 * 60 * 60)

    const lat = 0
    const lng = progress * 360 - 180
    const cartesianPosition = polar2Cartesian(
      lat,
      lng,
      EARTH_RADIUS_KM * 3,
      this.globe.getGlobeRadius()
    )

    return new THREE.Vector3(cartesianPosition.x, cartesianPosition.y, cartesianPosition.z)
  }

  private warningOnMobile() {
    const width = window.innerWidth
    const height = window.innerHeight
    if (width < 800 || height < 600) {
      if (this.mobile.value) return
      alert(
        'This website is not optimized for mobile devices. Please use a desktop device for the best experience. Some features may be disabled.'
      )
      this.mobile.value = true
    } else {
      this.mobile.value = false
    }
  }

  // Initializes the 3D scene, camera, controls, and objects
  private async initScene(canvas: HTMLCanvasElement) {
    console.time('initScene')
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

    this.warningOnMobile()

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = false
    this.controls.maxDistance = MAX_CAMERA_DISTANCE
    this.controls.minDistance = MIN_CAMERA_DISTANCE
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null
    }
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    }

    // Add lights
    this.sun = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI)
    this.scene.add(this.sun)

    console.time('loadTextures')
    const nightLights = await loadTexture(NightLights)

    // Add background
    const envMap = await loadTexture(Gaia)
    envMap.mapping = THREE.EquirectangularReflectionMapping
    this.scene.background = envMap

    const earth = await loadTexture(Earth)
    earth.colorSpace = THREE.SRGBColorSpace

    const material = new THREE.MeshPhongMaterial({
      map: earth,
      emissiveMap: nightLights,
      emissive: new THREE.Color(0xffff88)
    })

    // Code from: https://github.com/franky-adl/threejs-earth
    material.onBeforeCompile = function (shader) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
            vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
            emissiveColor *= 1.0 - smoothstep(-0.2, 0.2, dot(normal, directionalLights[0].direction));
            totalEmissiveRadiance *= emissiveColor.rgb;
        `
      )
    }
    console.timeEnd('loadTextures')

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

    this.globe.userData = { name: 'globe' }

    this.mesh = constructSatelliteMesh(this.globe.getGlobeRadius())
    this.scene.add(this.mesh.sat)
    this.scene.add(this.mesh.satClick)
    this.scene.add(this.globe)

    console.timeEnd('initScene')
    this.animate()
  }

  // Updates the camera to follow the selected satellite
  private updateFollowCamera() {
    if (this.escapedFollow) {
      return
    }
    if (!this.currentlySelected) return

    let satPosition = this.currentlySelected.realPosition as {
      lat: number
      lng: number
    }
    if (this.tweeningStatus !== TweeningStatus.FOLLOW_CAMERA) {
      const time = new Date(+this.time.time + TWEEN_DURATION * 0.9 * this.time.multiplier.value)
      satPosition = this.currentlySelected.propagateNoUpdate(
        time,
        this.globe.getGlobeRadius(),
        true
      )
    }
    const lat = satPosition.lat
    const lng = satPosition.lng

    const oldCameraPosition = this.globe.toGeoCoords(this.camera.position)
    const alt = oldCameraPosition.altitude

    const newCameraPosition = this.globe.getCoords(lat, lng, alt)

    switch (this.tweeningStatus) {
      case TweeningStatus.NOOP:
        break
      case TweeningStatus.START_TO_TWEEN_TO_SAT:
        this.tweeningStatus = TweeningStatus.NOOP
        this.tweenCamera(
          newCameraPosition.x,
          newCameraPosition.y,
          newCameraPosition.z,
          TWEEN_DURATION,
          TweeningStatus.FOLLOW_CAMERA
        )
        break
      case TweeningStatus.FOLLOW_CAMERA:
        this.camera.position.set(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z)
        break
    }
  }

  // Animates the camera movement
  private tweenCamera(x: number, y: number, z: number, time: number, newStatus: TweeningStatus) {
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

  // Main animation loop
  private async animate() {
    requestAnimationFrame(() => {
      this.animate()
    })
    if (this.onTheSide) {
      this.globe.rotation.y += 0.001
    }

    this.sun.position.copy(this.getSunPosition())
    if (this.workerManager.finishPropagate(this.time.time, satellite.gstime(this.time.time))) {
      this.updatePositionsOfMeshes()
    }
    this.time.step()
    this.updateOrbits()
    this.satelliteLinks?.render()

    if (this.stats) this.stats.update()
    if (this.controls) this.controls.update()
    this.renderer.render(this.scene, this.camera)

    if (this.followSelected && this.currentlySelected) {
      this.updateFollowCamera()
    }
    // Update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects([
      this.globe,
      this.mesh.sat,
      this.mesh.satClick
    ])
    if (intersects.length > 0 && 'satellite' in intersects[0].object.userData && this.satClicking) {
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

  // Initializes event listeners for user interactions
  private initListeners() {
    window.addEventListener('mousemove', this.onPointerMove.bind(this), false)
    window.addEventListener('resize', this.onWindowResize.bind(this), false)
    document.getElementById('canvas')!.addEventListener('mouseup', this.onClick.bind(this), false)
    document
      .getElementById('canvas')!
      .addEventListener('mousedown', this.onMouseDown.bind(this), false)

    document
      .getElementById('canvas')!
      .addEventListener('touchend', this.onTouchEnd.bind(this), false)
    document
      .getElementById('canvas')!
      .addEventListener('touchstart', this.onTouchStart.bind(this), false)
    window.addEventListener('touchmove', this.onTouchMove.bind(this), false)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.orbits.forEach((orbit) => {
          orbit.recalculate()
        })
      }
    })
  }

  // Handles window resize events
  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.warningOnMobile()
  }

  // Resets the color of the currently hovering satellite
  private dehover() {
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

  // Deselects the currently selected satellite
  deselect() {
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

  // Performs a raycast to select objects in the scene
  private rayCast() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(
      this.satClicking ? [this.globe, this.mesh.sat, this.mesh.satClick] : [this.globe]
    )

    if (intersects.length > 0) {
      if ('satellite' in intersects[0].object.userData) {
        this.deselect()
        const meshID = intersects[0].instanceId
        if (meshID === undefined) return
        const satData = this.getSatelliteByMeshID(meshID)
        if (!satData) return
        this.currentlySelected = satData

        satData.setColor(SAT_COLOR_SELECTED, meshID, this.mesh)

        this.eventListeners['select']?.forEach((cb) => cb(satData))
        this.escapedFollow = false
      } else if (
        intersects[0].object.position.x === 0 &&
        intersects[0].object.position.y === 0 &&
        intersects[0].object.position.z === 0
      ) {
        this.deselect()
        const { lat, lng, altitude } = this.globe.toGeoCoords(intersects[0].point)
        this.eventListeners['earthClicked']?.forEach((cb) => cb({ lat, lng, alt: altitude }))
      }
    } else {
      this.deselect()
    }
    this.tweeningStatus = TweeningStatus.START_TO_TWEEN_TO_SAT
  }

  // Handles mouse click events
  private onClick(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.001 || yDif > 0.001) return
    this.rayCast()
  }

  // Handles pointer move events
  private onPointerMove(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  // Handles mouse down events
  private onMouseDown() {
    this.lastPointer.x = this.pointer.x
    this.lastPointer.y = this.pointer.y
    this.escapedFollow = true
  }

  // Handles touch start events
  private onTouchStart(event: TouchEvent) {
    this.lastPointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.lastPointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    this.pointer.x = this.lastPointer.x
    this.pointer.y = this.lastPointer.y
    this.escapedFollow = true
    event.preventDefault()
  }

  // Handles touch end events
  private onTouchEnd(event: TouchEvent) {
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.00001 || yDif > 0.00001) return

    this.rayCast()
    event.preventDefault()
  }

  // Handles touch move events
  private onTouchMove(event: TouchEvent) {
    this.pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    event.preventDefault()
  }

  // Resets the satellite meshes
  private resetMeshes() {
    if (!this.mesh || !this.mesh.sat || !this.mesh.satClick) return

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

  // Resets the entire simulation
  reset() {
    this.dehover()
    this.deselect()
    this.satellites = {}
    this.resetMeshes()
    this.workerManager.reset()
    this.time.setSpeed(1)
    this.time.setTime(new Date())
    this.removeAllOrbits()
    this.satelliteLinks?.destroy()
    this.removeAllMarkers()
    this.removeSatLink()

    this.satClicking = true
    this.currentlyHovering = null
    this.currentlySelected = null

    this.eventListeners = {}
  }

  // Adds a single satellite to the simulation
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

  // Adds multiple satellites to the simulation
  addSatellites(sats: Satellite[]) {
    sats.forEach((sat) => this.addSatellite(sat, false))
    this.workerManager.addSatellites(Object.values(this.satellites))
  }

  // Returns the array of satellites
  getSatellites(): Satellite[] {
    return Object.values(this.satellites)
  }

  // Resends data to workers when satellite data changes
  resendDataToWorkers() {
    this.workerManager.addSatellites(Object.values(this.satellites))
  }

  // Removes all satellites from the simulation
  removeAllSatellites() {
    this.satellites = {}
    this.currentlyHovering = null
    this.currentlySelected = null
    this.resetMeshes()

    this.eventListeners['select']?.forEach((cb) => cb(null))
  }

  // Updates the orbits of satellites
  private updateOrbits() {
    for (const orbit of this.orbits) {
      orbit.updateLine(this.globe)
    }
  }

  // Adds an orbit for a satellite
  addOrbit(sat: Satellite, showUpcoming: boolean) {
    const orbit = new Orbit(sat, this.scene, this.time, showUpcoming, this.globe)
    if (this.orbits.length > 3) {
      const removedOrbit = this.orbits.shift()
      removedOrbit?.removeLine(this.scene)
    }
    this.orbits.push(orbit)
    return orbit
  }

  // Removes an orbit for a satellite
  removeOrbit(sat: Satellite) {
    sat.orbit?.removeLine(this.scene)
    this.orbits = this.orbits.filter(function (obj) {
      return obj.satellite.id !== sat.id
    })
  }

  // Removes all orbits
  removeAllOrbits() {
    for (const orbit of this.orbits) {
      orbit.removeLine(this.scene)
    }
    this.orbits = []
  }

  // Adds all satellite links
  addAllSatLinks(link: AllSatLinks) {
    this.satelliteLinks = link
  }

  // Removes satellite links
  removeSatLink() {
    this.satelliteLinks?.destroy()
    this.satelliteLinks = null
  }

  // Adds a marker at specific coordinates
  addMarker(coords: GeoCoords) {
    const marker = new LocationMarker(coords, this.scene, this.globe)
    marker.render()
    this.locationMarkers.push(marker)
  }

  // Removes a marker at specific coordinates
  removeMarker(coords: GeoCoords) {
    const marker = this.locationMarkers.find((marker) => {
      return marker.getCoords().lat === coords.lat && marker.getCoords().lng === coords.lng
    })
    if (marker) {
      marker.remove()
      this.locationMarkers = this.locationMarkers.filter((m) => m !== marker)
    }
  }

  // Removes all markers
  removeAllMarkers() {
    for (const marker of this.locationMarkers) {
      marker.remove()
    }
    this.locationMarkers = []
  }

  // Moves the camera to the right side of the scene
  moveRight() {
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: null
    }
    this.controls.touches = {
      ONE: null,
      TWO: null
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
    this.onTheSide = true
  }

  // Moves the camera to the left side of the scene
  moveLeft() {
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: null
    }
    this.controls.touches = {
      ONE: null,
      TWO: null
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
    new TWEEN.Tween(this.controls.target)
      .to(
        {
          x: 200,
          y: 0,
          z: 0
        },
        500
      )
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .start()
    this.controls.target.set(200, 0, 0)
    this.onTheSide = true
  }

  // Moves the camera to the center of the scene
  moveCenter() {
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null
    }
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
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
    new TWEEN.Tween(this.globe?.rotation || new THREE.Vector3())
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
    this.onTheSide = false
  }

  // Sets the currently selected satellite and optionally resets the tweening status
  setCurrentlySelected(sat: Satellite, resetTweening = false) {
    this.currentlySelected = sat

    if (resetTweening) {
      this.tweeningStatus = TweeningStatus.START_TO_TWEEN_TO_SAT
      this.followSelected = true
      this.escapedFollow = false
    }
  }

  // Changes the color of a satellite
  changeColor(color: string, sat: Satellite) {
    sat.setColor(color, this.getMeshIDBySatellite(sat), this.mesh)
  }

  // Returns the names of the satellites
  getNameOfSats(): Satellite[] {
    return Object.values(this.satellites)
  }

  // Returns the current time
  getTime() {
    return this.time
  }

  // Returns the globe radius
  getGlobeRadius() {
    return this.globe.getGlobeRadius()
  }

  // Enables satellite clicking
  enableSatClicking() {
    this.satClicking = true
  }

  // Disables satellite clicking
  disableSatClicking() {
    this.satClicking = false
    this.deselect()
    this.dehover()
  }

  // Adds an event listener for specific events
  addEventListener(event: 'select', callback: (sat: Satellite | undefined) => void): void
  addEventListener(event: 'earthClicked', callback: (sat: GeoCoords | undefined) => void): void
  addEventListener(
    event: 'select' | 'earthClicked',
    callback: ((sat: Satellite | undefined) => void) | ((sat: GeoCoords | undefined) => void)
  ): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }

    this.eventListeners[event].push(callback)
  }
}
