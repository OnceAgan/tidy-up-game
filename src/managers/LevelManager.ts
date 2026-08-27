import * as THREE from 'three'
import type { RoomBounds } from '../entities/Player'
import { Cassette } from '../entities/Cassette'
import { Shelf } from '../entities/Shelf'
import type { ShelfSlot } from '../entities/ShelfSlot'
import {
  createCeilingTexture,
  createWallpaperTexture,
  createWoodFloorTexture,
} from '../env/textures'
import { buildRoomDecor } from '../env/RoomDecor'

const ROOM_SIZE = 10
const WALL_HEIGHT = 3.2
const WALL_THICKNESS = 0.2
const SHELF_DIST = 4.55
const SHELF_COLOR_INDICES = [0, 1, 2, 3] as const
const BOOKS_PER_COLOR = 6

export class LevelManager {
  readonly bounds: RoomBounds = {
    minX: -ROOM_SIZE / 2,
    maxX: ROOM_SIZE / 2,
    minZ: -ROOM_SIZE / 2,
    maxZ: ROOM_SIZE / 2,
  }

  readonly root = new THREE.Group()
  readonly cassettes: Cassette[] = []
  readonly slots: ShelfSlot[] = []
  readonly shelves: Shelf[] = []

  constructor() {
    this.buildRoom()
    this.addLights()
    buildRoomDecor(this.root, ROOM_SIZE, WALL_HEIGHT)
    this.buildShelves()
    this.spawnCassettes()
  }

  private buildRoom(): void {
    const floorTex = createWoodFloorTexture()
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SIZE, 0.15, ROOM_SIZE),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.65,
        metalness: 0.02,
      }),
    )
    floor.position.y = -0.075
    floor.receiveShadow = true
    this.root.add(floor)

    const wallTex = createWallpaperTexture()
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.92,
    })
    const half = ROOM_SIZE / 2

    const walls: Array<{ w: number; h: number; d: number; x: number; y: number; z: number }> = [
      { w: ROOM_SIZE, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, y: WALL_HEIGHT / 2, z: -half },
      { w: ROOM_SIZE, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, y: WALL_HEIGHT / 2, z: half },
      { w: WALL_THICKNESS, h: WALL_HEIGHT, d: ROOM_SIZE, x: -half, y: WALL_HEIGHT / 2, z: 0 },
      { w: WALL_THICKNESS, h: WALL_HEIGHT, d: ROOM_SIZE, x: half, y: WALL_HEIGHT / 2, z: 0 },
    ]

    for (const w of walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), wallMat)
      mesh.position.set(w.x, w.y, w.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.root.add(mesh)
    }

    const ceilingTex = createCeilingTexture()
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SIZE, 0.1, ROOM_SIZE),
      new THREE.MeshStandardMaterial({
        map: ceilingTex,
        roughness: 0.95,
      }),
    )
    ceiling.position.y = WALL_HEIGHT
    this.root.add(ceiling)
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0xfff2e0, 0.4)
    this.root.add(ambient)

    const fill = new THREE.DirectionalLight(0xffe6c8, 0.45)
    fill.position.set(3, 6, 2)
    fill.castShadow = true
    fill.shadow.mapSize.set(1024, 1024)
    fill.shadow.camera.near = 0.5
    fill.shadow.camera.far = 20
    fill.shadow.camera.left = -7
    fill.shadow.camera.right = 7
    fill.shadow.camera.top = 7
    fill.shadow.camera.bottom = -7
    this.root.add(fill)
  }

  private buildShelves(): void {
    const placements: Array<{ colorIndex: number; x: number; z: number; rot: number }> = [
      { colorIndex: SHELF_COLOR_INDICES[0], x: 0, z: -SHELF_DIST, rot: 0 },
      { colorIndex: SHELF_COLOR_INDICES[1], x: 0, z: SHELF_DIST, rot: Math.PI },
      { colorIndex: SHELF_COLOR_INDICES[2], x: -SHELF_DIST, z: 0, rot: Math.PI / 2 },
      { colorIndex: SHELF_COLOR_INDICES[3], x: SHELF_DIST, z: 0, rot: -Math.PI / 2 },
    ]

    for (const p of placements) {
      const shelf = new Shelf(p.colorIndex, p.x, p.z, p.rot)
      this.shelves.push(shelf)
      this.slots.push(...shelf.slots)
      this.root.add(shelf.root)
    }
  }

  private spawnCassettes(): void {
    const colorBag: number[] = []
    for (const colorIndex of SHELF_COLOR_INDICES) {
      for (let i = 0; i < BOOKS_PER_COLOR; i++) {
        colorBag.push(colorIndex)
      }
    }
    shuffle(colorBag)

    const spots = scatterSpots(colorBag.length)
    colorBag.forEach((colorIndex, i) => {
      const spot = spots[i]
      const cassette = new Cassette(colorIndex)
      cassette.mesh.position.set(spot.x, 0.095, spot.z)
      cassette.mesh.rotation.y = spot.ry
      this.root.add(cassette.mesh)
      this.cassettes.push(cassette)
    })
  }
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function scatterSpots(count: number): Array<{ x: number; z: number; ry: number }> {
  const spots: Array<{ x: number; z: number; ry: number }> = []
  const minR = 0.6
  const maxR = 3.2
  let guard = 0
  while (spots.length < count && guard < 400) {
    guard++
    const angle = Math.random() * Math.PI * 2
    const r = minR + Math.random() * (maxR - minR)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (spots.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < 0.22)) continue
    spots.push({ x, z, ry: Math.random() * Math.PI * 2 })
  }
  while (spots.length < count) {
    spots.push({
      x: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
      ry: Math.random() * Math.PI * 2,
    })
  }
  return spots
}
