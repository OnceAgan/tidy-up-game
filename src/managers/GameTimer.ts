/** Counts real elapsed playing time; menus and pauses are excluded. */
export class GameTimer {
  private elapsedMs = 0
  private startedAt: number | null = null
  private readonly now: () => number

  constructor(now: () => number = () => performance.now()) { this.now = now }

  setRunning(running: boolean): void {
    if (running && this.startedAt === null) this.startedAt = this.now()
    else if (!running && this.startedAt !== null) {
      this.elapsedMs += this.now() - this.startedAt
      this.startedAt = null
    }
  }

  get seconds(): number {
    return (this.elapsedMs + (this.startedAt === null ? 0 : this.now() - this.startedAt)) / 1000
  }

  reset(): void {
    this.elapsedMs = 0
    this.startedAt = null
  }
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const secs = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
}
