import * as THREE from 'three'
import type { RoomBounds } from '../entities/Player'
import { Cassette } from '../entities/Cassette'
import { floorCenterY } from '../entities/cassettePlacement'
import { Shelf } from '../entities/Shelf'
import type { ShelfSlot } from '../entities/ShelfSlot'
import { buildCassettePool } from '../data/cassetteCatalog'
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
const SHELF_GENRE_IDS = [0, 1, 2, 3] as const

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
    const placements: Array<{ genreId: number; x: number; z: number; rot: number }> = [
      { genreId: SHELF_GENRE_IDS[0], x: 0, z: -SHELF_DIST, rot: 0 },
      { genreId: SHELF_GENRE_IDS[1], x: 0, z: SHELF_DIST, rot: Math.PI },
      { genreId: SHELF_GENRE_IDS[2], x: -SHELF_DIST, z: 0, rot: Math.PI / 2 },
      { genreId: SHELF_GENRE_IDS[3], x: SHELF_DIST, z: 0, rot: -Math.PI / 2 },
    ]

    for (const p of placements) {
      const shelf = new Shelf(p.genreId, p.x, p.z, p.rot)
      this.shelves.push(shelf)
      this.slots.push(...shelf.slots)
      this.root.add(shelf.root)
    }
  }

  private spawnCassettes(): void {
    const pool = buildCassettePool()
    shuffle(pool)

    const spots = scatterSpots(pool.length)
    pool.forEach((def, i) => {
      const spot = spots[i]
      const rot = new THREE.Euler(spot.rx, spot.ry, spot.rz)
      const cassette = new Cassette(def.genreId, def.title, def.indexInGenre)
      cassette.mesh.position.set(spot.x, floorCenterY(rot), spot.z)
      cassette.mesh.rotation.copy(rot)
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

function scatterSpots(count: number): Array<{ x: number; z: number; rx: number; ry: number; rz: number }> {
  const spots: Array<{ x: number; z: number; rx: number; ry: number; rz: number }> = []
  const minR = 0.6
  const maxR = 3.2
  let guard = 0
  while (spots.length < count && guard < 400) {
    guard++
    const angle = Math.random() * Math.PI * 2
    const r = minR + Math.random() * (maxR - minR)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (spots.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < 0.38)) continue
    spots.push({
      x,
      z,
      rx: -Math.PI / 2 + (Math.random() - 0.5) * 0.35,
      ry: Math.random() * Math.PI * 2,
      rz: (Math.random() - 0.5) * 0.25,
    })
  }
  while (spots.length < count) {
    spots.push({
      x: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
      rx: -Math.PI / 2 + (Math.random() - 0.5) * 0.35,
      ry: Math.random() * Math.PI * 2,
      rz: (Math.random() - 0.5) * 0.25,
    })
  }
  return spots
}
