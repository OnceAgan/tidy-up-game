import * as THREE from 'three'
import { Interactable } from './Interactable'
import { createCoverTexture, createSpineTexture } from '../env/coverArt'
import { getSharedCassetteGeometry } from './cassetteGeometry'
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

/** Общий материал кромки — один на все кассеты, меньше draw calls */
const EDGE_MATERIAL = new THREE.MeshLambertMaterial({ color: 0xe4ddd4 })

export class Cassette extends Interactable {
  readonly kind = 'cassette' as const
  readonly genreId: number
  readonly colorIndex: number
  readonly title: string
  readonly seriesIndex: number
  readonly part: number
  readonly label: string
  readonly mesh: THREE.Mesh
  private readonly coverMaterial: THREE.MeshLambertMaterial
  private readonly spineMaterial: THREE.MeshLambertMaterial
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

    // Lambert вместо Standard — дешевле при нескольких источниках света
    this.coverMaterial = new THREE.MeshLambertMaterial()

    const coverTex = createCoverTexture(title, genreId, seriesIndex, part, (tex) => {
      this.coverMaterial.map = tex
      this.coverMaterial.needsUpdate = true
    })
    this.coverMaterial.map = coverTex

    const spineTex = createSpineTexture(title, genreId, seriesIndex, part)
    this.spineMaterial = new THREE.MeshLambertMaterial({
      map: spineTex,
      color: 0xffffff,
    })

    // 3 уникальных материала: торец, кромка, обложка (лицо + зад — один материал)
    const materials = [
      this.spineMaterial,
      this.spineMaterial,
      EDGE_MATERIAL,
      EDGE_MATERIAL,
      this.coverMaterial,
      this.coverMaterial,
    ]

    this.mesh = new THREE.Mesh(
      getSharedCassetteGeometry(CASSETTE_SIZE.w, CASSETTE_SIZE.h, CASSETTE_SIZE.d),
      materials,
    )
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
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
