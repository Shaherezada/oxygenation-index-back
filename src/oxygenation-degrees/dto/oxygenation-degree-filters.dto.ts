import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
 
// параметры списка: GET /api/oxygenation-degrees?maxPfRatio=200
export class OxygenationDegreeFiltersDto {
  // верхняя граница индекса PaO2/FiO2 не выше указанной, мм рт. ст.
  // В адресе параметр приходит строкой, @Type делает из неё число
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPfRatio?: number;
}