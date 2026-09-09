import { Module } from '@nestjs/common';
import { OxygenationDegreesService } from './oxygenation-degrees.service.js';
import { OxygenationDegreesController } from './oxygenation-degrees.controller.js';

@Module({
  controllers: [OxygenationDegreesController],
  providers: [OxygenationDegreesService]
})
export class OxygenationDegreesModule {}
