import type { Cassette } from '../entities/Cassette'

export class GameStateManager {
  private won = false
  private readonly onWin: () => void

  constructor(onWin: () => void) {
    this.onWin = onWin
  }

  get isWon(): boolean {
    return this.won
  }

  check(cassettes: Cassette[]): void {
    if (this.won) return
    if (cassettes.length === 0) return
    if (cassettes.every((c) => c.placed)) {
      this.won = true
      this.onWin()
    }
  }
}
