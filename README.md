# ЛР №3. Веб-сервис для SPA

Веб-сервис на `NestJS` по теме «Расчёт индекса оксигенации (PaO₂/FiO₂)»: `услуга` — степень оксигенации, пользователи — врачи.
Данные отдаются в `JSON` по `REST`, БД — `PostgreSQL` через `TypeORM`, изображения и видео степеней хранятся в `MinIO`.

## Методы веб-сервиса

Адрес каждого метода начинается с `http://localhost:3000/api`.

| № | Метод | URL | Что принимает | Что возвращает |
| --- | --- | --- | --- | --- |
| 1 | `GET` | `/oxygenation-degrees` | параметр `maxPfRatio`, необязательный | `200` и массив степеней |
| 2 | `GET` | `/oxygenation-degrees/feed`, `/oxygenation-degrees/feed/:id` | параметр `next=true`, необязательный | `200` и степень, `404` |
| 3 | `GET` | `/oxygenation-degrees/draft` | — | `200` и степень, `404` |
| 4 | `POST` | `/oxygenation-degrees` | `form-data`: поле `degreeName`, файлы `image` и `video` | `201` и степень, `409` |
| 5 | `PUT` | `/oxygenation-degrees/:id` | `JSON`: `description`, `pfRatioUpperBound`, `mortalityRate` | `200` и степень, `404` |
| 6 | `DELETE` | `/oxygenation-degrees/:id` | — | `200` без тела, `404` |
| 7 | `POST` | `/oxygenation-degrees/:id/like` | `JSON`: `isLiked` — `1` или `0` | `200` и степень, `404` |
| 8 | `POST` | `/doctors` | `JSON`: `login`, `password`, `fullName` | `201` и врач без пароля, `409` |
| 9 | `POST` | `/doctors/login` | — | `200`, заглушка до ЛР4 |
| 10 | `POST` | `/doctors/logout` | — | `200`, заглушка до ЛР4 |

1. **Список** опубликованных степеней; с `maxPfRatio` — только те, у которых верхняя граница индекса не выше указанной.
2. **Лента**: одна опубликованная степень. Без `id` — первая, с `id` — указанная, с `?next=true` — следующая, после последней снова первая.
3. **Черновик** текущего врача; `404` — черновика нет.
4. **Добавление** черновика с названием. Файлы сохраняются в `MinIO`, в БД записываются их `url`. `409` — черновик у врача уже есть.
5. **Публикация** своего черновика: заполняются описание и два поля по теме, статус меняется на `published`, ставится дата формирования.
6. **Удаление** своей степени, логическое: статус меняется на `deleted`.
7. **Лайк** текущего врача опубликованной степени: `1` ставит, `0` отменяет.
8. **Регистрация**: в БД сохраняется `bcrypt`-хэш пароля. `409` — логин уже занят.

### Степень в ответе

```json
{
  "id": 2,
  "degreeName": "ОРДС лёгкой степени",
  "description": "Лёгкая степень острого респираторного дистресс-синдрома…",
  "imageUrl": "http://localhost:9000/oxygenation-media/mild-ards.jpg",
  "videoUrl": "http://localhost:9000/oxygenation-media/mild-ards.mp4",
  "pfRatioUpperBound": 300,
  "mortalityRate": 27,
  "likesCount": 4,
  "isCreator": 1,
  "isLiked": 1
}
```

Незаполненные поля равны `null`. `likesCount` — количество лайков, `isCreator` и `isLiked` — `1` или `0` для текущего врача.

## Правила

- Статус меняется только так: черновик → опубликована → удалена. Степени в статусе `deleted` клиенту не передаются.
- Системные поля (`id`, `status`, `creatorId`, `createdAt`, `formedAt`) с клиента не принимаются: поле, которого нет в `DTO`, даёт `400`.
- Текущий врач задан константой в функции-`singleton` `getCurrentDoctorId()` (`src/doctors/current-doctor.ts`).
- При ошибке возвращается только код состояния, тело пустое: `400` — неверные данные, `404` — степени нет или она недоступна, `409` — черновик или логин уже есть.

## Таблицы БД

| Таблица | Колонки |
| --- | --- |
| `doctors` | `id`, `login` (уникальный), `password` (`bcrypt`-хэш), `fullName` |
| `oxygenation_degrees` | `id`, `degreeName`, `description`, `status`, `imageUrl`, `videoUrl`, `pfRatioUpperBound`, `mortalityRate`, `createdAt`, `formedAt`, `creatorId` → `doctors.id` |
| `oxygenation_degree_likes` | `id`, `doctorId` → `doctors.id`, `oxygenationDegreeId` → `oxygenation_degrees.id` |

Внешние ключи `ON DELETE RESTRICT`, статус ограничен `CHECK`. У врача не больше одного черновика (частичный уникальный индекс по `creatorId`), пара врач — степень в лайках уникальна.

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
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=root
MINIO_SECRET_KEY=rootpassword
MINIO_BUCKET=oxygenation-media
```

Бакет в `MinIO` создаётся один раз и открывается на чтение:

```bash
docker exec -it oxygenation_minio mc alias set myminio http://localhost:9000 root rootpassword
docker exec -it oxygenation_minio mc mb myminio/oxygenation-media
docker exec -it oxygenation_minio mc anonymous set public myminio/oxygenation-media
```

## Сервисы

- **Postman**: коллекция из 10 запросов — `postman/oxygenation-index.postman_collection.json`. Файлы `image` и `video` выбираются вручную.
- **Adminer**: http://localhost:8081 — система `PostgreSQL`, сервер `postgres`, пользователь `oxygenation_user`, пароль `oxygenation_password`, база `oxygenation_db`.
- **Консоль MinIO**: http://localhost:9001 — логин `root`, пароль `rootpassword`.