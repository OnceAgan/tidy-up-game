import type { Shelf } from '../entities/Shelf'

export type AchievementNotice = { title: string; description: string; reward?: string }
export type CollectionSkillState = { unlocked: boolean; charges: number; secondsLeft: number }

export class AchievementManager {
  private firstCell = false
  private readonly completedShelves = new Set<Shelf>()
  private charges = 0
  private timeLeft = 0

  reset(): void {
    this.firstCell = false
    this.completedShelves.clear()
    this.charges = this.timeLeft = 0
  }

  checkAfterPlace(shelves: readonly Shelf[]): AchievementNotice[] {
    const notices: AchievementNotice[] = []
    if (!this.firstCell && shelves.some(shelf => shelf.slots.some(slot => slot.isFull))) {
      this.firstCell = true
      notices.push({ title: 'Начало коллекции', description: 'Первая ячейка заполнена — все пять частей на месте.' })
    }
    for (const shelf of shelves) {
      if (!shelf.isCategoryComplete() || this.completedShelves.has(shelf)) continue
      this.completedShelves.add(shelf)
      this.charges++
      notices.push({ title: 'Хранитель архива', description: `Полностью заполнен стеллаж · ${this.completedShelves.size}`,
        reward: this.completedShelves.size === 1 ? 'Открыт навык 2 · Сбор серии · 15 секунд' : 'Навык 2 · +1 заряд на 15 секунд' })
    }
    return notices
  }

  getCollectionState(): CollectionSkillState {
    return { unlocked: this.completedShelves.size > 0, charges: this.charges, secondsLeft: this.timeLeft }
  }

  tryCollect(collect: () => boolean): boolean {
    if (this.timeLeft <= 0 && this.charges <= 0) return false
    // Only a successful pickup starts the timer and spends a charge.
    if (!collect()) return false
    if (this.timeLeft <= 0) {
      this.charges--
      this.timeLeft = 15
    }
    return true
  }

  update(dt: number): void {
    this.timeLeft = Math.max(0, this.timeLeft - dt)
  }
}
