import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OxygenationDegreesService } from './oxygenation-degrees.service.js';
import { OxygenationDegreesController } from './oxygenation-degrees.controller.js';
import { Doctor } from './entities/doctor.entity.js';
import { OxygenationDegree } from './entities/oxygenation-degree.entity.js';
import { OxygenationDegreeLike } from './entities/oxygenation-degree-like.entity.js';

@Module({
  // репозитории трёх таблиц; autoLoadEntities добавляет эти сущности в подключение
  imports: [TypeOrmModule.forFeature([Doctor, OxygenationDegree, OxygenationDegreeLike])],
  controllers: [OxygenationDegreesController],
  providers: [OxygenationDegreesService]
})
export class OxygenationDegreesModule {}
