import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { WINDOW_CENTER_Y, WINDOW_WIDTH } from './roomWalls'

const MODEL_URL = `${import.meta.env.BASE_URL}models/window.glb`
const MODEL_WIDTH = 2.5
const MODEL_CENTER_Y = 0.98

let preparedTemplate: THREE.Group | null = null
let loadFailed = false
const waiters: Array<{ ok: (t: THREE.Group) => void; err: () => void }> = []

function prepareLoadedScene(scene: THREE.Group): THREE.Group {
  const scale = WINDOW_WIDTH / MODEL_WIDTH
  scene.scale.setScalar(scale)

  scene.traverse((obj) => {
    if (obj.name === 'CTRL_Hole') {
      obj.visible = false
    }
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false
      obj.receiveShadow = true
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.side = THREE.DoubleSide
        }
      }
    }
  })

  scene.position.y = -MODEL_CENTER_Y * scale
  return scene
}

function addDaylight(group: THREE.Group): void {
  const light = new THREE.PointLight(0xfff4e0, 0.38, 7, 1.6)
  light.position.set(0, 0.15, 0.25)
  group.add(light)
}

function flushWaiters(ok: boolean): void {
  for (const w of waiters) {
    if (ok && preparedTemplate) w.ok(preparedTemplate)
    else w.err()
  }
  waiters.length = 0
}

export function loadWindowModel(onReady: (template: THREE.Group) => void, onError: () => void): void {
  if (preparedTemplate) {
    onReady(preparedTemplate)
    return
  }
  if (loadFailed) {
    onError()
    return
  }

  waiters.push({ ok: onReady, err: onError })
  if (waiters.length > 1) return

  new GLTFLoader().load(
    MODEL_URL,
    (gltf) => {
      const root = prepareLoadedScene(gltf.scene)
      addDaylight(root)
      preparedTemplate = root
      flushWaiters(true)
    },
    undefined,
    () => {
      loadFailed = true
      flushWaiters(false)
    },
  )
}

export type WindowPlacement = {
  x: number
  z: number
  rotY: number
}

export function placeWindowInstances(parent: THREE.Group, template: THREE.Group, placements: WindowPlacement[]): void {
  for (const p of placements) {
    const windowGroup = template.clone(true)
    windowGroup.position.set(p.x, WINDOW_CENTER_Y, p.z)
    windowGroup.rotation.y = p.rotY
    parent.add(windowGroup)
  }
}
