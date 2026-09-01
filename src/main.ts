import { Engine } from './core/Engine'
import { InputManager } from './core/InputManager'
import { Raycast } from './core/Raycast'
import { Player } from './entities/Player'
import { LevelManager } from './managers/LevelManager'
import { InteractionManager } from './managers/InteractionManager'
import { GameStateManager } from './managers/GameStateManager'
import { Crosshair } from './ui/Crosshair'
import { WinScreen } from './ui/WinScreen'
import { HoverLabel } from './ui/HoverLabel'
import { HeldList } from './ui/HeldList'
import { PerfPanel } from './ui/PerfPanel'
import type { Cassette } from './entities/Cassette'

const app = document.querySelector<HTMLDivElement>('#app')
const hint = document.querySelector<HTMLDivElement>('#hint')

if (!app) {
  throw new Error('#app not found')
}

const engine = new Engine(app)
const input = new InputManager(engine.renderer.domElement, hint)
const level = new LevelManager()
const player = new Player(engine.camera, input, level.bounds, level.colliders)
const raycast = new Raycast(engine.camera)
const crosshair = new Crosshair()
const hoverLabel = new HoverLabel()
const heldList = new HeldList()
const perfPanel = new PerfPanel()
const interaction = new InteractionManager(
  engine.camera,
  engine.scene,
  raycast,
  crosshair,
  level.cassettes,
  level.slots,
  level.shelves,
)

const winScreen = new WinScreen(() => {
  window.location.reload()
})

const gameState = new GameStateManager(() => {
  document.exitPointerLock()
  input.suppressHint()
  crosshair.setVisible(false)
  hoverLabel.hide()
  heldList.update([])
  winScreen.show()
})

interaction.setOnPlaced(() => {
  gameState.check(level.cassettes)
})

engine.scene.add(level.root)
engine.scene.add(player.yawObject)

engine.setUpdate((dt) => {
  perfPanel.update(dt, engine.scene, engine.renderer, level.cassettes.length, level.shelves)
  if (gameState.isWon) return
  player.update(dt)
  crosshair.setVisible(input.isPointerLocked)

  if (input.isPointerLocked) {
    interaction.update()
    heldList.update(interaction.heldStack)

    const hovered = interaction.hoveredTarget
    if (hovered?.kind === 'cassette') {
      hoverLabel.show(hovered as Cassette)
    } else {
      hoverLabel.hide()
    }

    if (input.consumeInteract()) {
      interaction.tryInteract()
    }

    if (input.consumeDrop()) {
      interaction.tryDrop()
    }

    const wheel = input.consumeWheelStep()
    if (wheel !== 0) {
      interaction.cycleStack(wheel)
    }
  } else {
    hoverLabel.hide()
    heldList.update([])
  }
})

engine.start()
