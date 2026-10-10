import { Engine } from './core/Engine'
import { InputManager } from './core/InputManager'
import { Raycast } from './core/Raycast'
import { Player } from './entities/Player'
import { LevelManager } from './managers/LevelManager'
import { InteractionManager } from './managers/InteractionManager'
import { GameStateManager } from './managers/GameStateManager'
import { GameTimer } from './managers/GameTimer'
import { HorrorManager } from './managers/HorrorManager'
import { HorrorScreen } from './ui/HorrorScreen'
import { Crosshair } from './ui/Crosshair'
import { WinScreen } from './ui/WinScreen'
import { HoverLabel } from './ui/HoverLabel'
import { HeldList } from './ui/HeldList'
import { PerfPanel } from './ui/PerfPanel'
import { StartMenu } from './ui/StartMenu'
import { ProgressHud } from './ui/ProgressHud'
import { ControlsHint } from './ui/ControlsHint'
import { BoostHud } from './ui/BoostHud'
import { BoostManager } from './managers/BoostManager'
import { AchievementManager } from './managers/AchievementManager'
import { AchievementToast } from './ui/AchievementToast'
import { AudioManager } from './audio/AudioManager'
import type { Cassette } from './entities/Cassette'
import type { ShelfSlot } from './entities/ShelfSlot'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('#app not found')
}

const engine = new Engine(app)
const input = new InputManager(engine.renderer.domElement)
const audio = new AudioManager()
const startMenu = new StartMenu(engine.renderer.domElement, audio)
const progressHud = new ProgressHud()
const controlsHint = new ControlsHint()
const boostHud = new BoostHud()
const boostManager = new BoostManager(engine.scene)
const achievements = new AchievementManager()
const achievementToast = new AchievementToast()
const gameTimer = new GameTimer()
let endingPreview = false
const level = new LevelManager()
const player = new Player(engine.camera, input, level.bounds, level.colliders)
const horrorScreen = new HorrorScreen(() => startMenu.startGame())
const horror = new HorrorManager(engine.scene, level.root, engine.camera, player, audio, level.colliders, {
  onCinematic: () => {
    gameTimer.setRunning(false)
    input.blockInput()
    startMenu.suppress()
    hideGameHud()
    interaction.setHeldVisible(false)
  },
  onFade: opacity => horrorScreen.fade(opacity),
  onFinished: () => {
    document.exitPointerLock()
    horrorScreen.show()
  },
})
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
  audio,
)
interaction.setSpecialInteractions(horror.targets, target => horror.tryInteract(target))
interaction.setOnPlacementError(message => achievementToast.error(message))

function hideGameHud(): void {
  controlsHint.hide()
  progressHud.hide()
  boostHud.hide()
  crosshair.setVisible(false)
  hoverLabel.hide()
  heldList.update([])
  achievementToast.clear()
}

const winScreen = new WinScreen(
  () => startMenu.startGame(),
  () => resetRun(),
)

const gameState = new GameStateManager(() => {
  gameTimer.setRunning(false)
  input.blockInput()
  startMenu.suppress()
  document.exitPointerLock()
  controlsHint.hide()
  progressHud.hide()
  boostHud.hide()
  audio.pauseMusic()
  crosshair.setVisible(false)
  hoverLabel.hide()
  heldList.update([])
  achievementToast.clear()
  winScreen.show(gameTimer.seconds, endingPreview)
})

function resetRun(): void {
  gameTimer.reset()
  endingPreview = false
  horror.reset()
  horrorScreen.hide()
  interaction.reset()
  boostManager.reset()
  achievements.reset()
  achievementToast.clear()
  level.resetCassettes()
  player.reset()
  input.reset()
  gameState.reset()
  winScreen.hide()
  controlsHint.reset()
  hoverLabel.hide()
  heldList.update([])
  progressHud.hide()
  boostHud.hide()
  refreshProgress()
  startMenu.returnToMain()
}

