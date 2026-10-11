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
* `id` (INT, PK) — Уникальный идентификатор пользователя (автоинкремент)
* `full_name` (VARCHAR(120)) — Имя пользователя
* `email` (VARCHAR(120), UNIQUE) — Электронная почта
* `password` (VARCHAR(255)) — Хэш пароля

### Таблица `compression_algorithms`
* `algorithm_id` (INT, PK) — Уникальный идентификатор алгоритма сжатия (автоинкремент)
* `creator_id` (INT, FK -> users.id) — Идентификатор автора/создателя
* `algorithm_name` (VARCHAR(100)) — Название алгоритма сжатия данных
* `algorithm_description` (TEXT) — Подробное описание алгоритма
* `algorithm_status` (VARCHAR(20)) — Статус ('draft', 'published', 'deleted')
* `image_url` (VARCHAR(255)) — URL фото/графика в хранилище MinIO S3
* `video_url` (VARCHAR(255)) — URL демонстрационного видео в MinIO S3
* `compression_ratio` (NUMERIC(4,2)) — Коэффициент сжатия данных
* `compression_speed_mbps` (INT) — Скорость сжатия данных (МБ/с)
* `created_at` (TIMESTAMP) — Дата создания черновика алгоритма (DEFAULT CURRENT_TIMESTAMP)
* `configured_at` (TIMESTAMP) — Дата завершения настройки и публикации алгоритма

### Таблица `algorithm_likes`
* `like_id` (INT, PK) — Уникальный идентификатор отметки «Нравится» (автоинкремент)
* `user_id` (INT, FK -> users.id) — Идентификатор пользователя
* `algorithm_id` (INT, FK -> compression_algorithms.algorithm_id) — Идентификатор алгоритма


---

## 2. Спецификация REST API

| # | Метод | URL | Тело запроса / Query | Код | Описание |
|---|---|---|---|---|---|
| 1 | POST | `/api/register` | JSON: `full_name`, `email`, `password` | 201 | Регистрация нового исследователя в системе |
| 2 | POST | `/api/login` | JSON: `email`, `password` | 200 | Аутентификация пользователя |
| 3 | POST | `/api/logout` | — | 200 | Завершение сеанса / выход из системы |
| 4 | GET | `/api/compression-algorithms?min_compression_ratio=2.0` | Query: `min_compression_ratio` | 200 | Список алгоритмов каталога с фильтрацией по степени сжатия |
| 5 | POST | `/api/compression-algorithms` | multipart/form-data: `algorithm_name`, `image`, `video` | 201 | Создание/дополнение черновика алгоритма сжатия |
| 6 | GET | `/api/compression-algorithms/draft` | — | 200 | Получение полей текущего черновика алгоритма |
| 7 | PUT | `/api/compression-algorithms/:id/publish` | JSON: `algorithm_description`, `compression_ratio`, `compression_speed_mbps` | 200 | Публикация черновика алгоритма (фиксация `configured_at` и статуса `published`) |
| 8 | GET | `/api/compression-algorithms/feed?algorithm_id=1&next=true` | Query: `algorithm_id`, `next=true` | 200 | Получение алгоритма в ленте (первый или следующий) |
| 9 | POST | `/api/compression-algorithms/:id/like` | JSON: `{"is_liked": 1}` | 200 | Поставить/снять отметку «Нравится» алгоритму (1 / 0) |
| 10 | DELETE | `/api/compression-algorithms/:id` | — | 204 | Soft delete алгоритма (перевод статуса в 'deleted') |