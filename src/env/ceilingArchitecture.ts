import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Shallow plaster tray and stepped cornice; shared geometry keeps draw calls low. */
export function addCeilingArchitecture(parent: THREE.Group, width: number, depth: number, height: number): void {
  const plaster: THREE.BufferGeometry[] = []
  const trim: THREE.BufferGeometry[] = []
  const box = (list: THREE.BufferGeometry[], w: number, h: number, d: number, x: number, y: number, z: number) => {
    const geometry = new THREE.BoxGeometry(w, h, d)
    geometry.translate(x, y, z)
    list.push(geometry)
  }
  const ring = (list: THREE.BufferGeometry[], w: number, d: number, band: number, h: number, y: number) => {
    box(list, w, h, band, 0, y, -(d - band) / 2)
    box(list, w, h, band, 0, y, (d - band) / 2)
    box(list, band, h, d - band * 2, -(w - band) / 2, y, 0)
    box(list, band, h, d - band * 2, (w - band) / 2, y, 0)
  }
  ring(plaster, width, depth, 0.4, 0.12, height - 0.11)
  ring(trim, width - 0.06, depth - 0.06, 0.11, 0.06, height - 0.2)
  ring(trim, width - 0.55, depth - 0.55, 0.055, 0.035, height - 0.18)
  ring(trim, width - 1.3, depth - 1.3, 0.055, 0.035, height - 0.065)
  for (const [x, z] of [[0, 0], [-2.8, -5.5], [2.8, 5.5]]) {
    const medallion = new THREE.CylinderGeometry(0.27, 0.29, 0.025, 32)
    medallion.translate(x, height - 0.0625, z)
    trim.push(medallion)
  }
  for (const [parts, color] of [[plaster, 0xe8e2d7], [trim, 0xf7f2e8]] as const) {
    const geometry = mergeGeometries(parts)
    if (geometry) {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.93 }))
      mesh.receiveShadow = true
      parent.add(mesh)
    }
    for (const part of parts) part.dispose()
  }
}
