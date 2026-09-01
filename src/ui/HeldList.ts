import type { Cassette } from '../entities/Cassette'
import { getGenre } from '../data/cassetteCatalog'

export class HeldList {
  private readonly panel: HTMLDivElement
  private readonly list: HTMLUListElement
  private readonly header: HTMLDivElement

  constructor() {
    this.panel = document.createElement('div')
    this.panel.id = 'held-list'
    Object.assign(this.panel.style, {
      position: 'fixed',
      top: '96px',
      left: '18px',
      minWidth: '220px',
      maxWidth: '360px',
      padding: '12px 14px',
      background: 'rgba(20, 18, 16, 0.62)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '4px',
      color: '#f2ebe0',
      font: '400 14px/1.5 Arial, Helvetica, sans-serif',
      pointerEvents: 'none',
      zIndex: '8',
      display: 'none',
      userSelect: 'none',
    } as CSSStyleDeclaration)

    this.header = document.createElement('div')
    Object.assign(this.header.style, {
      marginBottom: '8px',
      fontWeight: '600',
      fontSize: '13px',
      color: 'rgba(242,235,224,0.75)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    } as CSSStyleDeclaration)
    this.header.textContent = 'В руках'

    this.list = document.createElement('ul')
    Object.assign(this.list.style, {
      margin: '0',
      padding: '0',
      listStyle: 'none',
    } as CSSStyleDeclaration)

    this.panel.append(this.header, this.list)
    document.body.appendChild(this.panel)
  }

  update(held: readonly Cassette[]): void {
    if (held.length === 0) {
      this.panel.style.display = 'none'
      return
    }

    this.panel.style.display = 'block'
    this.header.textContent = `В руках: ${held.length} · колёсико — сменить верхнюю`

    this.list.replaceChildren()
  // сверху вниз (верхняя — последняя в массиве)
    const ordered = [...held].reverse()
    ordered.forEach((c, i) => {
      const li = document.createElement('li')
      Object.assign(li.style, {
        marginBottom: '4px',
        paddingLeft: '14px',
        position: 'relative',
        color: i === 0 ? '#fff' : 'rgba(242,235,224,0.82)',
        fontWeight: i === 0 ? '600' : '400',
      } as CSSStyleDeclaration)

      const dot = document.createElement('span')
      dot.textContent = i === 0 ? '▸' : '•'
      Object.assign(dot.style, {
        position: 'absolute',
        left: '0',
        color: i === 0 ? '#b8f060' : 'rgba(242,235,224,0.85)',
      } as CSSStyleDeclaration)

      const text = document.createElement('span')
      const genre = getGenre(c.genreId)
      text.textContent = `${c.title}, ч. ${c.part}, ${genre.name}`

      li.append(dot, text)
      this.list.append(li)
    })
  }
}
