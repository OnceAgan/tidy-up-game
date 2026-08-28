import * as THREE from 'three'
import { ShelfSlot } from './ShelfSlot'
import { createFurnitureWoodTexture } from '../env/textures'
import { createCategoryLabelTexture } from '../env/coverArt'
import { getGenre } from '../data/cassetteCatalog'
import type { BoxCollider } from '../core/CollisionWorld'

export class Shelf {
  readonly root = new THREE.Group()
  readonly slots: ShelfSlot[] = []
  readonly colorIndex: number
  private labelMaterial: THREE.MeshBasicMaterial | null = null
  private categoryComplete = false

  constructor(colorIndex: number, x: number, z: number, rotationY: number) {
    this.colorIndex = colorIndex
    this.root.position.set(x, 0, z)
    this.root.rotation.y = rotationY
    this.buildFrame()
    this.buildSlots()
    this.buildCategoryLabel()
  }

  private buildFrame(): void {
    const woodTex = createFurnitureWoodTexture()
    const wood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xf0e6d8,
      roughness: 0.65,
    })
    const trim = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xc8b8a4,
      roughness: 0.72,
    })
    const darkWood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x8a7058,
      roughness: 0.78,
    })
    const interior = new THREE.MeshStandardMaterial({
      color: 0xeae4da,
      roughness: 0.92,
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

    // боковины
    add(0.09, 1.68, 0.38, -0.86, 0.96, 0)
    add(0.09, 1.68, 0.38, 0.86, 0.96, 0)
    add(0.035, 1.62, 0.025, -0.81, 0.96, 0.185, trim)
    add(0.035, 1.62, 0.025, 0.81, 0.96, 0.185, trim)

    // цоколь и корона
    add(1.84, 0.11, 0.4, 0, 0.12, 0.01)
    add(1.72, 0.035, 0.025, 0, 0.19, 0.175, trim)
    add(1.9, 0.09, 0.42, 0, 1.8, 0)
    add(1.96, 0.05, 0.44, 0, 1.86, 0.01)
    add(1.88, 0.03, 0.025, 0, 1.76, 0.195, trim)
    // карниз
    add(1.92, 0.06, 0.08, 0, 1.9, 0.2, trim)

    // задняя стенка
    add(1.66, 1.52, 0.06, 0, 0.98, -0.145, interior)

    // полки + передний бортик
    for (const y of [0.36, 0.78, 1.32]) {
      add(1.66, 0.05, 0.32, 0, y, 0.02, wood)
      add(1.66, 0.035, 0.028, 0, y + 0.025, 0.175, trim)
      add(1.64, 0.018, 0.04, 0, y + 0.04, 0.19, darkWood)
    }

    // вертикальные разделители
    for (const x of [-0.24, 0.24]) {
      add(0.035, 1.08, 0.3, x, 0.86, 0.02, trim)
    }

    // верхняя декоративная панель под табличку
    add(1.72, 0.16, 0.025, 0, 1.92, 0.195, interior)
    // боковые накладки
    for (const x of [-0.88, 0.88] as const) {
      add(0.025, 0.35, 0.34, x, 1.72, 0.02, darkWood)
    }
  }

  private buildSlots(): void {
    const colXs = [-0.48, 0, 0.48]
    const rowYs = [0.52, 1.08]
    for (const y of rowYs) {
      for (const x of colXs) {
        const slot = new ShelfSlot(this.colorIndex)
        slot.mesh.position.set(x, y, 0.02)
        this.root.add(slot.mesh)
        this.slots.push(slot)
      }
    }
  }

  private buildCategoryLabel(): void {
    const genre = getGenre(this.colorIndex)
    const tex = createCategoryLabelTexture(genre.name, false)

    const labelW = 1.35
    const labelH = 0.22
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    })
    this.labelMaterial = material
    const label = new THREE.Mesh(new THREE.PlaneGeometry(labelW, labelH), material)
    label.position.set(0, 1.96, 0.21)
    this.root.add(label)
  }

  isCategoryComplete(): boolean {
    return this.slots.every((slot) => slot.cassette !== null)
  }

  refreshCategoryLabel(): void {
    const complete = this.isCategoryComplete()
    if (complete === this.categoryComplete) return
    this.categoryComplete = complete
    if (!this.labelMaterial) return
    const genre = getGenre(this.colorIndex)
    this.labelMaterial.map = createCategoryLabelTexture(genre.name, complete)
    this.labelMaterial.needsUpdate = true
  }

  getFootprintCollider(): BoxCollider {
    const inset = new THREE.Vector3(0, 0, 0.2)
    inset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.root.rotation.y)
    return {
      cx: this.root.position.x + inset.x,
      cz: this.root.position.z + inset.z,
      halfW: 0.94,
      halfD: 0.18,
      rotY: this.root.rotation.y,
    }
  }
}
