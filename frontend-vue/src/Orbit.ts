import { Satellite } from './Satellite'
import * as THREE from 'three'
import { LINE_SIZE, EARTH_RADIUS_KM } from './common/constants'
import { shiftLeft } from './common/utils'
import ThreeGlobe from 'three-globe'
import { Time } from './Time'
import { NUM_OF_STEPS_ORBIT, TIME_INTERVAL_ORBIT } from './common/constants'
export class Orbit {
  private satellite: Satellite
  private line: THREE.Line | null = null
  private lineGeometry: THREE.BufferGeometry | null = null
  private lineCounter = 0
  private time: Time;
  private linePoints: {x: number, y: number, z: number}[] = [];
  private globeRadius: number;
  private lastUpdate = new Date();
  private numOfUpdates = 0;

  constructor(sat: Satellite, scene: THREE.Scene, time: Time, globeRadius: number) {
    this.satellite = sat
    this.time = time;
    this.globeRadius = globeRadius;
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 'white'
    })

    this.lineGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(LINE_SIZE * 3)
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.lineGeometry.setDrawRange(0, LINE_SIZE)
    this.line = new THREE.Line(this.lineGeometry, lineMaterial)
    this.generateLinePoints();
    scene.add(this.line)
  }

  generateLinePoints() {
    this.linePoints = this.satellite.propagateOrbit(this.time.time, NUM_OF_STEPS_ORBIT, TIME_INTERVAL_ORBIT, this.globeRadius);
    let positions = this.line?.geometry.attributes.position.array
    if (!positions || !this.line) return
    for (const pos of this.linePoints){
        positions[this.lineCounter++] = pos.x
        positions[this.lineCounter++] = pos.y
        positions[this.lineCounter++] = pos.z
    }
    this.lineGeometry?.setDrawRange(0, this.lineCounter / 3)
    this.line.geometry.attributes.position.needsUpdate = true
    console.log(this.linePoints)
    this.lastUpdate = new Date(+this.time.time);
  }

  generateNewLinePoint() {}

  updateLine(globe: ThreeGlobe) {
    if (!this.line || !this.lineGeometry) return
    const elapsed_time = (+this.time.time - +this.lastUpdate)
    for (let i = 0; i < elapsed_time / TIME_INTERVAL_ORBIT - this.numOfUpdates; i++){ 
        
        let positions = this.line.geometry.attributes.position.array
        //Shift left is simular to a pop from a list.
        //Removes first item and shifts all the others.
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        positions = shiftLeft(positions)
        this.lineCounter -= 3

        const newPos: any = this.satellite.propagateNoUpdate(new Date(+this.time.time + NUM_OF_STEPS_ORBIT * TIME_INTERVAL_ORBIT)
            , this.globeRadius);

        positions[this.lineCounter++] = newPos.x
        positions[this.lineCounter++] = newPos.y
        positions[this.lineCounter++] = newPos.z

        this.lineGeometry.setDrawRange(0, this.lineCounter / 3)
        this.line.geometry.attributes.position.needsUpdate = true
        this.numOfUpdates++;
    }
  }

  removeLine(scene: THREE.Scene) {
    if (this.line && this.lineGeometry) {
      scene.remove(this.line)
      this.lineGeometry.setDrawRange(0, 0)
      this.lineCounter = 0
    }
  }
  getLine() {
    return this.line
  }
}