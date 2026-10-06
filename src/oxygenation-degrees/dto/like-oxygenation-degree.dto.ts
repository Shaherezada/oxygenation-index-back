import { IsIn } from 'class-validator';
 
// тело запроса POST /api/oxygenation-degrees/:id/like
export class LikeOxygenationDegreeDto {
  // 1 - поставить лайк, 0 - отменить
  @IsIn([0, 1])
  isLiked: number;
}