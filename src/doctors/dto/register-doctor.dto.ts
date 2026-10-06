import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// данные нового врача: POST /api/doctors
export class RegisterDoctorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  login: string;

  // сам пароль в БД не хранится, от него сохраняется только хэш
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;
}
