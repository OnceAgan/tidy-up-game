import * as THREE from 'three'
import type { RoomBounds } from '../entities/Player'
import { Cassette } from '../entities/Cassette'
import { placeCassetteOnFloor, settleFloorCassettes, type PlacedCassette } from '../entities/cassettePlacement'
import { Shelf } from '../entities/Shelf'
import type { ShelfSlot } from '../entities/ShelfSlot'
import { buildCassettePool } from '../data/cassetteCatalog'
import {
  createCeilingTexture,
  createWallpaperTexture,
  createWoodFloorTexture,
} from '../env/textures'
import { buildRoomDecor } from '../env/RoomDecor'
import type { BoxCollider } from '../core/CollisionWorld'

const ROOM_WIDTH = 10
const ROOM_DEPTH = 20
const WALL_HEIGHT = 3.2
const WALL_THICKNESS = 0.2
const SHELF_INSET_W = 4.55
/** Север/юг: боевики и sci-fi ближе к стене */
const SHELF_INSET_D = 9.72
const SHELF_GENRE_IDS = [0, 1, 2, 3] as const

export class LevelManager {
  readonly bounds: RoomBounds = {
    minX: -ROOM_WIDTH / 2,
    maxX: ROOM_WIDTH / 2,
    minZ: -ROOM_DEPTH / 2,
    maxZ: ROOM_DEPTH / 2,
  }

  readonly root = new THREE.Group()
  readonly cassettes: Cassette[] = []
  readonly slots: ShelfSlot[] = []
  readonly shelves: Shelf[] = []
  readonly colliders: BoxCollider[] = []

  constructor() {
    this.buildRoom()
    this.addLights()
    const decorColliders = buildRoomDecor(this.root, ROOM_WIDTH, ROOM_DEPTH, WALL_HEIGHT)
    this.colliders.push(...decorColliders)
    this.buildShelves()
    this.buildColliders()
    this.spawnCassettes()
  }

  private buildRoom(): void {
    const floorTex = createWoodFloorTexture()
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_WIDTH, 0.15, ROOM_DEPTH),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.62,
        metalness: 0.02,
      }),
    )
    floor.position.y = -0.075
    floor.receiveShadow = true
    this.root.add(floor)

    const wallTex = createWallpaperTexture()
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.9,
    })
    const halfW = ROOM_WIDTH / 2
    const halfD = ROOM_DEPTH / 2

    const walls: Array<{ w: number; h: number; d: number; x: number; y: number; z: number }> = [
      { w: ROOM_WIDTH, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, y: WALL_HEIGHT / 2, z: -halfD },
      { w: ROOM_WIDTH, h: WALL_HEIGHT, d: WALL_THICKNESS, x: 0, y: WALL_HEIGHT / 2, z: halfD },
      { w: WALL_THICKNESS, h: WALL_HEIGHT, d: ROOM_DEPTH, x: -halfW, y: WALL_HEIGHT / 2, z: 0 },
      { w: WALL_THICKNESS, h: WALL_HEIGHT, d: ROOM_DEPTH, x: halfW, y: WALL_HEIGHT / 2, z: 0 },
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
      new THREE.BoxGeometry(ROOM_WIDTH, 0.1, ROOM_DEPTH),
      new THREE.MeshStandardMaterial({
        map: ceilingTex,
        roughness: 0.95,
      }),
    )
    ceiling.position.y = WALL_HEIGHT
    this.root.add(ceiling)
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0xfff2e0, 0.45)
    this.root.add(ambient)

    const fill = new THREE.DirectionalLight(0xffe6c8, 0.5)
    fill.position.set(4, 7, 3)
    fill.castShadow = true
    fill.shadow.mapSize.set(1536, 1536)
    fill.shadow.camera.near = 0.5
    fill.shadow.camera.far = 35
    fill.shadow.camera.left = -9
    fill.shadow.camera.right = 9
    fill.shadow.camera.top = 14
    fill.shadow.camera.bottom = -14
    this.root.add(fill)
  }

  private buildShelves(): void {
    const placements: Array<{ genreId: number; x: number; z: number; rot: number }> = [
      { genreId: SHELF_GENRE_IDS[0], x: 0, z: -SHELF_INSET_D, rot: 0 },
      { genreId: SHELF_GENRE_IDS[1], x: 0, z: SHELF_INSET_D, rot: Math.PI },
      { genreId: SHELF_GENRE_IDS[2], x: -SHELF_INSET_W, z: 0, rot: Math.PI / 2 },
      { genreId: SHELF_GENRE_IDS[3], x: SHELF_INSET_W, z: 0, rot: -Math.PI / 2 },
    ]

    for (const p of placements) {
      const shelf = new Shelf(p.genreId, p.x, p.z, p.rot)
      this.shelves.push(shelf)
      this.slots.push(...shelf.slots)
      this.root.add(shelf.root)
    }
  }

  private buildColliders(): void {
    for (const shelf of this.shelves) {
      this.colliders.push(shelf.getFootprintCollider())
    }
  }

  private spawnCassettes(): void {
    const pool = buildCassettePool()
    shuffle(pool)

    const spots = scatterSpots(pool.length)
    const placed: PlacedCassette[] = []
    pool.forEach((def, i) => {
      const spot = spots[i]
      const cassette = new Cassette(def.genreId, def.title, def.seriesIndex, def.part)
      placeCassetteOnFloor(cassette.mesh, spot.x, spot.z, spot.ry, placed)
      this.root.add(cassette.mesh)
      this.cassettes.push(cassette)
    })

    settleFloorCassettes(this.cassettes.map((c) => c.mesh))
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
  const maxX = 3.6
  const maxZ = 7.2
  while (spots.length < count) {
    spots.push({
      x: (Math.random() - 0.5) * maxX * 2,
      z: (Math.random() - 0.5) * maxZ * 2,
      ry: Math.random() * Math.PI * 2,
    })
  }
  return spots
}

