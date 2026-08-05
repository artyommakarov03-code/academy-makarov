# Pixel DND

Готовый игровой MVP с серверным AI-мастером OpenAI.

## Локальный запуск

```bash
cp .env.example .env
# Впишите OPENAI_API_KEY в .env
npm start
```

Откройте `http://localhost:4173`.

## Публикация

В родительском репозитории уже находится `render.yaml`, который полностью настраивает Render. При создании Blueprint нужно ввести только `OPENAI_API_KEY`.

## Служебные адреса

- `/health` — проверка работы сервера;
- `/api/status` — проверка подключения OpenAI без раскрытия ключа.
