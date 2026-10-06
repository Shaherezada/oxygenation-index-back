// степень оксигенации в ответах веб-сервиса. Набор полей всегда один и тот же,
// незаполненные поля приходят как null. Статус, создатель и даты клиенту не отдаются
export class OxygenationDegreeResponseDto {
  id: number;
  degreeName: string;
  description: string | null;
  imageUrl: string;
  videoUrl: string;
  pfRatioUpperBound: number | null;
  mortalityRate: number | null;
 
  // количество лайков из таблицы м-м
  likesCount: number;
 
  // 1 - степень создал текущий врач, 0 - другой
  isCreator: number;
 
  // 1 - текущий врач поставил лайк, 0 - нет
  isLiked: number;
}