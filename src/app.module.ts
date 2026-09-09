import { Module } from '@nestjs/common';
import { OxygenationDegreesModule } from './oxygenation-degrees/oxygenation-degrees.module.js';

@Module({
  imports: [OxygenationDegreesModule],
})
export class AppModule {}
