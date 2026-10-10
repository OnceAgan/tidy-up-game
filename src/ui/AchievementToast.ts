import type { AchievementNotice } from '../managers/AchievementManager'

export class AchievementToast {
  private readonly root = document.createElement('div')
  private readonly queue: AchievementNotice[] = []
  private showing = false
  private readonly feedback = document.createElement('div')
  private feedbackTimer = 0
  private toastTimer = 0
  private readonly errorToast = document.createElement('div')
  private errorTimer = 0

  clear(): void {
    window.clearTimeout(this.toastTimer)
    window.clearTimeout(this.feedbackTimer)
    window.clearTimeout(this.errorTimer)
    this.queue.length = 0
    this.showing = false
    this.root.hidden = true
    this.feedback.style.display = 'none'
    this.errorToast.style.display = 'none'
    this.root.style.top = '22px'
  }

  constructor() {
    const style = document.createElement('style')
    style.textContent = `
      #achievement-toast { position:fixed; top:22px; left:50%; transform:translateX(-50%);
        width:min(420px,calc(100vw - 32px)); box-sizing:border-box; z-index:25; pointer-events:none;
        padding:18px 22px 18px 76px; border:1px solid #c7a66b; border-radius:12px;
        background:linear-gradient(135deg,rgba(49,44,33,.97),rgba(25,30,25,.97));
        color:#f5efdf; box-shadow:0 12px 40px #0006, inset 0 1px #fff1; font:14px/1.45 Arial,sans-serif; }
      #achievement-toast[hidden] { display:none; }
      #achievement-toast .medal { position:absolute; left:20px; top:24px; width:40px; height:40px;
        display:grid; place-items:center; border:1px solid #d5b77b; border-radius:50%;
        color:#edd499; font-size:25px; background:radial-gradient(circle,#c39c4833,transparent); }
      #achievement-toast .eyebrow { color:#d5b77b; font-size:10px; letter-spacing:2px; text-transform:uppercase; }
      #achievement-toast h2 { margin:3px 0 5px; font:24px Georgia,serif; }
      #achievement-toast p { margin:0; color:#d3cec0; }
      #achievement-toast .reward { margin-top:10px; padding-top:9px; border-top:1px solid #c7a66b44; color:#d5e6bd; }
      #achievement-toast .progress { position:absolute; bottom:0; left:12px; right:12px; height:2px;
        background:#d5b77b; transform-origin:left; animation:achievement-timer 5.5s linear forwards; }
      @keyframes achievement-timer { to { transform:scaleX(0); } }
      @media(prefers-reduced-motion:reduce) { #achievement-toast .progress { animation:none; } }
    `
    document.head.appendChild(style)
    this.root.id = 'achievement-toast'
    this.root.hidden = true
    this.root.setAttribute('role', 'status')
    this.root.setAttribute('aria-live', 'polite')
    Object.assign(this.feedback.style, { position: 'fixed', bottom: '150px', left: '50%',
      transform: 'translateX(-50%)', zIndex: '24', padding: '10px 16px', borderRadius: '8px',
      background: 'rgba(28,26,22,.94)', color: '#f5dfab', font: '14px Arial,sans-serif',
      pointerEvents: 'none', display: 'none', maxWidth: '85vw', textAlign: 'center' })
    this.feedback.setAttribute('role', 'status')
    this.errorToast.id = 'placement-error'
    this.errorToast.setAttribute('role', 'alert')
    Object.assign(this.errorToast.style, { position: 'fixed', top: '22px', left: '50%',
      transform: 'translateX(-50%)', width: 'min(480px,calc(100vw - 32px))', boxSizing: 'border-box',
      padding: '16px 20px', border: '1px solid #ef7777', borderLeft: '5px solid #ff6565', borderRadius: '12px',
      background: 'linear-gradient(135deg,#582525f7,#321a1af7)', color: '#ffe4e4', font: '16px/1.45 Arial,sans-serif',
      boxShadow: '0 12px 36px #0006', zIndex: '30', display: 'none', pointerEvents: 'none' })
    document.body.append(this.root, this.feedback, this.errorToast)
  }

  show(notice: AchievementNotice): void {
    this.queue.push(notice)
    if (!this.showing) this.next()
  }

  hint(text: string): void {
    window.clearTimeout(this.feedbackTimer)
    this.feedback.textContent = text
    this.feedback.style.display = 'block'
    this.feedbackTimer = window.setTimeout(() => { this.feedback.style.display = 'none' }, 3000)
  }

  error(text: string): void {
    window.clearTimeout(this.errorTimer)
    this.errorToast.replaceChildren()
    const title = document.createElement('strong')
    title.textContent = '⚠ Не удалось поставить кассету'
    Object.assign(title.style, { display: 'block', marginBottom: '5px', color: '#ffb0b0' })
    this.errorToast.append(title, document.createTextNode(text))
    this.errorToast.style.display = 'block'
    this.root.style.top = `${this.errorToast.getBoundingClientRect().bottom + 12}px`
    this.errorTimer = window.setTimeout(() => {
      this.errorToast.style.display = 'none'
      this.root.style.top = '22px'
    }, 4000)
  }

  private next(): void {
    const notice = this.queue.shift()
    if (!notice) { this.showing = false; return }
    this.showing = true
    this.root.innerHTML = '<span class="medal">✦</span><div class="eyebrow">Достижение получено</div><h2></h2><p></p>'
    this.root.querySelector('h2')!.textContent = notice.title
    this.root.querySelector('p')!.textContent = notice.description
    if (notice.reward) {
      const reward = document.createElement('div')
      reward.className = 'reward'
      reward.textContent = notice.reward
      this.root.appendChild(reward)
    }
    const progress = document.createElement('div')
    progress.className = 'progress'
    this.root.appendChild(progress)
    this.root.hidden = false
    this.root.animate([{ opacity: 0, translate: '0 -12px' }, { opacity: 1, translate: '0 0' }],
      { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
    this.toastTimer = window.setTimeout(() => {
      this.root.hidden = true
      this.toastTimer = window.setTimeout(() => this.next(), 200)
    }, 5500)
  }
}
