import * as THREE from 'three'
import { CASSETTE_COLORS } from './Cassette'
import { ShelfSlot } from './ShelfSlot'
import { createFurnitureWoodTexture } from '../env/textures'

export class Shelf {
  readonly root = new THREE.Group()
  readonly slots: ShelfSlot[] = []
  readonly colorIndex: number

  constructor(colorIndex: number, x: number, z: number, rotationY: number) {
    this.colorIndex = colorIndex
    this.root.position.set(x, 0, z)
    this.root.rotation.y = rotationY
    this.buildFrame()
    this.buildSlots()
    this.buildColorMarker()
  }

  private buildFrame(): void {
    const woodTex = createFurnitureWoodTexture()
    const wood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xffffff,
      roughness: 0.72,
    })
    const darkWood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xb0a090,
      roughness: 0.8,
    })

    const add = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material = wood,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      mesh.position.set(x, y, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.root.add(mesh)
      return mesh
    }

    // боковины с лёгким «профилем»
    add(0.08, 1.5, 0.32, -0.8, 0.88, 0)
    add(0.08, 1.5, 0.32, 0.8, 0.88, 0)
    add(0.03, 1.45, 0.02, -0.75, 0.88, 0.16, darkWood)
    add(0.03, 1.45, 0.02, 0.75, 0.88, 0.16, darkWood)

    // цоколь
    add(1.72, 0.1, 0.34, 0, 0.12, 0.01)
    add(1.68, 0.03, 0.02, 0, 0.18, 0.17, darkWood)

    // верхняя крышка + карниз
    add(1.72, 0.07, 0.34, 0, 1.62, 0)
    add(1.78, 0.04, 0.38, 0, 1.68, 0.01)
    add(1.7, 0.025, 0.02, 0, 1.58, 0.17, darkWood)

    // задняя стенка
    add(1.55, 1.35, 0.05, 0, 0.9, -0.13, darkWood)

    // полки с передней кромкой (позиции рядов слотов те же: 0.45 и 0.95)
    for (const y of [0.32, 0.7, 1.2]) {
      add(1.55, 0.045, 0.28, 0, y, 0.02)
      add(1.55, 0.03, 0.025, 0, y + 0.02, 0.15, darkWood)
    }

    // вертикальные разделители колонок
    for (const x of [-0.225, 0.225]) {
      add(0.03, 0.95, 0.26, x, 0.78, 0.02, darkWood)
    }
  }

  private buildSlots(): void {
    // те же координаты, что раньше — механика не меняется
    const colXs = [-0.45, 0, 0.45]
    const rowYs = [0.45, 0.95]
    for (const y of rowYs) {
      for (const x of colXs) {
        const slot = new ShelfSlot(this.colorIndex)
        slot.mesh.position.set(x, y, 0.02)
        this.root.add(slot.mesh)
        this.slots.push(slot)
      }
    }
  }

  private buildColorMarker(): void {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.05, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x3a3028,
        roughness: 0.6,
      }),
    )
    plate.position.set(0, 1.74, 0.02)
    plate.castShadow = true
    this.root.add(plate)

    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.16),
      new THREE.MeshStandardMaterial({
        color: CASSETTE_COLORS[this.colorIndex],
        roughness: 0.4,
        metalness: 0.1,
        emissive: CASSETTE_COLORS[this.colorIndex],
        emissiveIntensity: 0.2,
      }),
    )
    marker.position.set(0, 1.78, 0.02)
    this.root.add(marker)
  }
}
