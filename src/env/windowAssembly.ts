import * as THREE from 'three'
import { WINDOW_CENTER_Y, WINDOW_HEIGHT, WINDOW_WIDTH } from './roomWalls'
import type { WindowPlacement } from './loadWindowModel'
import { getLinenTexture, getWindowWoodTexture } from './windowDetails'

/** Opaque closed curtains replace the outdoor view and hidden window details. */
function createWindow(): THREE.Group {
  const group = new THREE.Group()
  const halfH = WINDOW_HEIGHT / 2
  const fabric = new THREE.MeshStandardMaterial({ color: 0xa6af98,
    map: getLinenTexture(), bumpMap: getLinenTexture(), bumpScale: 0.002,
    roughness: 1, side: THREE.DoubleSide })
  const brass = new THREE.MeshStandardMaterial({ color: 0x9c8055, metalness: 0.6, roughness: 0.42 })
  const sillMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, map: getWindowWoodTexture(), roughness: 0.7 })
  // A solid backing prevents the outside/background being visible at oblique angles.
  const backing = new THREE.Mesh(new THREE.BoxGeometry(WINDOW_WIDTH + 0.18, WINDOW_HEIGHT + 0.18, 0.06), sillMat)
  backing.position.z = 0.05
  group.add(backing)
  const curtainW = (WINDOW_WIDTH + 0.65) / 2
  const curtainH = WINDOW_HEIGHT + 0.72
  for (const side of [-1, 1]) {
    const geometry = new THREE.PlaneGeometry(curtainW, curtainH, 40, 8)
    const position = geometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      const y = position.getY(i)
      const fold = Math.cos((x / curtainW + 0.5) * Math.PI * 14)
      position.setZ(i, fold * (0.04 + 0.012 * (0.5 - y / curtainH)))
      position.setY(i, y + 0.008 * fold * (0.5 - y / curtainH))
    }
    geometry.computeVertexNormals()
    const curtain = new THREE.Mesh(geometry, fabric)
    // The two panels overlap by 4 cm at the centre; no slit exposes the opening.
    curtain.position.set(side * (curtainW / 2 - 0.02), -0.11, 0.4)
    curtain.receiveShadow = true
    group.add(curtain)
    for (let i = 0; i < 7; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 10), brass)
      ring.rotation.y = Math.PI / 2
      ring.position.set(curtain.position.x - curtainW / 2 + 0.08 + i * (curtainW - 0.16) / 6, halfH + 0.25, 0.4)
      group.add(ring)
    }
  }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, WINDOW_WIDTH + 1, 10), brass)
  rod.rotation.z = Math.PI / 2
  rod.position.set(0, halfH + 0.26, 0.4)
  group.add(rod)
  for (const side of [-1, 1]) {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 6), brass)
    finial.position.set(side * (WINDOW_WIDTH + 1) / 2, halfH + 0.26, 0.4)
    group.add(finial)
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(WINDOW_WIDTH + 0.36, 0.085, 0.34), sillMat)
  sill.position.set(0, -halfH - 0.05, 0.12)
  sill.receiveShadow = true
  group.add(sill)
  return group
}

export function addWindows(parent: THREE.Group, placements: WindowPlacement[]): void {
  for (const p of placements) {
    const window = createWindow()
    window.position.set(p.x, WINDOW_CENTER_Y, p.z)
    window.rotation.y = p.rotY
    parent.add(window)
  }
}
