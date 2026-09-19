import * as THREE from 'three'

export const WINDOW_WIDTH = 1.85
export const WINDOW_HEIGHT = WINDOW_WIDTH * (875 / 1024)
export const WINDOW_CENTER_Y = 1.62

export const WINDOW_OPENING = {
  bottomY: WINDOW_CENTER_Y - WINDOW_HEIGHT / 2,
  topY: WINDOW_CENTER_Y + WINDOW_HEIGHT / 2,
  width: WINDOW_WIDTH,
} as const

type WallOpening = {
  center: number
  width: number
  bottomY: number
  topY: number
}

function addWallBox(
  parent: THREE.Group,
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): void {
  if (w <= 0.001 || h <= 0.001) return
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  mesh.receiveShadow = true
  parent.add(mesh)
}

/** Стена вдоль оси X (север / юг), с опциональным проёмом под окно */
function buildWallAlongX(
  parent: THREE.Group,
  material: THREE.Material,
  z: number,
  halfSpan: number,
  wallHeight: number,
  thickness: number,
  opening?: WallOpening,
): void {
  if (!opening) {
    addWallBox(parent, material, halfSpan * 2, wallHeight, thickness, 0, wallHeight / 2, z)
    return
  }

  const left = opening.center - opening.width / 2
  const right = opening.center + opening.width / 2
  const openingH = opening.topY - opening.bottomY
  const openingCy = opening.bottomY + openingH / 2

  addWallBox(parent, material, halfSpan * 2, opening.bottomY, thickness, 0, opening.bottomY / 2, z)

  const topH = wallHeight - opening.topY
  addWallBox(parent, material, halfSpan * 2, topH, thickness, 0, opening.topY + topH / 2, z)

  const leftW = left - -halfSpan
  addWallBox(parent, material, leftW, openingH, thickness, -halfSpan + leftW / 2, openingCy, z)

  const rightW = halfSpan - right
  addWallBox(parent, material, rightW, openingH, thickness, halfSpan - rightW / 2, openingCy, z)
}

/** Стена вдоль оси Z (запад / восток) */
function buildWallAlongZ(
  parent: THREE.Group,
  material: THREE.Material,
  x: number,
  halfSpan: number,
  wallHeight: number,
  thickness: number,
): void {
  addWallBox(parent, material, thickness, wallHeight, halfSpan * 2, x, wallHeight / 2, 0)
}

export type RoomWallWindows = {
  north: { centerX: number }
  south: { centerX: number }
}

/** Четыре стены: на северной и южной — проёмы под окна */
export function buildRoomWalls(
  parent: THREE.Group,
  material: THREE.Material,
  roomWidth: number,
  roomDepth: number,
  wallHeight: number,
  wallThickness: number,
  windows: RoomWallWindows,
): void {
  const halfW = roomWidth / 2
  const halfD = roomDepth / 2
  const opening = {
    width: WINDOW_OPENING.width,
    bottomY: WINDOW_OPENING.bottomY,
    topY: WINDOW_OPENING.topY,
  }

  buildWallAlongX(parent, material, -halfD, halfW, wallHeight, wallThickness, {
    ...opening,
    center: windows.north.centerX,
  })
  buildWallAlongX(parent, material, halfD, halfW, wallHeight, wallThickness, {
    ...opening,
    center: windows.south.centerX,
  })
  buildWallAlongZ(parent, material, -halfW, halfD, wallHeight, wallThickness)
  buildWallAlongZ(parent, material, halfW, halfD, wallHeight, wallThickness)
}
