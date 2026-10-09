import * as THREE from 'three'
import type { ShelfWoodVariant } from './textures'

let wood: THREE.Texture | undefined

export function applyFurnitureWood(material: THREE.MeshStandardMaterial): void {
  if (!wood) {
    wood = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/furniture-oak-v2.png`)
    wood.colorSpace = THREE.SRGBColorSpace
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping
    wood.anisotropy = 8
  }
  material.map = wood
  material.bumpMap = wood
  material.bumpScale = 0.0015
  material.normalMap = null
  material.metalness = 0
  material.needsUpdate = true
}

/** Metre-based UVs keep the wood grain consistent on thick and thin boards. */
export function projectFurnitureUvs(geometry: THREE.BufferGeometry, variant: ShelfWoodVariant, phase: number): void {
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    let u: number
    let v: number
    if (variant === 'vertical' || variant === 'flat') {
      u = y
      v = Math.abs(normal.getX(i)) > 0.5 ? z : x
    } else if (Math.abs(normal.getY(i)) > 0.5) {
      u = x
      v = z
    } else {
      u = Math.abs(normal.getX(i)) > 0.5 ? z : x
      v = y
    }
    uv.setXY(i, u * 0.8 + phase, v * 1.8 + phase * 0.37)
  }
  uv.needsUpdate = true
}
