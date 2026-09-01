import type { Cassette } from '../entities/Cassette'
import type { Shelf } from '../entities/Shelf'

export class ProgressHud {
  private readonly root: HTMLDivElement
  private readonly shelvesLine: HTMLDivElement
  private readonly cassettesLine: HTMLDivElement
  private visible = false

  constructor() {
    this.root = document.createElement('div')
    this.root.id = 'progress-hud'
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '16px',
      left: '16px',
      zIndex: '9',
      display: 'none',
      minWidth: '220px',
      padding: '10px 14px',
      borderTop: '1px solid rgba(255, 255, 255, 0.55)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.55)',
      color: '#f2ebe0',
      font: '500 17px/1.45 Georgia, "Times New Roman", serif',
      pointerEvents: 'none',
      userSelect: 'none',
      textShadow: '0 1px 4px rgba(0,0,0,0.65)',
    } as CSSStyleDeclaration)

    this.shelvesLine = this.createRow('▤', 'заполнено полок')
    this.cassettesLine = this.createRow('▭', 'собрано кассет')

    this.root.append(this.shelvesLine, this.cassettesLine)
    document.body.appendChild(this.root)
  }

  private createRow(icon: string, label: string): HTMLDivElement {
    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '4px',
    } as CSSStyleDeclaration)

    const iconEl = document.createElement('span')
    iconEl.textContent = icon
    Object.assign(iconEl.style, {
      width: '22px',
      textAlign: 'center',
      fontSize: '15px',
      opacity: '0.9',
    } as CSSStyleDeclaration)

    const text = document.createElement('span')
    text.dataset.role = label
    text.textContent = `${label} 0/0`

    row.append(iconEl, text)
    return row
  }

  update(cassettes: readonly Cassette[], shelves: readonly Shelf[]): void {
    const placed = cassettes.filter((c) => c.placed).length
    const filledShelves = shelves.filter((s) => s.isCategoryComplete()).length
    const shelvesText = this.shelvesLine.querySelector('span:last-child')
    const cassettesText = this.cassettesLine.querySelector('span:last-child')
    if (shelvesText) {
      shelvesText.textContent = `заполнено полок ${filledShelves}/${shelves.length}`
    }
    if (cassettesText) {
      cassettesText.textContent = `собрано кассет ${placed}/${cassettes.length}`
    }
  }

  show(): void {
    this.visible = true
    this.root.style.display = 'block'
  }

  hide(): void {
    this.visible = false
    this.root.style.display = 'none'
  }

  isVisible(): boolean {
    return this.visible
  }
}
