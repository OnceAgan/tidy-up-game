import type { BoostHudState } from '../managers/BoostManager'
import type { CollectionSkillState } from '../managers/AchievementManager'

export class BoostHud {
  private readonly root: HTMLDivElement
  private visible = false
  private readonly highlightLine = document.createElement('div')
  private readonly collectionLine = document.createElement('div')

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
      maxWidth: 'calc(100vw - 40px)',
      width: 'max-content',
      textAlign: 'center',
    } as CSSStyleDeclaration)
    this.collectionLine.style.marginTop = '5px'
    this.collectionLine.style.fontSize = '14px'
    this.root.append(this.highlightLine, this.collectionLine)
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

  update(state: BoostHudState, hasHeld: boolean, collection: CollectionSkillState): void {
    if (!this.visible) return

    this.collectionLine.style.color = collection.unlocked ? '#eed09b' : '#c2b9ac'
    this.collectionLine.textContent = collection.secondsLeft > 0
      ? `2 · Сбор серии: ${Math.ceil(collection.secondsLeft)} с — возьми кассету и нажми 2${collection.charges > 0 ? ` · запас: ${collection.charges}` : ''}`
      : collection.charges > 0
        ? `2 · Сбор серии · зарядов: ${collection.charges} — ${hasHeld ? 'нажми 2' : 'возьми кассету, затем 2'}`
        : '2 · Сбор серии — заполни стеллаж для заряда'

    if (state.kind === 'ready') {
      const hint = hasHeld ? ' — нажми 1' : ' — возьми кассету, затем 1'
      this.highlightLine.textContent = `1 · Подсветка серии · зарядов: ${state.charges}${hint}`
      this.root.style.borderColor = 'rgba(120, 220, 140, 0.75)'
      return
    }

    if (state.kind === 'active') {
      const s = Math.ceil(state.secondsLeft)
      this.highlightLine.textContent = `1 · Подсветка серии: ${s} с — ${hasHeld ? "1: сменить серию" : "возьми кассету другой серии"}${state.charges > 0 ? ` · запас: ${state.charges}` : ""}`
      this.root.style.borderColor = 'rgba(120, 220, 140, 0.9)'
      return
    }

    this.highlightLine.textContent = '1 · Подсветка серии — заполни ячейку: 5 кассет'
    this.root.style.borderColor = 'rgba(255, 255, 255, 0.25)'
  }
}
