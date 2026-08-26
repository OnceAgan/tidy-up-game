import { Engine } from './core/Engine'
import { InputManager } from './core/InputManager'
import { Player } from './entities/Player'
import { LevelManager } from './managers/LevelManager'

const app = document.querySelector<HTMLDivElement>('#app')
const hint = document.querySelector<HTMLDivElement>('#hint')

if (!app) {
  throw new Error('#app not found')
}

const engine = new Engine(app)
const input = new InputManager(engine.renderer.domElement, hint)
const level = new LevelManager()
const player = new Player(engine.camera, input, level.bounds)

engine.scene.add(level.root)
engine.scene.add(player.yawObject)

engine.setUpdate((dt) => {
  player.update(dt)
})

engine.start()
