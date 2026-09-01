import * as THREE from 'three'
import type { Shelf } from '../entities/Shelf'

type Bar = { label: string; percent: number; color: string; note: string }

const BAR_COLORS = {
  cassettes: '#e74c3c',
  shelves: '#3498db',
  shadows: '#9b59b6',
  lighting: '#f39c12',
  room: '#2ecc71',
  decor: '#1abc9c',
  cpu: '#95a5a6',
} as const

export class PerfPanel {
  private visible = false
  private readonly root: HTMLDivElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private fps = 60
  private frameMs = 16.7
  private smoothT = 0

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'perf-panel'
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '12px',
      left: '12px',
      zIndex: '100',
      display: 'none',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'rgba(12, 14, 18, 0.88)',
      color: '#eef2f7',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      lineHeight: '1.35',
      boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      userSelect: 'none',
    })

    this.canvas = document.createElement('canvas')
    this.canvas.width = 300
    this.canvas.height = 210
    this.ctx = this.canvas.getContext('2d')!
    this.root.appendChild(this.canvas)

    const hint = document.createElement('div')
    hint.textContent = 'F3 — скрыть'
    hint.style.marginTop = '6px'
    hint.style.opacity = '0.55'
    hint.style.fontSize = '11px'
    this.root.appendChild(hint)

    document.body.appendChild(this.root)

    window.addEventListener('keydown', (e) => {
      if (e.code !== 'F3') return
      e.preventDefault()
      this.visible = !this.visible
      this.root.style.display = this.visible ? 'block' : 'none'
    })
  }

  update(
    dt: number,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    cassetteCount: number,
    shelves: readonly Shelf[],
  ): void {
    if (!this.visible) return

    this.smoothT = Math.min(1, this.smoothT + dt * 4)
    const instantFps = dt > 0 ? 1 / dt : 60
    this.fps += (instantFps - this.fps) * Math.min(1, dt * 8)
    this.frameMs += (dt * 1000 - this.frameMs) * Math.min(1, dt * 8)

    const bars = this.buildBars(scene, renderer, cassetteCount, shelves)
    this.draw(bars, renderer)
  }

  private buildBars(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    cassetteCount: number,
    shelves: readonly Shelf[],
  ): Bar[] {
    let shelfMeshes = 0
    for (const shelf of shelves) {
      shelf.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) shelfMeshes++
      })
    }

    let decorMeshes = 0
    let roomMeshes = 0
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const kind = obj.userData.interactable?.kind
      if (kind === 'cassette' || kind === 'slot') return
      let underShelf = false
      let p: THREE.Object3D | null = obj.parent
      while (p) {
        if (shelves.some((s) => p === s.root)) {
          underShelf = true
          break
        }
        p = p.parent
      }
      if (underShelf) return
      if (obj.geometry.type === 'BoxGeometry' && obj.position.y < 3.5) roomMeshes++
      else decorMeshes++
    })

    let lights = 0
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light) lights++
    })

    const shadowsOn = renderer.shadowMap.enabled
    const shadowCasters = this.countShadowCasters(scene)

    const weights = {
      cassettes: cassetteCount * 1.6,
      shelves: shelfMeshes * 1.1,
      shadows: shadowsOn ? shadowCasters * 4.5 + 18 : 0,
      lighting: Math.max(0, lights - 1) * 5.5,
      room: roomMeshes * 1.4,
      decor: decorMeshes * 1.0,
      cpu: this.frameMs > 20 ? (this.frameMs - 16) * 2.5 : 4,
    }

    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1

    return [
      {
        label: 'Кассеты',
        percent: (weights.cassettes / total) * 100,
        color: BAR_COLORS.cassettes,
        note: `${cassetteCount} шт · Lambert ×3 материала`,
      },
      {
        label: 'Тени',
        percent: (weights.shadows / total) * 100,
        color: BAR_COLORS.shadows,
        note: shadowsOn ? `${shadowCasters} источн. · карта 1024²` : 'выкл.',
      },
      {
        label: 'Стеллажи',
        percent: (weights.shelves / total) * 100,
        color: BAR_COLORS.shelves,
        note: `${shelfMeshes} мешей`,
      },
      {
        label: 'Освещение',
        percent: (weights.lighting / total) * 100,
        color: BAR_COLORS.lighting,
        note: `${lights} источников`,
      },
      {
        label: 'Комната',
        percent: (weights.room / total) * 100,
        color: BAR_COLORS.room,
        note: 'пол, стены, потолок',
      },
      {
        label: 'Декор',
        percent: (weights.decor / total) * 100,
        color: BAR_COLORS.decor,
        note: `${decorMeshes} объектов`,
      },
      {
        label: 'CPU / логика',
        percent: (weights.cpu / total) * 100,
        color: BAR_COLORS.cpu,
        note: 'raycast, UI, анимации',
      },
    ]
      .filter((b) => b.percent > 0.5)
      .sort((a, b) => b.percent - a.percent)
  }

  private countShadowCasters(scene: THREE.Scene): number {
    let n = 0
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light && obj.castShadow) n++
    })
    return n
  }

  private draw(bars: Bar[], renderer: THREE.WebGLRenderer): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = '#eef2f7'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText(`FPS ${this.fps.toFixed(0)}  ·  ${this.frameMs.toFixed(1)} ms`, 0, 14)

    const info = renderer.info
    ctx.fillStyle = 'rgba(238,242,247,0.65)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(
      `draw: ${info.render.calls}  tri: ${(info.render.triangles / 1000).toFixed(1)}k  tex: ${info.memory.textures}`,
      0,
      30,
    )

    ctx.fillStyle = 'rgba(238,242,247,0.85)'
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.fillText('Оценка нагрузки (относительно)', 0, 48)

    const barX = 92
    const barW = w - barX - 4
    const rowH = 22
    let y = 58

    for (const bar of bars) {
      ctx.fillStyle = 'rgba(238,242,247,0.9)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(bar.label, barX - 8, y + 12)

      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(barX, y + 4, barW, 10)

      ctx.fillStyle = bar.color
      ctx.fillRect(barX, y + 4, (barW * bar.percent) / 100, 10)

      ctx.fillStyle = 'rgba(238,242,247,0.95)'
      ctx.textAlign = 'left'
      ctx.font = '10px system-ui, sans-serif'
      ctx.fillText(`${bar.percent.toFixed(0)}%`, barX + barW + 4, y + 12)

      ctx.fillStyle = 'rgba(238,242,247,0.45)'
      ctx.font = '9px system-ui, sans-serif'
      ctx.fillText(bar.note, barX, y + 18)

      y += rowH
    }
  }
}
