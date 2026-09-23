import { DataSource } from 'typeorm';
import { Doctor } from './oxygenation-degrees/entities/doctor.entity.js';
import { OxygenationDegree } from './oxygenation-degrees/entities/oxygenation-degree.entity.js';
import { OxygenationDegreeLike } from './oxygenation-degrees/entities/oxygenation-degree-like.entity.js';
 
// Миграция ORM: таблицы создаются по сущностям отдельной командой npm run migrate,
// а не при каждом запуске приложения. Переменные читаются из .env (node --env-file)
const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Doctor, OxygenationDegree, OxygenationDegreeLike],
});
 
async function run() {
    await dataSource.initialize();
    // CREATE TABLE / ALTER TABLE по классам сущностей
    await dataSource.synchronize();
    console.log('Миграции выполнены успешно.');
    await dataSource.destroy();
    process.exit(0);
}
 
run().catch((err) => {
    console.error('Ошибка миграций:', err);
    process.exit(1);
});