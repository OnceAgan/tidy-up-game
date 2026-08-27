export class Crosshair {
  private readonly el: HTMLDivElement

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'crosshair'
    Object.assign(this.el.style, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      width: '10px',
      height: '10px',
      marginLeft: '-5px',
      marginTop: '-5px',
      border: '2px solid rgba(242, 235, 224, 0.85)',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '5',
      transition: 'border-color 0.12s ease, background 0.12s ease',
      display: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(this.el)
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? 'block' : 'none'
  }

  setActive(active: boolean): void {
    this.el.style.borderColor = active ? 'rgba(180, 220, 140, 0.95)' : 'rgba(242, 235, 224, 0.85)'
    this.el.style.background = active ? 'rgba(180, 220, 140, 0.25)' : 'transparent'
  }
}
