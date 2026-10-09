import * as THREE from 'three'
import { getLinenTexture } from './windowDetails'

/** Five shaded lamps on curved brass arms, with one light per fixture. */
export function addChandelierFixture(parent: THREE.Group, wallHeight: number, x: number, z: number): void {
  const group = new THREE.Group()
  group.name = 'chandelier'
  group.position.set(x, wallHeight - 0.05, z)
  const brass = new THREE.MeshStandardMaterial({ color: 0x9b7946, metalness: 0.72, roughness: 0.34 })
  const darkBrass = new THREE.MeshStandardMaterial({ color: 0x655039, metalness: 0.65, roughness: 0.48 })
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xffedcf, map: getLinenTexture(),
    roughness: 0.95, side: THREE.DoubleSide, emissive: 0xffd59d, emissiveIntensity: 0.12 })
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff5df, emissive: 0xffdfaa, emissiveIntensity: 1.2, roughness: 0.35 })
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y: number) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = y
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }
  add(new THREE.CylinderGeometry(0.12, 0.16, 0.05, 24), brass, -0.015)
  add(new THREE.CylinderGeometry(0.055, 0.09, 0.065, 20), darkBrass, -0.065)
  for (let i = 0; i < 7; i++) {
    const link = add(new THREE.TorusGeometry(0.022, 0.006, 6, 14), brass, -0.115 - i * 0.038)
    link.scale.y = 1.25
    link.rotation.y = (i % 2) * Math.PI / 2
  }
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16), brass, -0.42)
  const hub = add(new THREE.SphereGeometry(0.105, 20, 12), brass, -0.51)
  hub.scale.y = 0.7
  add(new THREE.CylinderGeometry(0.065, 0.09, 0.05, 20), darkBrass, -0.58)
  add(new THREE.SphereGeometry(0.035, 12, 8), brass, -0.63)

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const arm = new THREE.Group()
    arm.rotation.y = angle
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.07, -0.51, 0), new THREE.Vector3(0.2, -0.59, 0),
      new THREE.Vector3(0.36, -0.6, 0), new THREE.Vector3(0.46, -0.51, 0),
      new THREE.Vector3(0.46, -0.43, 0),
    ])
    arm.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.012, 8, false), brass))
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.034, 0.035, 20), brass)
    cup.position.set(0.46, -0.425, 0)
    arm.add(cup)
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 12), darkBrass)
    socket.position.set(0.46, -0.385, 0)
    arm.add(socket)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.145, 0.22, 32, 1, true), shadeMat)
    shade.position.set(0.46, -0.305, 0)
    arm.add(shade)
    for (const [radius, y] of [[0.088, -0.195], [0.145, -0.415]]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.007, 6, 32), brass)
      rim.rotation.x = Math.PI / 2
      rim.position.set(0.46, y, 0)
      arm.add(rim)
    }
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.043, 16, 12), bulbMat)
    bulb.scale.y = 1.3
    bulb.position.set(0.46, -0.325, 0)
    arm.add(bulb)
    group.add(arm)
  }
  const light = new THREE.PointLight(0xffe0b0, 0.9, 20, 1.7)
  light.userData.chandelier = true
  light.position.y = -0.55
  if (x === 0 && z === 0) {
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.bias = -0.0002
  }
  group.add(light)
  parent.add(group)
}
