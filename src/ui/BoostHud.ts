import type { BoostHudState } from '../managers/BoostManager'
import type { CollectionSkillState } from '../managers/AchievementManager'

type SkillCard = {
  root: HTMLDivElement
  status: HTMLSpanElement
  hint: HTMLDivElement
  bar: HTMLDivElement
}

export class BoostHud {
  private readonly root = document.createElement('div')
  private visible = false
  private available = false
  private readonly highlight: SkillCard
  private readonly collection: SkillCard

  constructor() {
    const style = document.createElement('style')
    style.textContent = `
      #boost-hud { position:fixed; top:22px; right:24px; z-index:9; display:none;
        width:min(290px,calc(100vw - 40px)); pointer-events:none; user-select:none;
        color:#f2ebe0; font:14px/1.4 Arial,sans-serif; }
      #boost-hud .skill { position:relative; overflow:hidden; margin-bottom:10px; padding:15px 16px;
        border:1px solid #c3aa7366; border-radius:12px; background:linear-gradient(135deg,#302e25ed,#1c211ced);
        box-shadow:0 8px 24px #0004; }
      #boost-hud .heading { display:flex; align-items:center; gap:10px; }
      #boost-hud .key { display:grid; place-items:center; width:28px; height:28px; flex-shrink:0;
        border:1px solid #cbb58088; border-radius:6px; color:#edd5a2; font-weight:bold; }
      #boost-hud .title { font-weight:600; font-size:15px; }
      #boost-hud .status { display:block; margin-top:12px; color:#e1c994; font-weight:600; }
      #boost-hud .hint { margin-top:4px; color:#cac8bc; font-size:12px; }
      #boost-hud .bar { position:absolute; bottom:0; left:0; height:3px; background:#90e5ae; }
      #boost-hud .skill[data-state="active"] { border-color:#91dfac; background:linear-gradient(135deg,#294536f2,#182d23f2);
        box-shadow:0 0 20px #70e79b28,0 8px 24px #0004; }
      #boost-hud .skill[data-state="active"] .status { color:#abf4c5; }
      #boost-hud .skill[data-state="active"] .key { background:#86dba422; border-color:#91dfac; color:#baf5ce; }
      @media(max-width:600px) { #boost-hud { right:12px; top:16px; width:220px; } }
    `
    document.head.appendChild(style)
    this.root.id = 'boost-hud'
    this.highlight = this.createCard('1', 'Подсветка серии')
    this.collection = this.createCard('2', 'Сбор серии')
    this.root.append(this.highlight.root, this.collection.root)
    document.body.appendChild(this.root)
  }

  private createCard(key: string, name: string): SkillCard {
    const root = document.createElement('div')
    root.className = 'skill'
    root.dataset.skill = key
    root.style.display = 'none'
    const heading = document.createElement('div')
    heading.className = 'heading'
    const badge = document.createElement('span')
    badge.className = 'key'
    badge.textContent = key
    const title = document.createElement('span')
    title.className = 'title'
    title.textContent = name
    heading.append(badge, title)
    const status = document.createElement('span')
    status.className = 'status'
    const hint = document.createElement('div')
    hint.className = 'hint'
    const bar = document.createElement('div')
    bar.className = 'bar'
    root.append(heading, status, hint, bar)
    return { root, status, hint, bar }
  }

  show(): void {
    this.visible = true
    this.root.style.display = this.available ? 'block' : 'none'
  }

  hide(): void {
    this.visible = false
    this.root.style.display = 'none'
  }

  private updateCard(card: SkillCard, charges: number, seconds: number, hasHeld: boolean, key: string): boolean {
    const active = seconds > 0
    const available = active || charges > 0
    card.root.style.display = available ? 'block' : 'none'
    if (!available) return false
    card.root.dataset.state = active ? 'active' : 'ready'
    card.status.textContent = active
      ? `АКТИВЕН · ${Math.ceil(seconds)} с${charges > 0 ? ` · запас: ${charges}` : ''}`
      : `ГОТОВ · зарядов: ${charges}`
    card.hint.textContent = active
      ? `Возьми кассету другой серии и нажми ${key} — сменить серию`
      : hasHeld ? `Нажми ${key}, чтобы активировать` : `Возьми кассету и нажми ${key}`
    card.bar.style.display = active ? 'block' : 'none'
    card.bar.style.width = `${Math.min(100, seconds / 15 * 100)}%`
    return true
  }

  update(state: BoostHudState, hasHeld: boolean, collection: CollectionSkillState): void {
    const highlightAvailable = this.updateCard(this.highlight, state.kind === 'locked' ? 0 : state.charges,
      state.kind === 'active' ? state.secondsLeft : 0, hasHeld, '1')
    const collectionAvailable = this.updateCard(this.collection, collection.charges, collection.secondsLeft, hasHeld, '2')
    this.available = highlightAvailable || collectionAvailable
    this.root.style.display = this.visible && this.available ? 'block' : 'none'
  }
}
