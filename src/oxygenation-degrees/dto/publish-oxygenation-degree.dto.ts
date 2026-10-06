import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
 
// поля, которые врач заполняет перед публикацией: PUT /api/oxygenation-degrees/:id
export class PublishOxygenationDegreeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
 
  // верхняя граница индекса PaO2/FiO2, мм рт. ст.
  @IsInt()
  @Min(0)
  pfRatioUpperBound: number;
 
  // летальность для данной степени, %
  @IsInt()
  @Min(0)
  @Max(100)
  mortalityRate: number;
}