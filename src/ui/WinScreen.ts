import { formatDuration } from '../managers/GameTimer'

export class WinScreen {
  private readonly overlay = document.createElement('div')
  private readonly time = document.createElement('div')
  private readonly mode = document.createElement('p')
  private readonly restart: HTMLButtonElement

  constructor(onRestart: () => void, onMainMenu: () => void) {
    const style = document.createElement('style')
    style.textContent = `
      #win-screen { position:fixed; inset:0; display:none; align-items:center; justify-content:center;
        z-index:110; padding:24px; box-sizing:border-box; overflow:auto;
        background:radial-gradient(ellipse at center,#29322688,#161811d9); backdrop-filter:blur(5px);
        color:#f5efdf; font:16px/1.5 Arial,sans-serif; }
      #win-screen .card { width:min(580px,100%); box-sizing:border-box; padding:38px 32px 30px;
        text-align:center; border:1px solid #bca16b; border-radius:18px;
        background:linear-gradient(145deg,#34382cf7,#22261ef7); box-shadow:0 22px 80px #0006,inset 0 1px #fff1; }
      #win-screen .eyebrow { color:#d4bb83; letter-spacing:3px; font-size:11px; text-transform:uppercase; }
      #win-screen h1 { font:clamp(28px,4vw,40px)/1.15 Georgia,serif; margin:14px 0; }
      #win-screen .description { color:#d3d4c6; margin:0 auto 25px; max-width:400px; }
      #win-screen .time-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#c8bea6; }
      #win-screen .time { font:44px/1.4 Georgia,serif; font-variant-numeric:tabular-nums; color:#eddbaf; }
      #win-screen .mode { margin:3px 0 0; color:#b9bdaa; font-size:12px; min-height:18px; }
      #win-screen .actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top:24px; }
      #win-screen button { padding:12px 22px; border-radius:7px; border:1px solid #a8956c;
        background:#d6bf8d; color:#282a21; font:600 15px Arial,sans-serif; cursor:pointer; }
      #win-screen button.secondary { background:transparent; color:#f0e7cf; border-color:#bca16b77; }
      #win-screen button:hover { filter:brightness(1.15); }
      #win-screen button:focus-visible { outline:2px solid #f3dfad; outline-offset:4px; }
      #win-screen svg { width:104px; height:74px; margin:0 auto 16px; display:block; }
      @media(max-height:570px) { #win-screen .card { padding:20px; } #win-screen svg { height:45px; margin-bottom:8px; } }
    `
    document.head.appendChild(style)
    this.overlay.id = 'win-screen'
    this.overlay.setAttribute('role', 'dialog')
    this.overlay.setAttribute('aria-modal', 'true')
    this.overlay.setAttribute('aria-labelledby', 'win-title')
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `<svg viewBox="0 0 104 74" aria-hidden="true">
      <path d="M14 58L7 66M90 58l7 8M52 7V0M9 23L2 19M95 23l7-4" stroke="#d9bf81" stroke-width="2"/>
      <rect x="17" y="14" width="70" height="47" rx="6" fill="#171d16" stroke="#d9bf81" stroke-width="2"/>
      <rect x="24" y="21" width="56" height="22" rx="3" fill="#dfcfaa"/>
      <circle cx="36" cy="32" r="7" fill="#343a2b"/><circle cx="68" cy="32" r="7" fill="#343a2b"/>
      <path d="M36 32h32M36 48h32l5 8H31z" fill="none" stroke="#d9bf81" stroke-width="2"/>
      <circle cx="36" cy="32" r="2" fill="#dfcfaa"/><circle cx="68" cy="32" r="2" fill="#dfcfaa"/>
      </svg><div class="eyebrow">Коллекция собрана</div>
      <h1 id="win-title">Поздравляем!<br>Игра пройдена</h1>
      <p class="description">Все кассеты на своих местах, а комната снова наполнена уютом. Спасибо за игру!</p>
      <div class="time-label">Время прохождения</div>`
    this.time.className = 'time'
    this.mode.className = 'mode'
    const actions = document.createElement('div')
    actions.className = 'actions'
    this.restart = this.createButton('Начать заново', onRestart)
    const mainMenu = this.createButton('Главное меню', onMainMenu)
    mainMenu.className = 'secondary'
    actions.append(this.restart, mainMenu)
    card.append(this.time, this.mode, actions)
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

  show(seconds: number, preview = false): void {
    this.time.textContent = formatDuration(seconds)
    this.mode.textContent = preview ? 'Режим проверки финала' : ''
    this.overlay.style.display = 'flex'
    this.restart.focus({ preventScroll: true })
  }

  hide(): void { this.overlay.style.display = 'none' }
}
