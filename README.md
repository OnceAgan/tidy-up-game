# tidy-up-game

Браузерный 3D-прототип cozy tidy-up (референс: TV Archive Tidy Up Together).

## Стек

Vite + TypeScript + Three.js

## Первый запуск (новый компьютер)

Нужны **Node.js** (LTS) и **Git**.

```bash
git clone https://github.com/OnceAgan/tidy-up-game.git
cd tidy-up-game
npm install
npm run dev
```

Открыть в браузере: **http://localhost:5173/**

## Каждый день — запуск игры

```bash
cd tidy-up-game
git pull          # подтянуть последние изменения
npm run dev
```

Открыть: **http://localhost:5173/**

Остановить сервер: **Ctrl+C** в терминале.

## Синхронизация дом ↔ офис

**Перед уходом с компьютера** (где работал):

```bash
git add .
git commit -m "кратко: что сделал"
git push
```

**На другом компьютере** (где продолжаешь):

```bash
cd tidy-up-game
git pull
npm run dev
```

Без `git push` / `git pull` версии на двух ПК разъедутся.

## Если `localhost` не открывается

Ошибка `ERR_CONNECTION_REFUSED` — сервер не запущен. В папке проекта:

```bash
npm run dev
```

Дождись строки `Local: http://localhost:5173/` и только потом открывай браузер.

## Подробности для разработки

См. `AGENTS.md`.
