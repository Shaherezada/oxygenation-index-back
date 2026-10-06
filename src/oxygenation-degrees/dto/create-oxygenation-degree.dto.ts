import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
 
// текстовое поле формы добавления: POST /api/oxygenation-degrees.
// Файлы image и video приходят в той же форме отдельно от DTO
export class CreateOxygenationDegreeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  degreeName: string;
}