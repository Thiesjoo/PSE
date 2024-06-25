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

export enum TweeningStatus {
  NOOP,
  START_TO_TWEEN_TO_SAT,
  FOLLOW_CAMERA
}

export class ThreeSimulation {
  private satellites: Record<string, Satellite> = {}
  public followSelected = true
  public tweeningStatus: TweeningStatus = TweeningStatus.START_TO_TWEEN_TO_SAT
  public escapedFollow = false
  private satClicking = true

  private sun!: THREE.DirectionalLight
  private renderer!: THREE.WebGLRenderer
  public scene!: THREE.Scene //TODO: private maken
  private camera!: THREE.PerspectiveCamera

  private controls!: OrbitControls
  public globe!: ThreeGlobe
  private stats!: any

  private orbits: Orbit[] = []
  public satelliteLinks: AllSatLinks | null = null
  private locationMarkers: LocationMarker[] = []

  public time: Time = new Time(new Date()) //TODO: private maken

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

  // TODO: Dit is alleen async om textures te laden, er moet een progress bar of iets bij.
  initAll(canvas: HTMLCanvasElement): Promise<void> {
    return this.initScene(canvas).then(() => {
      if (import.meta.env.DEV) {
        this.initStats()
      }
      this.initListeners()
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
    const time = this.time.time
    const copy = new Date(time.getTime())
    // get time in GMT
    const hours = copy.getUTCHours()
    const minutes = copy.getUTCMinutes()
    const seconds = copy.getUTCSeconds()

    // progress in day
    const progress = (hours * 60 * 60 + minutes * 60 + seconds) / (24 * 60 * 60)

    // at 0.00 the sun is at lat0, lon0, 4 hours later at lat
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
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
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

    this.animate()
  }

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
      ) as {
        lat: number
        lng: number
      }
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
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
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

  private rayCast() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects([
      this.globe,
      this.mesh.sat,
      this.mesh.satClick
    ])

    if (intersects.length > 0) {
      if ('satellite' in intersects[0].object.userData && this.satClicking) {
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

  private onClick(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.001 || yDif > 0.001) return
    this.rayCast()
  }

  private onPointerMove(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  private onMouseDown() {
    this.lastPointer.x = this.pointer.x
    this.lastPointer.y = this.pointer.y
    this.escapedFollow = true
  }

  private onTouchStart(event: TouchEvent) {
    this.lastPointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.lastPointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    this.pointer.x = this.lastPointer.x
    this.pointer.y = this.lastPointer.y
    this.escapedFollow = true
    event.preventDefault()
  }

  private onTouchEnd(event: TouchEvent) {
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.00001 || yDif > 0.00001) return

    this.rayCast()
    event.preventDefault()
  }

  private onTouchMove(event: TouchEvent) {
    this.pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    event.preventDefault()
  }

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
    this.workerManager.addSatellites(Object.values(this.satellites))
  }

  getSatellites(): Satellite[] {
    return Object.values(this.satellites)
  }

  resendDataToWorkers() {
    // This should be called when satData is changed
    this.workerManager.addSatellites(Object.values(this.satellites))
  }

  removeAllSatellites() {
    this.satellites = {}
    this.currentlyHovering = null
    this.currentlySelected = null
    this.resetMeshes()

    this.eventListeners['select']?.forEach((cb) => cb(null))
  }

  private updateOrbits() {
    for (const orbit of this.orbits) {
      orbit.updateLine(this.globe)
    }
  }

  addOrbit(sat: Satellite, showUpcoming: boolean) {
    const orbit = new Orbit(sat, this.scene, this.time, showUpcoming, this.globe)
    if (this.orbits.length > 3) {
      const removedOrbit = this.orbits.shift()
      removedOrbit?.removeLine(this.scene)
    }
    this.orbits.push(orbit)
    return orbit
  }

  removeOrbit(sat: Satellite) {
    sat.orbit?.removeLine(this.scene)
    this.orbits = this.orbits.filter(function (obj) {
      return obj.satellite.id !== sat.id
    })
  }

  removeAllOrbits() {
    for (const orbit of this.orbits) {
      orbit.removeLine(this.scene)
    }
    this.orbits = []
  }

  addAllSatLinks(link: AllSatLinks) {
    this.satelliteLinks = link
  }

  removeSatLink() {
    this.satelliteLinks?.destroy()
    this.satelliteLinks = null
  }

  addMarker(coords: GeoCoords) {
    const marker = new LocationMarker(coords, this.scene, this.globe)
    marker.render()
    this.locationMarkers.push(marker)
  }

  removeMarker(coords: GeoCoords) {
    const marker = this.locationMarkers.find((marker) => {
      return marker.getCoords().lat === coords.lat && marker.getCoords().lng === coords.lng
    })
    if (marker) {
      marker.remove()
      this.locationMarkers = this.locationMarkers.filter((m) => m !== marker)
    }
  }

  removeAllMarkers() {
    for (const marker of this.locationMarkers) {
      marker.remove()
    }
    this.locationMarkers = []
  }

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
    this.onTheSide = true
  }

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
    // this.camera.position.set(0, 0, 500);
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

  setCurrentlySelected(sat: Satellite, resetTweening = false) {
    this.currentlySelected = sat

    if (resetTweening) {
      this.tweeningStatus = TweeningStatus.START_TO_TWEEN_TO_SAT
      this.followSelected = true
      this.escapedFollow = false
    }
  }

  changeColor(color: string, sat: Satellite) {
    sat.setColor(color, this.getMeshIDBySatellite(sat), this.mesh)
  }

  getNameOfSats(): Satellite[] {
    return Object.values(this.satellites)
  }

  getTime() {
    return this.time
  }

  enableSatClicking() {
    this.satClicking = true
  }

  disableSatClicking() {
    this.satClicking = false
    this.deselect()
    this.dehover()
  }

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
