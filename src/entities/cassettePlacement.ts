import * as THREE from 'three'
import { CASSETTE_SIZE } from './Cassette'

const HALF = {
  x: CASSETTE_SIZE.w / 2,
  y: CASSETTE_SIZE.h / 2,
  z: CASSETTE_SIZE.d / 2,
}

const CORNERS = [
  new THREE.Vector3(-1, -1, -1),
  new THREE.Vector3(-1, -1, 1),
  new THREE.Vector3(-1, 1, -1),
  new THREE.Vector3(-1, 1, 1),
  new THREE.Vector3(1, -1, -1),
  new THREE.Vector3(1, -1, 1),
  new THREE.Vector3(1, 1, -1),
  new THREE.Vector3(1, 1, 1),
]

/** Y-центр кассеты, чтобы нижняя точка лежала на полу (y = 0) */
export function floorCenterY(rotation: THREE.Euler, lift = 0.012): number {
  const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z)
  let minY = Infinity
  for (const c of CORNERS) {
    const p = new THREE.Vector3(c.x * HALF.x, c.y * HALF.y, c.z * HALF.z)
    p.applyEuler(euler)
    minY = Math.min(minY, p.y)
  }
  return -minY + lift
}
