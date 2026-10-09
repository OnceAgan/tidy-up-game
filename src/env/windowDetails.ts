import * as THREE from 'three'

let linen: THREE.CanvasTexture | undefined
let timber: THREE.CanvasTexture | undefined

export function getLinenTexture(): THREE.CanvasTexture {
  if (linen) return linen
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#d9d1bd'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 256; i += 2) {
    ctx.fillStyle = i % 6 === 0 ? '#b9b29f' : '#e7dfcd'
    ctx.fillRect(i, 0, 1, 256)
    ctx.fillStyle = i % 8 === 0 ? 'rgba(95,83,63,0.16)' : 'rgba(255,255,240,0.22)'
    ctx.fillRect(0, i, 256, 1)
  }
  linen = new THREE.CanvasTexture(canvas)
  linen.colorSpace = THREE.SRGBColorSpace
  linen.wrapS = linen.wrapT = THREE.RepeatWrapping
  linen.repeat.set(3, 10)
  linen.anisotropy = 4
  return linen
}

export function getWindowWoodTexture(): THREE.CanvasTexture {
  if (timber) return timber
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f0e8d7'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 160; i++) {
    const y = i * 1.6
    ctx.strokeStyle = `rgba(115,91,61,${0.025 + (i % 5) * 0.009})`
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(70, y + Math.sin(i) * 4, 170, y - 3, 256, y + 1)
    ctx.stroke()
  }
  timber = new THREE.CanvasTexture(canvas)
  timber.colorSpace = THREE.SRGBColorSpace
  timber.anisotropy = 4
  return timber
}
