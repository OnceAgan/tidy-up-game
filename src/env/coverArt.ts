import * as THREE from 'three'
import { getGenre } from '../data/cassetteCatalog'
import { getCoverImageUrl } from '../data/coverFiles'

function hexToCss(hex: number): string {
  const r = (hex >> 16) & 0xff
  const g = (hex >> 8) & 0xff
  const b = hex & 0xff
  return `rgb(${r},${g},${b})`
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length >= maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

function drawGenreArt(ctx: CanvasRenderingContext2D, genreId: number, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  const genre = getGenre(genreId)
  const bg = ctx.createLinearGradient(x, y, x + w, y + h)
  bg.addColorStop(0, hexToCss(genre.secondary))
  bg.addColorStop(1, hexToCss(genre.accent))
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)

  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#000'
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(x + w * (0.15 + i * 0.14), y + h * 0.3, w * 0.18, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const cx = x + w / 2
  const cy = y + h / 2

  if (genreId === 0) {
    // Боевик: взрыв + машина
    ctx.fillStyle = '#ffcc44'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a) * w * 0.42, cy + Math.sin(a) * h * 0.35)
      ctx.lineWidth = 10
      ctx.strokeStyle = 'rgba(255,220,80,0.9)'
      ctx.stroke()
    }
    ctx.fillStyle = '#1a1a22'
    ctx.fillRect(cx - w * 0.28, cy + h * 0.05, w * 0.56, h * 0.14)
    ctx.fillRect(cx - w * 0.12, cy - h * 0.08, w * 0.24, h * 0.12)
  } else if (genreId === 1) {
    // Sci-fi: планета + звёзды
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 28; i++) {
      const sx = x + Math.random() * w
      const sy = y + Math.random() * h
      ctx.fillRect(sx, sy, 2, 2)
    }
    ctx.fillStyle = '#8ad4ff'
    ctx.beginPath()
    ctx.arc(cx - w * 0.12, cy, w * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.ellipse(cx + w * 0.08, cy, w * 0.34, h * 0.12, 0.4, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#1a2850'
    ctx.beginPath()
    ctx.arc(cx - w * 0.12, cy, w * 0.14, 0, Math.PI * 2)
    ctx.fill()
  } else if (genreId === 2) {
    // Спорт: мяч + кубок
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(x, cy + h * 0.15, w, h * 0.08)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy - h * 0.05, w * 0.2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - w * 0.2, cy - h * 0.05)
    ctx.lineTo(cx + w * 0.2, cy - h * 0.05)
    ctx.moveTo(cx, cy - h * 0.25)
    ctx.lineTo(cx, cy + h * 0.15)
    ctx.stroke()
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.moveTo(cx, cy + h * 0.22)
    ctx.lineTo(cx - w * 0.14, cy + h * 0.02)
    ctx.lineTo(cx + w * 0.14, cy + h * 0.02)
    ctx.closePath()
    ctx.fill()
    ctx.fillRect(cx - w * 0.06, cy + h * 0.22, w * 0.12, h * 0.1)
  } else {
    // Мульт: солнце + облако + звезда
    ctx.fillStyle = '#ffe566'
    ctx.beginPath()
    ctx.arc(cx - w * 0.15, cy - h * 0.12, w * 0.14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(cx + w * 0.1, cy, w * 0.1, 0, Math.PI * 2)
    ctx.arc(cx + w * 0.22, cy - h * 0.02, w * 0.12, 0, Math.PI * 2)
    ctx.arc(cx + w * 0.18, cy + h * 0.08, w * 0.09, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff88cc'
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      const px = cx + w * 0.2 + Math.cos(a) * w * 0.1
      const py = cy + h * 0.2 + Math.sin(a) * h * 0.1
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

const coverTextureCache = new Map<string, { texture: THREE.Texture; ready: boolean }>()
const coverLoadWaiters = new Map<string, Array<(tex: THREE.Texture) => void>>()

function notifyCoverWaiters(key: string, tex: THREE.Texture): void {
  const waiters = coverLoadWaiters.get(key)
  if (waiters) {
    for (const cb of waiters) cb(tex)
    coverLoadWaiters.delete(key)
  }
}

/** Обложка: PNG из public/covers, иначе процедурная заглушка */
export function createCoverTexture(
  title: string,
  genreId: number,
  seriesIndex: number,
  part: number,
  onLoaded?: (tex: THREE.Texture) => void,
): THREE.Texture {
  const key = `${genreId}-${seriesIndex}`
  const entry = coverTextureCache.get(key)

  if (entry?.ready) {
    onLoaded?.(entry.texture)
    return entry.texture
  }

  if (onLoaded) {
    const waiters = coverLoadWaiters.get(key) ?? []
    waiters.push(onLoaded)
    coverLoadWaiters.set(key, waiters)
  }

  if (!entry) {
    const fallback = createProceduralCoverTexture(title, genreId, seriesIndex, part)
    coverTextureCache.set(key, { texture: fallback, ready: false })

    const loader = new THREE.TextureLoader()
    loader.load(
      getCoverImageUrl(genreId, seriesIndex),
      (loaded) => {
        applyCoverTextureSettings(loaded)
        coverTextureCache.set(key, { texture: loaded, ready: true })
        notifyCoverWaiters(key, loaded)
      },
      undefined,
      () => {
        coverTextureCache.set(key, { texture: fallback, ready: true })
        notifyCoverWaiters(key, fallback)
      },
    )
  }

  return coverTextureCache.get(key)!.texture
}

function applyCoverTextureSettings(tex: THREE.Texture): void {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.repeat.set(1, 1)
  tex.offset.set(0, 0)
  tex.center.set(0.5, 0.5)
  tex.needsUpdate = true
}

/** Процедурная заглушка, если PNG ещё не положили */
function createProceduralCoverTexture(
  title: string,
  genreId: number,
  _seriesIndex: number,
  part: number,
): THREE.CanvasTexture {
  const genre = getGenre(genreId)
  const w = 768
  const h = 1152
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0e0c0a'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#f2ece2'
  ctx.fillRect(14, 14, w - 28, h - 28)

  const innerX = 30
  const innerY = 30
  const innerW = w - 60
  const innerH = h - 60

  ctx.fillStyle = hexToCss(genre.accent)
  ctx.fillRect(innerX, innerY, innerW, 130)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 62px Arial Black, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(genre.tag, innerX + innerW / 2, innerY + 65)

  const artY = innerY + 142
  const artH = innerH * 0.5
  drawGenreArt(ctx, genreId, innerX, artY, innerW, artH)

  ctx.fillStyle = 'rgba(0,0,0,0.82)'
  ctx.font = 'bold 148px Arial Black, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(String(part), innerX + innerW - 12, artY + artH - 12)

  const titleY = artY + artH + 28
  ctx.fillStyle = '#111'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  let titleSize = 50
  ctx.font = `bold ${titleSize}px Arial, Helvetica, sans-serif`
  let lines = wrapLines(ctx, title.toUpperCase(), innerW - 24, 3)
  while (lines.some((l) => ctx.measureText(l).width > innerW - 24) && titleSize > 32) {
    titleSize -= 2
    ctx.font = `bold ${titleSize}px Arial, Helvetica, sans-serif`
    lines = wrapLines(ctx, title.toUpperCase(), innerW - 24, 3)
  }
  lines.forEach((line, i) => {
    ctx.fillText(line, innerX + innerW / 2, titleY + i * (titleSize + 10))
  })

  const footY = innerY + innerH - 68
  ctx.fillStyle = hexToCss(genre.accent)
  ctx.fillRect(innerX, footY, innerW, 56)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px Arial, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(genre.name, innerX + innerW / 2, footY + 28)

  // полоска «штрихкод»
  ctx.fillStyle = '#f8f8f8'
  ctx.fillRect(innerX, innerY + innerH - 18, innerW, 14)
  for (let i = 0; i < 48; i++) {
    ctx.fillStyle = i % 3 === 0 ? '#111' : '#333'
    ctx.fillRect(innerX + 8 + i * (innerW / 50), innerY + innerH - 16, 2 + (i % 2), 10)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/** Табличка жанра на стеллаже */
export function createCategoryLabelTexture(label: string, completed = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const padX = 28
  let fontSize = 42
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
  let textW = ctx.measureText(label).width
  const maxW = canvas.width - 40
  while (textW > maxW && fontSize > 24) {
    fontSize -= 2
    ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
    textW = ctx.measureText(label).width
  }
  const pillW = textW + padX * 2
  const pillH = 72
  const x = (canvas.width - pillW) / 2
  const y = (canvas.height - pillH) / 2
  const r = pillH / 2

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  roundRect(ctx, x + 2, y + 3, pillW, pillH, r)
  ctx.fill()

  ctx.fillStyle = completed ? '#5cb85c' : '#f2f0ec'
  ctx.strokeStyle = completed ? '#2d6a2d' : '#2a2a2a'
  ctx.lineWidth = 4
  roundRect(ctx, x, y, pillW, pillH, r)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = completed ? '#ffffff' : '#1a1a1a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

function shortSpineTitle(title: string, maxLen = 20): string {
  const upper = title.toUpperCase()
  if (upper.length <= maxLen) return upper
  return `${upper.slice(0, maxLen - 1)}…`
}

/** Торец кассеты — жанр, название, номер части (видно в стопке) */
const spineTextureCache = new Map<string, THREE.CanvasTexture>()

export function createSpineTexture(
  title: string,
  genreId: number,
  seriesIndex: number,
  part: number,
): THREE.CanvasTexture {
  const key = `${genreId}-${seriesIndex}-${part}`
  const cached = spineTextureCache.get(key)
  if (cached) return cached

  const genre = getGenre(genreId)
  const w = 192
  const h = 480
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, hexToCss(genre.accent))
  bg.addColorStop(1, '#2a1818')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(0, 0, w, 56)

  ctx.fillStyle = '#b8f060'
  ctx.font = 'bold 34px Arial Black, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(genre.tag, w / 2, 28)

  ctx.fillStyle = '#d4ff70'
  ctx.font = 'bold 28px Arial, Helvetica, sans-serif'
  const spineTitle = shortSpineTitle(title)
  const titleLines = wrapLines(ctx, spineTitle, w - 16, 4)
  titleLines.forEach((line, i) => {
    ctx.fillText(line, w / 2, 100 + i * 28)
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 168px Arial Black, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(String(part), w - 6, h - 12)

  const tex = makeTexture(canvas)
  spineTextureCache.set(key, tex)
  return tex
}

/** Задняя сторона кассеты */
export function createBackCoverTexture(title: string, genreId: number, indexInGenre: number): THREE.CanvasTexture {
  const genre = getGenre(genreId)
  const w = 640
  const h = 960
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#2a2622'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e8e0d4'
  ctx.fillRect(14, 14, w - 28, h - 28)

  ctx.fillStyle = hexToCss(genre.accent)
  ctx.globalAlpha = 0.35
  ctx.fillRect(40, 40, w - 80, 120)
  ctx.globalAlpha = 1

  ctx.fillStyle = '#222'
  ctx.font = 'bold 40px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(genre.tag, w / 2, 110)

  ctx.font = 'bold 36px Arial, sans-serif'
  const lines = wrapLines(ctx, title.toUpperCase(), w - 100, 3)
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, 220 + i * 44)
  })

  // декоративный «штрихкод»
  ctx.fillStyle = '#111'
  for (let i = 0; i < 28; i++) {
    const bw = 4 + (i % 3) * 2
    ctx.fillRect(80 + i * 16, h - 200, bw, 90)
  }

  ctx.fillStyle = hexToCss(genre.accent)
  ctx.font = 'bold 80px Arial Black, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(String(indexInGenre), w - 50, h - 60)

  ctx.fillStyle = '#666'
  ctx.font = '22px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('VHS · BACK', w / 2, h - 40)

  return makeTexture(canvas)
}
