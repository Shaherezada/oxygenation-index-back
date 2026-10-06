import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { DoctorService } from './doctors.service.js';
import { DoctorResponseDto } from './dto/doctor-response.dto.js';
import { RegisterDoctorDto } from './dto/register-doctor.dto.js';

// домен пользователей - врачей: все методы начинаются с /api/doctors
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorService) {}

  // POST /api/doctors - регистрация нового врача
  @Post()
  registerDoctor(@Body() dto: RegisterDoctorDto): Promise<DoctorResponseDto> {
    return this.doctorsService.register(dto);
  }

  // POST /api/doctors/login - аутентификация, заглушка
  // пока текущий врач задан константой в getCurrentDoctorId()
  @Post('login')
  @HttpCode(200)
  loginDoctor(): void {}

  // POST /api/doctors/logout - деавторизация, заглушка
  @Post('logout')
  @HttpCode(200)
  logoutDoctor(): void {}
}
