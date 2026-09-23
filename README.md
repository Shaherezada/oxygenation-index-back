# ЛР №2. База данных PostgreSQL и её подключение к бэкенду.

**Цель** данной лабораторной работы — разработка структуры базы данных и её подключение
к бэкенду на `NestJS`. Тема — «Расчёт индекса оксигенации (PaO₂/FiO₂)», `услуга` —
степень оксигенации. Данные степеней переехали из массива в `PostgreSQL`, работа с ними
идёт через `TypeORM`, изображения и видео по-прежнему хранятся в `MinIO`.

## План лабораторной работы

1. `PostgreSQL` и `Adminer` в `Docker` рядом с `MinIO`.
2. Настройки подключения в `.env`, `ConfigModule` и `TypeOrmModule`.
3. Три сущности и миграция ORM отдельной командой.
4. Наполнение БД SQL-скриптом через `Adminer`.
5. Получение, поиск, создание и публикация степеней через `ORM`.
6. Логическое удаление степени SQL-запросом `UPDATE` без `ORM`.
7. Фото и видео по умолчанию для карточек без медиа.

## База данных

| Таблица | Назначение | Ключи |
| --- | --- | --- |
| `doctors` | пользователи — врачи | PK `id` |
| `oxygenation_degrees` | степени оксигенации (услуги) | PK `id`, FK `creatorId` → `doctors` |
| `oxygenation_degree_likes` | лайки, м-м врач — степень | PK `id`, FK `doctorId` → `doctors`, FK `oxygenationDegreeId` → `oxygenation_degrees` |

Каскадного удаления нет, внешние ключи `ON DELETE RESTRICT`. Статус степени —
`draft`, `published` или `deleted` (ограничение `CHECK`). У врача не больше одного
черновика — частичный уникальный индекс по `creatorId` для строк со статусом `draft`.

## Страницы и запросы

| Метод | URL | Что делает | Как |
| --- | --- | --- | --- |
| `GET` | `/oxygenation-degrees/feed[/:id][?next=true]` | лента, из БД одна строка | `ORM` |
| `GET` | `/oxygenation-degrees/draft` | добавление | `ORM` |
| `GET` | `/oxygenation-degrees[?maxPfRatio=200]` | плитка с фильтром | `ORM` |
| `POST` | `/oxygenation-degrees/draft` | «Далее» — создать черновик | `ORM` |
| `POST` | `/oxygenation-degrees/draft/publish` | «Опубликовать» черновик | `ORM` |
| `POST` | `/oxygenation-degrees/:id/delete` | логическое удаление | SQL `UPDATE` |

`JavaScript` на клиенте не используется. Если url изображения или видео в БД пустой
или файл недоступен, показываются фото и видео по умолчанию из `public/media`.

## Запуск

```bash
docker compose up -d
npm install
npm run migrate
npm run start
```

Файл `.env` в репозиторий не попадает, его нужно создать рядом с `package.json`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=oxygenation_user
DB_PASSWORD=oxygenation_password
DB_DATABASE=oxygenation_db
```

`npm run migrate` собирает проект и создаёт таблицы по сущностям (`src/migrate.ts`).
После этого в `Adminer` выполняется `scripts/seed.sql`.

Приложение доступно по адресу http://localhost:3000/oxygenation-degrees

## Adminer

http://localhost:8081 — система `PostgreSQL`, сервер `postgres` (имя контейнера в сети
`Docker`, не `localhost`), пользователь `oxygenation_user`, пароль `oxygenation_password`,
база `oxygenation_db`. Наполнение: «SQL-запрос» → содержимое `scripts/seed.sql` → «Выполнить».

## MinIO

```bash
docker exec -it oxygenation_minio mc alias set myminio http://localhost:9000 root rootpassword
docker exec -it oxygenation_minio mc mb myminio/oxygenation-media
docker exec -it oxygenation_minio mc anonymous set public myminio/oxygenation-media
```

Консоль хранилища — http://localhost:9001, логин `root`, пароль `rootpassword`.
В бакет `oxygenation-media` загружаются изображения и вертикальные видео, их полные
адреса хранятся в колонках `imageUrl` и `videoUrl`.
