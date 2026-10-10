export class WelcomeScreen {
  private readonly overlay = document.createElement('div')
  private readonly start: HTMLButtonElement

  constructor(onStart: () => void, onMainMenu: () => void) {
    const style = document.createElement('style')
    style.textContent = `
      #welcome-screen { position:fixed; inset:0; display:none; align-items:center; justify-content:center;
        z-index:110; padding:24px; box-sizing:border-box; overflow:auto;
        background:radial-gradient(ellipse at center,#29322688,#161811d9); backdrop-filter:blur(5px);
        color:#f5efdf; font:16px/1.6 Arial,sans-serif; }
      #welcome-screen .card { width:min(580px,100%); box-sizing:border-box; padding:38px 32px 30px;
        text-align:center; border:1px solid #bca16b; border-radius:18px;
        background:linear-gradient(145deg,#34382cf7,#22261ef7); box-shadow:0 22px 80px #0006,inset 0 1px #fff1; }
      #welcome-screen .eyebrow { color:#d4bb83; letter-spacing:3px; font-size:11px; }
      #welcome-screen h2 { font:clamp(28px,4vw,38px)/1.2 Georgia,serif; margin:14px 0; }
      #welcome-screen p { color:#d3d4c6; margin:0 0 18px; }
      #welcome-screen .goal { padding:16px; border:1px solid #bca16b44; border-radius:8px; background:#ffffff08; }
      #welcome-screen .hint { font-size:13px; color:#c8bea6; }
      #welcome-screen .actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top:24px; }
      #welcome-screen button { padding:12px 22px; border-radius:7px; border:1px solid #a8956c;
        background:#d6bf8d; color:#282a21; font:600 15px Arial,sans-serif; cursor:pointer; }
      #welcome-screen button.secondary { background:transparent; color:#f0e7cf; border-color:#bca16b77; }
      #welcome-screen button:hover { filter:brightness(1.15); }
      #welcome-screen button:focus-visible { outline:2px solid #f3dfad; outline-offset:4px; }
      @media(max-height:570px) { #welcome-screen .card { padding:20px; } }
    `
    document.head.appendChild(style)
    this.overlay.id = 'welcome-screen'
    this.overlay.setAttribute('role', 'dialog')
    this.overlay.setAttribute('aria-modal', 'true')
    this.overlay.setAttribute('aria-labelledby', 'welcome-title')
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `<div class="eyebrow">ДОБРО ПОЖАЛОВАТЬ В ВИДЕОТЕКУ</div>
      <h2 id="welcome-title">Один кот.<br>Сто двадцать кассет.</h2>
      <p>Кот решил стать кинокритиком и сбросил всю коллекцию на пол. Рецензии мы так и не нашли. Зато теперь точно знаем: гравитация работает.</p>
      <p class="goal">Верни все <strong>120 кассет</strong> на стеллажи по жанрам. Каждая ячейка — <strong>одна серия из пяти частей</strong>: от 1 до 5. Первой кассетой ты выбираешь серию для ячейки.<br>Заполняй ячейки и стеллажи, чтобы получать достижения и навыки.</p>
      <p class="hint">Подсказки клавиш появятся в начале игры. Полное управление всегда доступно в меню по Esc.</p>`
    const actions = document.createElement('div')
    actions.className = 'actions'
    this.start = this.createButton('Начать игру', onStart)
    const back = this.createButton('Главное меню', onMainMenu)
    back.className = 'secondary'
    actions.append(this.start, back)
    card.appendChild(actions)
    this.overlay.appendChild(card)
    document.body.appendChild(this.overlay)
  }

  private createButton(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', e => { e.stopPropagation(); action() })
    return button
  }

  show(): void {
    this.overlay.style.display = 'flex'
    this.start.focus({ preventScroll: true })
  }

  hide(): void { this.overlay.style.display = 'none' }
  dispose(): void { this.overlay.remove() }
}
