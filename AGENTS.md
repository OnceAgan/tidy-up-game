# tidy-up-game — браузерный прототип

## Цель
3D cozy tidy-up от первого лица (референс: TV Archive Tidy Up Together).
MVP: комната, WASD + Pointer Lock, взять кассету → слот на стеллаже → победа.

## Стек
- Vite + TypeScript + Three.js
- @tweenjs/tween.js для анимаций
- Без React, Unity, Godot на этом этапе

## Структура (целевая)
- `src/core` — Engine, InputManager, Raycast
- `src/entities` — Player, Cassette, ShelfSlot, Interactable
- `src/managers` — LevelManager, GameStateManager
- `src/ui` — Crosshair, WinScreen

## MVP по шагам
1. Комната, свет, FPS (Pointer Lock, WASD, коллизии с полом/стенами)
2. Стеллаж + слоты, кассеты, raycast, pick & place
3. Проверка победы, экран Win

## Правила для агента
- Один шаг за раз; после шага — что проверить в браузере (`npm run dev`)
- Минимальный diff; не переписывать полпроекта
- Не добавлять npm-пакеты без явного запроса
- Placeholder-геометрия (BoxGeometry), без финального арта
- Не ломать работающее управление при новых фичах
