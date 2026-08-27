import * as THREE from 'three'

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

/** Пол из досок / ламинат */
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#c4a574'
  ctx.fillRect(0, 0, size, size)

  const plankH = size / 8
  for (let row = 0; row < 8; row++) {
    const y = row * plankH
    const base = row % 2 === 0 ? '#b8956a' : '#c9ad82'
    ctx.fillStyle = base
    ctx.fillRect(0, y, size, plankH)

    // смещение швов «кирпичиком»
    const offset = row % 2 === 0 ? 0 : size / 4
    ctx.strokeStyle = 'rgba(90, 60, 35, 0.35)'
    ctx.lineWidth = 2
    for (let i = -1; i < 5; i++) {
      const x = offset + i * (size / 4)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + plankH)
      ctx.stroke()
    }

    // горизонтальный шов
    ctx.strokeStyle = 'rgba(70, 45, 25, 0.45)'
    ctx.beginPath()
    ctx.moveTo(0, y + plankH)
    ctx.lineTo(size, y + plankH)
    ctx.stroke()

    // лёгкая текстура волокон
    for (let n = 0; n < 18; n++) {
      ctx.strokeStyle = `rgba(140, 100, 60, ${0.04 + Math.random() * 0.06})`
      ctx.lineWidth = 1
      const yy = y + 4 + Math.random() * (plankH - 8)
      ctx.beginPath()
      ctx.moveTo(0, yy)
      ctx.lineTo(size, yy + (Math.random() - 0.5) * 3)
      ctx.stroke()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 4)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Мягкие обои с тонким узором */
export function createWallpaperTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#e8dcc8'
  ctx.fillRect(0, 0, size, size)

  // вертикальные полосы
  for (let x = 0; x < size; x += 32) {
    ctx.fillStyle = 'rgba(210, 190, 165, 0.45)'
    ctx.fillRect(x, 0, 16, size)
  }

  // мелкий орнамент-ромбики
  ctx.strokeStyle = 'rgba(170, 145, 120, 0.28)'
  ctx.lineWidth = 1
  for (let y = 16; y < size; y += 32) {
    for (let x = 16; x < size; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, y - 6)
      ctx.lineTo(x + 6, y)
      ctx.lineTo(x, y + 6)
      ctx.lineTo(x - 6, y)
      ctx.closePath()
      ctx.stroke()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 3)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Дерево для мебели / стеллажей */
export function createFurnitureWoodTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#6e5342'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * size
    ctx.strokeStyle = `rgba(${80 + (i % 5) * 8}, ${55 + (i % 3) * 6}, ${35}, ${0.15 + (i % 4) * 0.05})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(size * 0.3, y + 4, size * 0.7, y - 4, size, y + 2)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
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
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
