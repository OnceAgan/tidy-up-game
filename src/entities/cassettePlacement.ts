import * as THREE from 'three'
import { CASSETTE_SIZE } from './Cassette'
import { PARTS_PER_SERIES } from '../data/cassetteCatalog'

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

/** Поворот на полке: торец к игроку */
export const SHELF_CASSETTE_ROT = new THREE.Euler(0, Math.PI / 2, 0)

const SHELF_PACK_STEP = CASSETTE_SIZE.d * 1.1

/** Локальная позиция кассеты внутри ячейки полки (часть 1…5) */
export function shelfLocalPose(part: number): { position: THREE.Vector3; rotation: THREE.Euler } {
  const center = (PARTS_PER_SERIES - 1) / 2
  const x = (part - 1 - center) * SHELF_PACK_STEP
  return {
    position: new THREE.Vector3(x, 0, CASSETTE_SIZE.w * 0.5 - CASSETTE_SIZE.d * 0.55),
    rotation: SHELF_CASSETTE_ROT.clone(),
  }
}

/** Ширина зоны raycast для ячейки с 5 кассетами */
export function shelfSectionWidth(): number {
  return SHELF_PACK_STEP * (PARTS_PER_SERIES - 1) + CASSETTE_SIZE.d + 0.04
}
