import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsController } from './doctors.controller.js';
import { DoctorService } from './doctors.service.js';
import { Doctor } from './entities/doctor.entity.js';

@Module({
  // репозиторий таблицы doctors
  imports: [TypeOrmModule.forFeature([Doctor])],
  controllers: [DoctorsController],
  providers: [DoctorService],
})
export class DoctorsModule {}
