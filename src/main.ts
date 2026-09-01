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
import { StartMenu } from './ui/StartMenu'
import { ProgressHud } from './ui/ProgressHud'
import { ControlsHint } from './ui/ControlsHint'
import type { Cassette } from './entities/Cassette'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('#app not found')
}

const engine = new Engine(app)
const input = new InputManager(engine.renderer.domElement)
const startMenu = new StartMenu(engine.renderer.domElement)
const progressHud = new ProgressHud()
const controlsHint = new ControlsHint()
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
  input.blockInput()
  startMenu.suppress()
  controlsHint.hide()
  progressHud.hide()
  crosshair.setVisible(false)
  hoverLabel.hide()
  heldList.update([])
  winScreen.show()
})

interaction.setOnPlaced(() => {
  progressHud.update(level.cassettes, level.shelves)
  gameState.check(level.cassettes)
})

function refreshProgress(): void {
  progressHud.update(level.cassettes, level.shelves)
}

document.addEventListener('pointerlockchange', () => {
  const inGame = document.pointerLockElement === engine.renderer.domElement
  if (inGame && !gameState.isWon) {
    progressHud.show()
    refreshProgress()
    controlsHint.onGameStart()
  } else if (!gameState.isWon) {
    progressHud.hide()
  }
})

engine.scene.add(level.root)
engine.scene.add(player.yawObject)

engine.setUpdate((dt) => {
  perfPanel.update(dt, engine.scene, engine.renderer, level.cassettes.length, level.shelves)
  if (gameState.isWon) return
  player.update(dt)
  crosshair.setVisible(input.isPointerLocked)

  if (input.isPointerLocked) {
    progressHud.update(level.cassettes, level.shelves)
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
