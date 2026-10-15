// степень оксигенации в ответах веб-сервиса: поля самой степени.
// Так отвечают методы черновика: получение, добавление и публикация.
// Незаполненные поля приходят как null. Статус, создатель и даты клиенту не отдаются
export class OxygenationDegreeResponseDto {
  id: number;
  degreeName: string;
  description: string | null;
  imageUrl: string;
  videoUrl: string;
  pfRatioUpperBound: number | null;
  mortalityRate: number | null;
}

// карточка списка: GET /api/oxygenation-degrees
export class OxygenationDegreeCardDto extends OxygenationDegreeResponseDto {
  // количество лайков из таблицы м-м
  likesCount: number;

  // 1 - степень создал текущий врач, 0 - другой
  isCreator: number;
}

// степень в ленте: GET /api/oxygenation-degrees/feed/:id и ответ на лайк
export class OxygenationDegreeFeedDto extends OxygenationDegreeResponseDto {
  // количество лайков из таблицы м-м
  likesCount: number;

  // 1 - текущий врач поставил лайк, 0 - нет
  isLiked: number;
}
