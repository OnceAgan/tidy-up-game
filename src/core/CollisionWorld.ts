export type BoxCollider = {
  cx: number
  cz: number
  halfW: number
  halfD: number
  rotY: number
}

function pointHitsBox(px: number, pz: number, radius: number, box: BoxCollider): boolean {
  const dx = px - box.cx
  const dz = pz - box.cz
  const cos = Math.cos(-box.rotY)
  const sin = Math.sin(-box.rotY)
  const lx = dx * cos - dz * sin
  const lz = dx * sin + dz * cos
  return Math.abs(lx) < box.halfW + radius && Math.abs(lz) < box.halfD + radius
}

function hitsAny(px: number, pz: number, radius: number, boxes: readonly BoxCollider[]): boolean {
  return boxes.some((box) => pointHitsBox(px, pz, radius, box))
}

/** Скольжение по осям; если застряли внутри коллайдера — частичный шаг наружу */
export function resolveMovement(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  radius: number,
  boxes: readonly BoxCollider[],
): { x: number; z: number } {
  if (!hitsAny(toX, toZ, radius, boxes)) {
    return { x: toX, z: toZ }
  }
  if (!hitsAny(toX, fromZ, radius, boxes)) {
    return { x: toX, z: fromZ }
  }
  if (!hitsAny(fromX, toZ, radius, boxes)) {
    return { x: fromX, z: toZ }
  }

  if (hitsAny(fromX, fromZ, radius, boxes)) {
    const dx = toX - fromX
    const dz = toZ - fromZ
    for (let f = 1; f >= 0.15; f -= 0.15) {
      const tx = fromX + dx * f
      const tz = fromZ + dz * f
      if (!hitsAny(tx, tz, radius, boxes)) {
        return { x: tx, z: tz }
      }
    }
  }

  return { x: fromX, z: fromZ }
}
