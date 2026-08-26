import * as THREE from 'three'
import type { RoomBounds } from '../entities/Player'

const ROOM_SIZE = 10
const WALL_HEIGHT = 3.2
const WALL_THICKNESS = 0.2

export class LevelManager {
  readonly bounds: RoomBounds = {
    minX: -ROOM_SIZE / 2,
    maxX: ROOM_SIZE / 2,
    minZ: -ROOM_SIZE / 2,
    maxZ: ROOM_SIZE / 2,
  }

  readonly root = new THREE.Group()

  constructor() {
    this.buildRoom()
    this.addLights()
  }

  private buildRoom(): void {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SIZE, 0.15, ROOM_SIZE),
      new THREE.MeshStandardMaterial({ color: 0xb59a7a, roughness: 0.9 }),
    )
    floor.position.y = -0.075
    floor.receiveShadow = true
    this.root.add(floor)

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.95 })
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

    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SIZE, 0.1, ROOM_SIZE),
      new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 1 }),
    )
    ceiling.position.y = WALL_HEIGHT
    this.root.add(ceiling)
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0xfff2e0, 0.55)
    this.root.add(ambient)

    const sun = new THREE.DirectionalLight(0xffe6c8, 1.1)
    sun.position.set(3, 6, 2)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 20
    sun.shadow.camera.left = -6
    sun.shadow.camera.right = 6
    sun.shadow.camera.top = 6
    sun.shadow.camera.bottom = -6
    this.root.add(sun)

    const lamp = new THREE.PointLight(0xffd9a8, 0.7, 14)
    lamp.position.set(-2, 2.6, -2)
    this.root.add(lamp)
  }
}
