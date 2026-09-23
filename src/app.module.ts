import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from '@nestjs/typeorm';
import { OxygenationDegreesModule } from './oxygenation-degrees/oxygenation-degrees.module.js';

@Module({
  imports: [
    // переменные из .env доступны во всём приложении через ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    // подключение к PostgreSQL, параметры берутся из .env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        // сущности подключаются через TypeOrmModule.forFeature в модуле степеней
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    OxygenationDegreesModule,
  ],
})
export class AppModule {}
