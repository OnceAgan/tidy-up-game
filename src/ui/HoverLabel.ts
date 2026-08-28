import type { Cassette } from '../entities/Cassette'
import { getGenre } from '../data/cassetteCatalog'

export class HoverLabel {
  private readonly el: HTMLDivElement

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'hover-label'
    Object.assign(this.el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '22%',
      transform: 'translateX(-50%)',
      padding: '10px 22px',
      background: 'rgba(28, 26, 24, 0.72)',
      borderTop: '1px solid rgba(255,255,255,0.18)',
      borderBottom: '1px solid rgba(255,255,255,0.18)',
      color: '#f2ebe0',
      font: '500 17px/1.35 Arial, Helvetica, sans-serif',
      letterSpacing: '0.02em',
      pointerEvents: 'none',
      zIndex: '8',
      display: 'none',
      whiteSpace: 'normal',
      textAlign: 'center',
      maxWidth: 'min(90vw, 520px)',
      userSelect: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(this.el)
  }

  show(cassette: Cassette): void {
    const genre = getGenre(cassette.genreId)
    this.el.textContent = `${cassette.title} - ${genre.name}`
    this.el.style.display = 'block'
  }

  hide(): void {
    this.el.style.display = 'none'
  }
}
