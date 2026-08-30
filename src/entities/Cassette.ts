import * as THREE from 'three'
import { Interactable } from './Interactable'
import { createCoverTexture, createSpineTexture } from '../env/coverArt'
import { createCassetteGeometry } from './cassetteGeometry'
import { formatCassetteLabel } from '../data/cassetteCatalog'

export const CASSETTE_SIZE = { w: 0.32, h: 0.51, d: 0.068 }

export const CASSETTE_COLORS = [
  0xc45c4a,
  0x3d5a80,
  0x4a7c59,
  0xc9a227,
  0x8b5a9e,
  0xd4783a,
] as const

export class Cassette extends Interactable {
  readonly kind = 'cassette' as const
  readonly genreId: number
  readonly colorIndex: number
  readonly title: string
  readonly seriesIndex: number
  readonly part: number
  readonly label: string
  readonly mesh: THREE.Mesh
  private readonly coverMaterial: THREE.MeshStandardMaterial
  private readonly spineMaterial: THREE.MeshStandardMaterial
  private readonly backMaterial: THREE.MeshStandardMaterial
  private readonly materials: THREE.MeshStandardMaterial[]
  held = false
  placed = false

  constructor(genreId: number, title: string, seriesIndex: number, part: number) {
    super()
    this.genreId = genreId
    this.colorIndex = genreId
    this.title = title
    this.seriesIndex = seriesIndex
    this.part = part
    this.label = formatCassetteLabel(title, part)

    this.coverMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.02,
    })
    this.backMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.02,
    })

    const coverTex = createCoverTexture(title, genreId, seriesIndex, part, (tex) => {
      this.coverMaterial.map = tex
      this.backMaterial.map = tex
      this.coverMaterial.needsUpdate = true
      this.backMaterial.needsUpdate = true
    })
    this.coverMaterial.map = coverTex
    this.backMaterial.map = coverTex

    const spineTex = createSpineTexture(title, genreId, seriesIndex, part)

    this.spineMaterial = new THREE.MeshStandardMaterial({
      map: spineTex,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.02,
    })

    const top = new THREE.MeshStandardMaterial({
      color: 0xe8e2d6,
      roughness: 0.55,
    })
    const bottom = new THREE.MeshStandardMaterial({
      color: 0xe0dace,
      roughness: 0.6,
    })

    // +X, -X, +Y, -Y, +Z (лицевая), -Z (задняя)
    this.materials = [this.spineMaterial, this.spineMaterial, top, bottom, this.coverMaterial, this.backMaterial]

    this.mesh = new THREE.Mesh(
      createCassetteGeometry(CASSETTE_SIZE.w, CASSETTE_SIZE.h, CASSETTE_SIZE.d),
      this.materials,
    )
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData.interactable = this
  }

  protected applyHighlight(on: boolean): void {
    const emissive = on ? 0x443322 : 0x000000
    const intensity = on ? 0.35 : 0
    this.coverMaterial.emissive.setHex(emissive)
    this.coverMaterial.emissiveIntensity = intensity
    this.spineMaterial.emissive.setHex(on ? 0x222211 : 0x000000)
    this.spineMaterial.emissiveIntensity = on ? 0.25 : 0
  }
}

/** Поворот в руках: торец смотрит на камеру */
export const HOLD_CASSETTE_ROT = new THREE.Euler(0, -Math.PI / 2, 0)
