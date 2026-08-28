import * as THREE from 'three'

/** Бокс кассеты с UV на лицевой/задней грани на всю площадь */
export function createCassetteGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w, h, d)
  const uv = geo.attributes.uv as THREE.BufferAttribute

  // +Z (лицо) и -Z (зад): растягиваем текстуру на всю грань
  for (const face of [4, 5]) {
    const base = face * 4
    const uvs = [
      [0, 1],
      [1, 1],
      [0, 0],
      [1, 0],
    ]
    for (let v = 0; v < 4; v++) {
      const i = (base + v) * 2
      uv.array[i] = uvs[v][0]
      uv.array[i + 1] = uvs[v][1]
    }
  }

  uv.needsUpdate = true
  return geo
}
