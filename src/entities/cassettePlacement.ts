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

const FLOOR_LIFT = 0.012
const STACK_GAP = 0.003
/** Минимальное пересечение по XZ, чтобы считать кассету «лежащей сверху» */
const STACK_OVERLAP_INSET = 0.06
const SETTLE_ITERATIONS = 10

const _axisY = new THREE.Vector3(0, 1, 0)
const _axisX = new THREE.Vector3(1, 0, 0)

export type PlacedCassette = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  topY: number
}

/** Кватернион: сначала кладём плашмя (X −90°), затем разворот вокруг мировой Y */
export function flatFloorQuaternion(yaw: number): THREE.Quaternion {
  const lay = new THREE.Quaternion().setFromAxisAngle(_axisX, -Math.PI / 2)
  const spin = new THREE.Quaternion().setFromAxisAngle(_axisY, yaw)
  return spin.multiply(lay)
}

/** Поворот «плашмя» на полу */
export function flatFloorRotation(yaw: number): THREE.Euler {
  const e = new THREE.Euler()
  e.setFromQuaternion(flatFloorQuaternion(yaw), 'YXZ')
  return e
}

function worldBounds(
  x: number,
  y: number,
  z: number,
  quaternion: THREE.Quaternion,
): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const c of CORNERS) {
    const p = new THREE.Vector3(c.x * HALF.x, c.y * HALF.y, c.z * HALF.z)
    p.applyQuaternion(quaternion)
    p.x += x
    p.y += y
    p.z += z
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minZ = Math.min(minZ, p.z)
    maxZ = Math.max(maxZ, p.z)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  return { minX, maxX, minZ, maxZ, minY, maxY }
}

function xzOverlap(a: PlacedCassette, bMinX: number, bMaxX: number, bMinZ: number, bMaxZ: number): boolean {
  const inset = STACK_OVERLAP_INSET
  return (
    a.minX + inset < bMaxX - inset &&
    a.maxX - inset > bMinX + inset &&
    a.minZ + inset < bMaxZ - inset &&
    a.maxZ - inset > bMinZ + inset
  )
}

function centerYForBottom(quaternion: THREE.Quaternion, bottomY: number): number {
  let minRelY = Infinity
  for (const c of CORNERS) {
    const p = new THREE.Vector3(c.x * HALF.x, c.y * HALF.y, c.z * HALF.z)
    p.applyQuaternion(quaternion)
    minRelY = Math.min(minRelY, p.y)
  }
  return bottomY - minRelY
}

export function floorYawFromMesh(mesh: THREE.Mesh): number {
  const e = new THREE.Euler()
  e.setFromQuaternion(mesh.quaternion, 'YXZ')
  return e.y
}

export function footprintFromMesh(mesh: THREE.Mesh): PlacedCassette {
  mesh.updateWorldMatrix(true, false)
  const worldPos = new THREE.Vector3()
  const worldQuat = new THREE.Quaternion()
  mesh.matrixWorld.decompose(worldPos, worldQuat, new THREE.Vector3())
  const b = worldBounds(worldPos.x, worldPos.y, worldPos.z, worldQuat)
  return { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ, topY: b.maxY }
}

export function computeFloorPlacement(
  x: number,
  z: number,
  yaw: number,
  placed: PlacedCassette[],
): { y: number; quaternion: THREE.Quaternion; footprint: PlacedCassette } {
  const quaternion = flatFloorQuaternion(yaw)
  let bottomY = FLOOR_LIFT

  for (let i = 0; i < SETTLE_ITERATIONS; i++) {
    const cy = centerYForBottom(quaternion, bottomY)
    const bounds = worldBounds(x, cy, z, quaternion)
    let nextBottom = FLOOR_LIFT

    for (const p of placed) {
      if (xzOverlap(p, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ)) {
        nextBottom = Math.max(nextBottom, p.topY + STACK_GAP)
      }
    }

    if (Math.abs(nextBottom - bottomY) < 0.0001) break
    bottomY = nextBottom
  }

  const y = centerYForBottom(quaternion, bottomY)
  const bounds = worldBounds(x, y, z, quaternion)
  const footprint = {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    topY: bounds.maxY,
  }
  return { y, quaternion, footprint }
}

/** Y-центр кассеты, чтобы нижняя точка лежала на полу (y = 0) */
export function floorCenterY(rotation: THREE.Euler, lift = FLOOR_LIFT): number {
  const q = new THREE.Quaternion().setFromEuler(rotation)
  return centerYForBottom(q, lift)
}

/** Кладёт кассету плашмя на пол или на верх уже лежащих */
export function placeCassetteOnFloor(
  mesh: THREE.Mesh,
  x: number,
  z: number,
  yaw: number,
  placed: PlacedCassette[],
): void {
  const { y, quaternion, footprint } = computeFloorPlacement(x, z, yaw, placed)
  mesh.position.set(x, y, z)
  mesh.quaternion.copy(quaternion)
  placed.push(footprint)
}

/** Пересадить все кассеты на полу — убирает «висящие» после спавна */
export function settleFloorCassettes(meshes: THREE.Mesh[], passes = 3): void {
  const list = [...meshes]
  for (let pass = 0; pass < passes; pass++) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    const placed: PlacedCassette[] = []
    for (const mesh of list) {
      const yaw = floorYawFromMesh(mesh)
      const { y, quaternion, footprint } = computeFloorPlacement(
        mesh.position.x,
        mesh.position.z,
        yaw,
        placed,
      )
      mesh.position.y = y
      mesh.quaternion.copy(quaternion)
      placed.push(footprint)
    }
  }
}

/** Поворот на полке: торец к игроку */
export const SHELF_CASSETTE_ROT = new THREE.Euler(0, Math.PI / 2, 0)

const SHELF_PACK_STEP = CASSETTE_SIZE.d * 1.1

export function shelfLocalPose(part: number): { position: THREE.Vector3; rotation: THREE.Euler } {
  const center = (PARTS_PER_SERIES - 1) / 2
  const x = (part - 1 - center) * SHELF_PACK_STEP
  return {
    position: new THREE.Vector3(x, 0, CASSETTE_SIZE.w * 0.5 - CASSETTE_SIZE.d * 0.55),
    rotation: SHELF_CASSETTE_ROT.clone(),
  }
}

export function shelfSectionWidth(): number {
  return SHELF_PACK_STEP * (PARTS_PER_SERIES - 1) + CASSETTE_SIZE.d + 0.04
}
