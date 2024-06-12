import * as THREE from 'three'
//@ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import ThreeGlobe from 'three-globe'

import Earth from "./assets/earth-blue-marble.jpg"
import Gaia from "./assets/Gaia.png"
import { constructSatelliteMesh, type Satellite } from './Satellite';
import { loadTexture, shiftLeft } from './common/utils';
import { EARTH_RADIUS_KM, LINE_SIZE, MAX_CAMERA_DISTANCE, MIN_CAMERA_DISTANCE } from './common/constants'
import {Time} from './Time';
import * as TWEEN from '@tweenjs/tween.js'
import * as satellite from 'satellite.js'

export class ThreeSimulation {
  private satellites: Record<string, Satellite> = {}
  private drawLines = true
  private followSelected = true
  private tweeningStatus: number = 0
  private escapedFollow = false

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera

  private controls!: OrbitControls
  private globe!: ThreeGlobe
  private stats!: any

  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null
  private lineCounter = 0

  private time: Time = new Time(new Date())

  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private lastPointer = new THREE.Vector2()

  private currentlyHovering: Satellite | null = null
  private currentlySelected: Satellite | null = null

    private eventListeners: Record<string, ((...args: any[]) => void)[]> = {};

    // The first frame, we want to render all the satellites.
    frame = -1;
    private mesh!: THREE.InstancedMesh;
    

  private onRightSide = false

  // TODO: Dit is alleen async om textures te laden, er moet een progress bar of iets bij.
  initAll(canvas: HTMLCanvasElement) {
    this.initScene(canvas).then(() => {
      this.initStats()
      this.initListeners()
      this.initLine()
    })
  }

  private propagateAllSatData() {
    const globeRadius = this.globe.getGlobeRadius();
    const gmst = satellite.gstime(this.time.time);

    Object.values(this.satellites).forEach((sat, index) => {
        sat.propagate(this.time.time, gmst, index, this.frame);
        sat.updatePositionOfMesh(this.mesh, index, globeRadius);
    });

    this.mesh.computeBoundingSphere();

    this.frame = (this.frame + 1) % 60;
}

  private initStats() {
    this.stats = new (Stats as any)()
    document.body.appendChild(this.stats.dom)
  }

  private async initScene(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 1)
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
    this.scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI))
    this.scene.add(new THREE.AmbientLight(0xcccccc, Math.PI))

    // Add background
    const envMap = await loadTexture(Gaia)
    envMap.mapping = THREE.EquirectangularReflectionMapping
    this.scene.background = envMap

    // Add the Earth
        this.globe = new ThreeGlobe({
            animateIn: true,
        })
            .globeImageUrl(Earth)
            .objectLat('lat')
            .objectLng('lng')
            .objectAltitude('alt')
            .objectFacesSurface(false)
            .atmosphereAltitude(0);

        this.mesh = constructSatelliteMesh(this.globe.getGlobeRadius());
        this.scene.add(this.mesh)
        this.scene.add(this.globe);

    // Add satellite
    this.propagateAllSatData()
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

    if (!lat || !lng || !alt) {
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

  //Creates a line that follows a satellite.
  initLine() {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 'white'
    })
    this.lineGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(LINE_SIZE * 3)
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setDrawRange(0, LINE_SIZE)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)
    this.scene.add(this.line)
  }

  updateLine() {
    if (!this.line || !this.lineGeometry) return
    if (!this.currentlySelected) {
      if (this.line.parent === this.scene) this.removeLine()
      return
    }
    if (!(this.line.parent === this.scene)) {
      this.scene.add(this.line)
    }
    const satPositions = this.currentlySelected?.realPosition
    if (!satPositions) return
    const lineCoords = this.globe.getCoords(
      satPositions.lat,
      satPositions.lng,
      (satPositions.alt / EARTH_RADIUS_KM) * 3
    )

    let positions = this.line.geometry.attributes.position.array
    if (this.lineCounter > LINE_SIZE) {
      //Shift left is simular to a pop from a list.
      //Removes first item and shifts all the others.
      positions = shiftLeft(positions)
      positions = shiftLeft(positions)
      positions = shiftLeft(positions)
      this.lineCounter -= 3
    }
    positions[this.lineCounter++] = lineCoords.x
    positions[this.lineCounter++] = lineCoords.y
    positions[this.lineCounter++] = lineCoords.z

    this.lineGeometry.setDrawRange(0, this.lineCounter / 3)
    this.line.geometry.attributes.position.needsUpdate = true
  }

  //Removes the line from the scene.
  removeLine() {
    if (this.line && this.lineGeometry) {
      this.scene.remove(this.line)
      this.lineGeometry.setDrawRange(0, 0)
      this.lineCounter = 0
    }
  }

  private animate() {
    requestAnimationFrame(() => {
      this.animate()
    })

    if (this.onRightSide) {
      this.globe.rotation.y += 0.001
    }

    this.time.step()
    this.propagateAllSatData()
    if (this.stats) this.stats.update()
    if (this.controls) this.controls.update()
    this.renderer.render(this.scene, this.camera)

    if (this.drawLines) {
      this.updateLine()
    }
    if (this.followSelected && this.currentlySelected) {
      this.updateCamera()
    }
    // Update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)

    if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
      const ourSatellite = intersects[0].object.userData as {
        satellite: string
      }
      this.currentlyHovering = this.satellites[ourSatellite.satellite]
    } else {
      this.currentlyHovering = null
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

  private onClick(event: Event) {
    const xDif = Math.abs(this.lastPointer.x - this.pointer.x)
    const yDif = Math.abs(this.lastPointer.y - this.pointer.y)
    if (xDif > 0.00001 || yDif > 0.00001) return

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)

    if (intersects.length > 0 && 'satellite' in intersects[0].object.userData) {
      const satData = this.satellites[intersects[0].object.userData.satellite]
      if (!satData) return

      this.currentlySelected = satData
      this.removeLine()

      this.eventListeners['select']?.forEach((cb) => cb(satData))
      this.escapedFollow = false
    } else {
      this.eventListeners['select']?.forEach((cb) => cb(null))
      this.currentlySelected = null
    }
    this.tweeningStatus = 0
  }

  reset() {
    this.satellites = {}
    this.setTimeSpeed(1)
    this.drawLines = true
    this.currentlyHovering = null
    this.currentlySelected = null

    this.eventListeners = {}
  }

  addSatellite(sat: Satellite) {
    if (this.satellites[sat.id]) {
      console.warn('Satellite already exists')
      return
    }

    this.satellites[sat.id] = sat
  }

  addSatellites(sats: Satellite[]) {
    sats.forEach((sat) => this.addSatellite(sat))
  }

  removeAllSatellites() {
    this.satellites = {}
    this.currentlyHovering = null
    this.currentlySelected = null
    this.eventListeners['select']?.forEach((cb) => cb(null))
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

  setTime(time: Date) {}
  setTimeSpeed(speed: number) {
    this.time.setSpeed(speed)
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
