import type { BoostHudState } from '../managers/BoostManager'

export class BoostHud {
  private readonly root: HTMLDivElement
  private visible = false

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'boost-hud'
    Object.assign(this.root.style, {
      position: 'fixed',
      bottom: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9',
      display: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      background: 'rgba(20, 18, 16, 0.72)',
      border: '1px solid rgba(255, 255, 255, 0.35)',
      color: '#f2ebe0',
      font: '500 15px/1.4 Georgia, "Times New Roman", serif',
      pointerEvents: 'none',
      userSelect: 'none',
      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
    } as CSSStyleDeclaration)
    document.body.appendChild(this.root)
  }

  show(): void {
    this.visible = true
    this.root.style.display = 'block'
  }

  hide(): void {
    this.visible = false
    this.root.style.display = 'none'
  }

  update(state: BoostHudState, hasHeld: boolean): void {
    if (!this.visible) return

    if (state.kind === 'ready') {
      const hint = hasHeld ? ' — нажми 1' : ' — возьми кассету, затем 1'
      this.root.textContent = `✦ Подсветка серии${hint}`
      this.root.style.borderColor = 'rgba(120, 220, 140, 0.75)'
      return
    }

    if (state.kind === 'active') {
      const s = Math.ceil(state.secondsLeft)
      this.root.textContent = `✦ Подсветка серии: ${s} с`
      this.root.style.borderColor = 'rgba(120, 220, 140, 0.9)'
      return
    }

    this.root.textContent = '✦ Подсветка серии — заполни полку целиком'
    this.root.style.borderColor = 'rgba(255, 255, 255, 0.25)'
  }
}