startMenu.setOnNewGame(resetRun)

function prepareEndingPreview(): void {
  horror.reset()
  horrorScreen.hide()
  interaction.reset()
  boostManager.reset()
  achievements.reset()
  achievementToast.clear()
  level.resetCassettes()
  const slot = interaction.prepareEnding()
  if (!slot) return
  endingPreview = true
  const position = slot.mesh.getWorldPosition(player.position.clone())
  player.faceSlot(position, slot.shelf.root.rotation.y)
  boostManager.checkShelvesAfterPlace(level.shelves)
  // Award the completed shelves without queuing a wall of test-mode notifications.
  achievements.checkAfterPlace(level.shelves)
  refreshProgress()
  achievementToast.hint('Осталась одна кассета — помести её в ячейку перед собой')
}

interaction.setOnPicked(cassette => boostManager.onCassettePicked(cassette))

interaction.setOnPlaced(() => {
  boostManager.checkShelvesAfterPlace(level.shelves)
  for (const notice of achievements.checkAfterPlace(level.shelves)) achievementToast.show(notice)
  progressHud.update(level.cassettes, level.shelves)
  if (!horror.isActive) gameState.check(level.cassettes)
})

function refreshProgress(): void {
  progressHud.update(level.cassettes, level.shelves)
}

document.addEventListener('pointerlockchange', () => {
  const inGame = document.pointerLockElement === engine.renderer.domElement
  gameTimer.setRunning(inGame && !gameState.isWon && !horror.isCinematic)
  if (inGame && !gameState.isWon && !horror.isCinematic) {
    progressHud.show()
    boostHud.show()
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
  level.updateDecor()
  if (gameState.isWon) return
  boostManager.update(dt)
  achievements.update(dt)
  if (!horror.isCinematic) player.update(dt)
  horror.update(dt, input.isPointerLocked || horror.isCinematic)
  if (horror.isCinematic) return
  crosshair.setVisible(input.isPointerLocked)

  if (input.isPointerLocked) {
    progressHud.update(level.cassettes, level.shelves)
    interaction.update()
    if (input.consumeEndingPreview()) prepareEndingPreview()
    heldList.update(interaction.heldStack)

    const hovered = interaction.hoveredTarget
    if (hovered?.kind === 'cassette') {
      hoverLabel.show(hovered as Cassette)
    } else if (hovered?.kind === 'slot' && !(hovered as ShelfSlot).isEmpty) {
      const slot = hovered as ShelfSlot
      hoverLabel.showText(`${slot.cassettes[0].title} · ${slot.cassettes.length}/5 частей`)
    } else if (hovered?.kind === 'switch') {
      hoverLabel.showText('Тумблер · ЛКМ — опустить')
    } else if (hovered?.kind === 'sand') {
      hoverLabel.showText('Горка песка · ЛКМ — потревожить')
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

    if (input.consumeSkill1()) {
      boostManager.tryActivateSeriesHighlight(interaction.topHeld, level.cassettes)
    }

    if (input.consumeSkill2()) {
      const state = achievements.getCollectionState()
      if (!state.unlocked) achievementToast.hint('Заполни стеллаж, чтобы открыть навык 2')
      else if (state.charges === 0 && state.secondsLeft === 0) achievementToast.hint('Для нового заряда заполни ещё один стеллаж')
      else achievements.tryCollect(() => {
        const result = interaction.tryCollectSeries()
        if (result === 'empty') achievementToast.hint('Возьми кассету нужной серии и нажми 2')
        if (result === 'full') achievementToast.hint('В руках помещается 5 кассет — освободи место от других серий')
        if (result === 'complete') achievementToast.hint('Все доступные кассеты этой серии уже собраны')
        return result === 'collected'
      })
    }

    boostHud.update(boostManager.getHudState(), interaction.topHeld !== null, achievements.getCollectionState())
  } else {
    hoverLabel.hide()
    heldList.update([])
  }
})

engine.start()
