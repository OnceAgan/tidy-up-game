import * as THREE from 'three'
import { roomTextureUrl } from '../data/roomTextureFiles'

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function finishTex(tex: THREE.CanvasTexture, repeatX: number, repeatY: number): THREE.CanvasTexture {
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function applyLoadedTexture(
  tex: THREE.Texture,
  repeat?: [number, number],
  clamp = false,
): void {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  if (clamp) {
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
  } else {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    if (repeat) tex.repeat.set(repeat[0], repeat[1])
  }
  tex.needsUpdate = true
}

function loadRoomTexture(
  fileName: string,
  createFallback: () => THREE.CanvasTexture,
  options?: { repeat?: [number, number]; clamp?: boolean; onLoaded?: (tex: THREE.Texture) => void },
): THREE.Texture {
  const fallback = createFallback()
  new THREE.TextureLoader().load(
    roomTextureUrl(fileName),
    (loaded) => {
      applyLoadedTexture(loaded, options?.repeat, options?.clamp)
      options?.onLoaded?.(loaded)
      fallback.dispose()
    },
    undefined,
    () => options?.onLoaded?.(fallback),
  )
  return fallback
}

/** Тёплый паркет с выраженными швами (или `public/textures/floor.jpg`) */
export function createWoodFloorTexture(onLoaded?: (tex: THREE.Texture) => void): THREE.Texture {
  return loadRoomTexture('floor.jpg', createProceduralWoodFloorTexture, {
    repeat: [5, 8],
    onLoaded,
  })
}

function createProceduralWoodFloorTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#b8956a'
  ctx.fillRect(0, 0, size, size)

  const plankH = size / 10
  for (let row = 0; row < 10; row++) {
    const y = row * plankH
    const shade = row % 2 === 0 ? '#a88458' : '#c4a574'
    ctx.fillStyle = shade
    ctx.fillRect(0, y, size, plankH)

    const offset = row % 2 === 0 ? 0 : size / 5
    for (let i = -1; i < 6; i++) {
      const x = offset + i * (size / 5)
      const grad = ctx.createLinearGradient(x - 8, y, x + 8, y)
      grad.addColorStop(0, 'rgba(60,40,22,0)')
      grad.addColorStop(0.5, 'rgba(60,40,22,0.55)')
      grad.addColorStop(1, 'rgba(60,40,22,0)')
      ctx.fillStyle = grad
      ctx.fillRect(x - 8, y, 16, plankH)
    }

    ctx.strokeStyle = 'rgba(55, 35, 18, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, y + plankH)
    ctx.lineTo(size, y + plankH)
    ctx.stroke()

    for (let n = 0; n < 24; n++) {
      ctx.strokeStyle = `rgba(120, 85, 50, ${0.03 + Math.random() * 0.05})`
      ctx.lineWidth = 1
      const yy = y + 6 + Math.random() * (plankH - 12)
      ctx.beginPath()
      ctx.moveTo(0, yy)
      ctx.bezierCurveTo(size * 0.33, yy + 2, size * 0.66, yy - 2, size, yy + 1)
      ctx.stroke()
    }
  }

  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = `rgba(${90 + Math.random() * 40},${60 + Math.random() * 30},30,${Math.random() * 0.04})`
    ctx.fillRect(x, y, 1, 1)
  }

  return finishTex(new THREE.CanvasTexture(canvas), 5, 8)
}

/** Обои с мягким дамасским узором (или `public/textures/wallpaper.jpg`) */
export function createWallpaperTexture(onLoaded?: (tex: THREE.Texture) => void): THREE.Texture {
  return loadRoomTexture('wallpaper.jpg', createProceduralWallpaperTexture, {
    repeat: [8, 4],
    onLoaded,
  })
}

function createProceduralWallpaperTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, size)
  bg.addColorStop(0, '#ebe2d2')
  bg.addColorStop(1, '#ddd0bc')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  for (let x = 0; x < size; x += 64) {
    ctx.fillStyle = 'rgba(200, 175, 145, 0.35)'
    ctx.fillRect(x, 0, 32, size)
  }

  ctx.strokeStyle = 'rgba(150, 125, 100, 0.22)'
  ctx.lineWidth = 1.5
  for (let y = 0; y < size; y += 64) {
    for (let x = 0; x < size; x += 64) {
      ctx.beginPath()
      ctx.arc(x + 32, y + 32, 18, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + 14, y + 32)
      ctx.quadraticCurveTo(x + 32, y + 14, x + 50, y + 32)
      ctx.quadraticCurveTo(x + 32, y + 50, x + 14, y + 32)
      ctx.stroke()
    }
  }

  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 2)
  }

  return finishTex(new THREE.CanvasTexture(canvas), 8, 4)
}

/** Дерево для мебели / стеллажей — одна текстура на всю сцену */
let furnitureWoodTexture: THREE.CanvasTexture | null = null

export function createFurnitureWoodTexture(): THREE.CanvasTexture {
  if (furnitureWoodTexture) return furnitureWoodTexture
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!

  const base = ctx.createLinearGradient(0, 0, size, size)
  base.addColorStop(0, '#6a4f3a')
  base.addColorStop(0.5, '#5a4030')
  base.addColorStop(1, '#4a3428')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 70; i++) {
    const y = (i / 70) * size
    const tone = 45 + (i % 9) * 10
    ctx.strokeStyle = `rgba(${tone + 55},${tone + 25},${tone - 5}, ${0.1 + (i % 4) * 0.05})`
    ctx.lineWidth = 1 + (i % 3) * 0.6
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(size * 0.2, y + 8, size * 0.55, y - 6, size * 0.85, y + 4)
    ctx.bezierCurveTo(size * 0.95, y + 2, size, y, size, y + 1)
    ctx.stroke()
  }

  for (let i = 0; i < 12; i++) {
    const x = (i / 12) * size + Math.random() * 20
    ctx.strokeStyle = `rgba(30, 18, 10, ${0.08 + Math.random() * 0.06})`
    ctx.lineWidth = 2 + Math.random() * 3
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (Math.random() - 0.5) * 30, size)
    ctx.stroke()
  }

  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1)
  }

  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(255,230,200,${Math.random() * 0.04})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1)
  }

  furnitureWoodTexture = finishTex(new THREE.CanvasTexture(canvas), 1, 2)
  return furnitureWoodTexture
}

/** Однотонный потолок с лёгким шумом */
export function createCeilingTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f4efe6'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = `rgba(220, 210, 195, ${Math.random() * 0.15})`
    ctx.fillRect(x, y, 1, 1)
  }
  return finishTex(new THREE.CanvasTexture(canvas), 2, 2)
}

/** Картина для рамки на стене (или `public/textures/picture-N.jpg`, N = 1…5) */
export function createWallPictureTexture(seed: number, onLoaded?: (tex: THREE.Texture) => void): THREE.Texture {
  const index = ((seed % 5) + 5) % 5 + 1
  return loadRoomTexture(`picture-${index}.jpg`, () => createProceduralWallPictureTexture(seed), {
    clamp: true,
    onLoaded,
  })
}

function createProceduralWallPictureTexture(seed: number): THREE.CanvasTexture {
  const w = 256
  const h = 192
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const palettes = [
    ['#3d5a80', '#98c1d9', '#e0fbfc'],
    ['#6b4c3b', '#c9a66b', '#f2e8d5'],
    ['#4a5d23', '#8fbc8f', '#f0f4e8'],
  ]
  const pal = palettes[seed % palettes.length]

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, pal[0])
  grad.addColorStop(1, pal[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = pal[2]
  if (seed % 3 === 0) {
    ctx.beginPath()
    ctx.arc(w * 0.5, h * 0.55, h * 0.28, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal[0]
    ctx.fillRect(w * 0.2, h * 0.72, w * 0.6, h * 0.08)
  } else if (seed % 3 === 1) {
    ctx.fillRect(w * 0.15, h * 0.35, w * 0.7, h * 0.35)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(w * 0.22, h * 0.42, w * 0.2, h * 0.2)
  } else {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + i * 0.05})`
      ctx.fillRect(w * 0.1, h * (0.2 + i * 0.12), w * 0.8, h * 0.06)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
