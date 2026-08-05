# Запуск Pixel DND

Проект уже настроен для Render Blueprint.

1. Создайте секретный API-ключ в проекте OpenAI API.
2. В Render выберите **New → Blueprint** и репозиторий `academy-makarov`.
3. Render автоматически прочитает корневой файл `render.yaml`.
4. В единственное пустое секретное поле `OPENAI_API_KEY` вставьте ключ.
5. Нажмите **Deploy Blueprint**.

После публикации откройте выданный адрес `*.onrender.com`. На панели игры должна появиться строка `OpenAI подключён · gpt-5-mini`.

Проверка сервера: `/health`
Проверка подключения ИИ: `/api/status`
