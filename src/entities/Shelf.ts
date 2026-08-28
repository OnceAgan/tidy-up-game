import * as THREE from 'three'
import { ShelfSlot } from './ShelfSlot'
import { createFurnitureWoodTexture } from '../env/textures'
import { createCategoryLabelTexture } from '../env/coverArt'
import { getGenre } from '../data/cassetteCatalog'

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
    this.buildCategoryLabel()
  }

  private buildFrame(): void {
    const woodTex = createFurnitureWoodTexture()
    const wood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xf0e6d8,
      roughness: 0.68,
    })
    const trim = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0xd8cfc2,
      roughness: 0.75,
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

    add(0.08, 1.65, 0.36, -0.85, 0.95, 0)
    add(0.08, 1.65, 0.36, 0.85, 0.95, 0)
    add(0.03, 1.6, 0.02, -0.8, 0.95, 0.18, trim)
    add(0.03, 1.6, 0.02, 0.8, 0.95, 0.18, trim)

    add(1.82, 0.1, 0.38, 0, 0.12, 0.01)
    add(1.68, 0.03, 0.02, 0, 0.18, 0.17, trim)

    add(1.82, 0.07, 0.38, 0, 1.78, 0)
    add(1.88, 0.04, 0.42, 0, 1.84, 0.01)
    add(1.8, 0.025, 0.02, 0, 1.74, 0.19, trim)

    add(1.65, 1.5, 0.05, 0, 0.98, -0.14, interior)

    for (const y of [0.36, 0.78, 1.32]) {
      add(1.65, 0.045, 0.3, 0, y, 0.02, wood)
      add(1.65, 0.03, 0.025, 0, y + 0.02, 0.17, trim)
    }

    for (const x of [-0.24, 0.24]) {
      add(0.03, 1.05, 0.28, x, 0.86, 0.02, trim)
    }

    add(1.7, 0.14, 0.02, 0, 1.9, 0.19, interior)
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
    const tex = createCategoryLabelTexture(genre.name)

    const labelW = 1.35
    const labelH = 0.22
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(labelW, labelH),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      }),
    )
    label.position.set(0, 1.96, 0.21)
    this.root.add(label)
  }
}
