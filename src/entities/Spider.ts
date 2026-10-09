import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const shell = new THREE.MeshStandardMaterial({ color: 0x10120f, roughness: 0.28, metalness: 0.18 })
const eyes = new THREE.MeshStandardMaterial({ color: 0x601811, roughness: 0.2, emissive: 0x290400, emissiveIntensity: 0.2 })
const limbGeometry = new THREE.CapsuleGeometry(0.024, 1, 3, 8)
const eyeGeometry = new THREE.SphereGeometry(0.016, 8, 6)
let bodyGeometry: THREE.BufferGeometry | null = null

function getBodyGeometry(): THREE.BufferGeometry {
  if (bodyGeometry) return bodyGeometry
  const abdomen = new THREE.SphereGeometry(1, 20, 14).scale(0.17, 0.13, 0.23).translate(0, 0.21, 0.12)
  const head = new THREE.SphereGeometry(1, 16, 12).scale(0.12, 0.09, 0.13).translate(0, 0.18, -0.14)
  const pieces: THREE.BufferGeometry[] = [abdomen, head]
  for (const side of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(side * 0.065, 0.17, -0.23),
      new THREE.Vector3(side * 0.09, 0.07, -0.31), new THREE.Vector3(side * 0.03, 0.09, -0.32))
    pieces.push(new THREE.TubeGeometry(curve, 8, 0.017, 6, false))
  }
  bodyGeometry = mergeGeometries(pieces)!
  for (const piece of pieces) piece.dispose()
  return bodyGeometry
}

/** Three draw calls per spider; all sixteen moving leg segments are instanced. */
export class Spider {
  readonly root = new THREE.Group()
  private readonly legs = new THREE.InstancedMesh(limbGeometry, shell, 16)
  private readonly dummy = new THREE.Object3D()
  private readonly direction = new THREE.Vector3()
  private readonly midpoint = new THREE.Vector3()
  private readonly up = new THREE.Vector3(0, 1, 0)
  private readonly hip = new THREE.Vector3()
  private readonly knee = new THREE.Vector3()
  private readonly foot = new THREE.Vector3()

  constructor() {
    this.root.add(new THREE.Mesh(getBodyGeometry(), shell), this.legs)
    this.legs.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const eyeMesh = new THREE.InstancedMesh(eyeGeometry, eyes, 8)
    for (let i = 0; i < 8; i++) {
      this.dummy.position.set((i % 4 - 1.5) * 0.032, 0.19 + Math.floor(i / 4) * 0.025, -0.251)
      this.dummy.rotation.set(0, 0, 0)
      this.dummy.scale.setScalar(i % 4 === 1 || i % 4 === 2 ? 1.2 : 0.75)
      this.dummy.updateMatrix()
      eyeMesh.setMatrixAt(i, this.dummy.matrix)
    }
    this.root.add(eyeMesh)
    this.animate(0, false)
  }

  animate(time: number, moving = true): void {
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, row = i % 4
      const wave = moving ? Math.sin(time * 19 + row * 2.6 + (side > 0 ? Math.PI : 0)) : 0
      this.hip.set(side * 0.095, 0.18, -0.17 + row * 0.085)
      this.knee.set(side * (0.29 + Math.sin(row * 1.1) * 0.035), 0.24 + Math.max(0, wave) * 0.04, -0.36 + row * 0.22)
      this.foot.set(side * 0.4, 0.025 + Math.max(0, wave) * 0.07, -0.44 + row * 0.28 + wave * 0.05)
      this.segment(i * 2, this.hip, this.knee)
      this.segment(i * 2 + 1, this.knee, this.foot)
    }
    this.legs.instanceMatrix.needsUpdate = true
    // Animated endpoints remain within this fixed bound, including giant root scaling.
    if (!this.legs.boundingSphere) this.legs.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.2, 0), 0.8)
  }

  private segment(index: number, from: THREE.Vector3, to: THREE.Vector3): void {
    this.direction.subVectors(to, from)
    const length = this.direction.length()
    this.midpoint.addVectors(from, to).multiplyScalar(0.5)
    this.dummy.position.copy(this.midpoint)
    this.dummy.quaternion.setFromUnitVectors(this.up, this.direction.normalize())
    this.dummy.scale.set(1, length / 1.048, 1)
    this.dummy.updateMatrix()
    this.legs.setMatrixAt(index, this.dummy.matrix)
  }
}
