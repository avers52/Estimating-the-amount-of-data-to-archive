1 терминал:

docker compose up -d

2 терминал:

cd backend
npm run start:dev

данные входа:
postgres
postgres
password
archive_bd

## 1. Схема базы данных

### Таблица `users`
* `id` (BIGINT, PK) — Уникальный идентификатор
* `full_name` (VARCHAR(120)) — Имя пользователя
* `email` (VARCHAR(120), UNIQUE) — Электронная почта
* `password` (VARCHAR(255)) — Хэш пароля

### Таблица `compression_algorithms`
* `algorithm_id` (INT, PK) — Уникальный идентификатор алгоритма
* `creator_id` (INT, FK -> users.id) — Автор алгоритма
* `algorithm_name` (VARCHAR(100)) — Название
* `algorithm_description` (TEXT) — Описание
* `algorithm_status` (VARCHAR(20)) — Статус ('draft', 'published', 'deleted')
* `image_url` (VARCHAR(255)) — URL фото в MinIO S3
* `video_url` (VARCHAR(255)) — URL видео в MinIO S3
* `compression_ratio` (NUMERIC(4,2)) — Коэффициент сжатия
* `compression_speed_mbps` (INT) — Скорость сжатия

### Таблица `algorithm_likes`
* `user_id` (BIGINT, PK, FK -> users.id)
* `algorithm_id` (INT, PK, FK -> compression_algorithms.algorithm_id)

---

## 2. Спецификация REST API

| # | Метод | URL | Тело запроса / Query | Код | Описание |
|---|---|---|---|---|---|
| 1 | GET | `/api/services?min_compression_ratio=2.0` | Query: `min_compression_ratio` | 200 | Список алгоритмов с фильтрацией |
| 2 | POST | `/api/services` | multipart/form-data: `algorithm_name`, `image`, `video` | 201 | Создание/дополнение черновика |
| 3 | GET | `/api/services/draft` | — | 200 | Получение полей черновика |
| 4 | PUT | `/api/services/:id/publish` | JSON: `algorithm_description`, `compression_ratio`, `compression_speed_mbps` | 200 | Публикация черновика |
| 5 | GET | `/api/services/feed` | — | 200 | Первый алгоритм ленты |
| 6 | GET | `/api/services/feed?algorithm_id=1&next=true` | Query: `algorithm_id`, `next=true` | 200 | Следующий алгоритм в ленте |
| 7 | POST | `/api/services/:id/like` | JSON: `{"is_liked": 1}` | 200 | Поставить/снять лайк (1 / 0) |
| 8 | DELETE | `/api/services/:id` | — | 204 | Soft delete (смена статуса на deleted) |
| 9 | POST | `/api/register` | JSON: `full_name`, `email`, `password` | 201 | Регистрация нового пользователя |
| 10 | POST | `/api/login` | JSON: `email`, `password` | 200 | Заглушка аутентификации |


