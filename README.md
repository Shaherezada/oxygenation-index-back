# ЛР №1. Дизайн приложения и базовая шаблонизация услуг.

**Цель** данной лабораторной работы — знакомство с разработкой бэкенда на `NestJS` 
и разработка дизайна для трёх страниц. В ходе выполнения работы реализовано приложение 
по теме «Расчёт индекса оксигенации (PaO₂/FiO₂)», где `услуга` — это степень оксигенации. 
Данные берутся из одной коллекции без использования БД, изображения и видео хранятся в `MinIO`.

## План лабораторной работы

1. Дизайн трёх страниц в `Figma` по стилистике сайта [MDCalc](https://www.mdcalc.com/).
2. Развёртывание объектного хранилища `MinIO` в `Docker`.
3. Модель и коллекция степеней оксигенации.
4. Три `GET`-запроса и контроллер для них.
5. Шаблонизация страниц в `Handlebars`.
6. Стили приложения в отдельном файле `CSS`.

## Страницы и запросы

| Метод | URL | Страница |
| --- | --- | --- |
| `GET` | `/oxygenation-degrees/feed[/:id][?next=true]` | лента |
| `GET` | `/oxygenation-degrees/draft` | добавление |
| `GET` | `/oxygenation-degrees[?maxPfRatio=200]` | плитка с фильтром |

`JavaScript` на клиенте не используется: описание раскрывается через
`<details>/<summary>`, фильтрация выполняется на сервере обычной формой
с `method="get"`.

## Запуск

```bash
npm install
npm run start
```

Приложение доступно по адресу http://localhost:3000/oxygenation-degrees

## MinIO

```bash
docker compose up -d
docker exec -it oxygenation_minio mc alias set myminio http://localhost:9000 root rootpassword
docker exec -it oxygenation_minio mc mb myminio/oxygenation-media
docker exec -it oxygenation_minio mc anonymous set public myminio/oxygenation-media
```

Консоль хранилища — http://localhost:9001, логин `root`, пароль `rootpassword`.
В бакет `oxygenation-media` загружаются изображения и вертикальные видео под
ключами из полей `imageKey` и `videoKey` коллекции.
