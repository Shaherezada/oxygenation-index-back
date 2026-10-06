import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { DoctorResponseDto } from './dto/doctor-response.dto.js';
import { RegisterDoctorDto } from './dto/register-doctor.dto.js';
import { Doctor } from './entities/doctor.entity.js';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  // регистрация: новая строка в таблице doctors
  async register(registration: RegisterDoctorDto): Promise<DoctorResponseDto> {
    // логин в таблице уникален, второго врача с таким же создать нельзя
    const isLoginTaken = await this.doctorRepository.existsBy({
      login: registration.login,
    });
    if (isLoginTaken) {
      throw new ConflictException();
    }

    // в колонку password попадает bcrypt-хэш, а не сам пароль
    const doctor = await this.doctorRepository.save({
      login: registration.login,
      password: await hash(registration.password, 10),
      fullName: registration.fullName,
    });
    return { id: doctor.id, login: doctor.login, fullName: doctor.fullName };
  }
}
