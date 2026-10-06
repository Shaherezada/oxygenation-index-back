import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OxygenationDegreesService } from './oxygenation-degrees.service.js';
import { OxygenationDegreesController } from './oxygenation-degrees.controller.js';
import { OxygenationDegree } from './entities/oxygenation-degree.entity.js';
import { OxygenationDegreeLike } from './entities/oxygenation-degree-like.entity.js';
import { OxygenationMediaService } from './oxygenation-media.service.js';

@Module({
  // репозитории таблиц степней и лайков; autoLoadEntities добавляет эти сущности в подключение
  imports: [
    TypeOrmModule.forFeature([OxygenationDegree, OxygenationDegreeLike]),
  ],
  controllers: [OxygenationDegreesController],
  providers: [OxygenationDegreesService, OxygenationMediaService],
})
export class OxygenationDegreesModule {}
