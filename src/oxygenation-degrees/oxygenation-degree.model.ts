export type OxygenationDegreeStatus = 'draft' | 'published' | 'deleted'

export interface OxygenationDegree {
    id: number;
    degreeName: string;
    shortDescription: string;
    description: string;

    // два поля по предметной области

    // верхняя граница индекса PaO2/FiO2 для данной степени, мм рт. ст.
    // по этому полю также выполняется фильтрация на странице с плиткой
    pfRatioUpperBound: number;

    // летальность для данной степени, %
    mortalityRate: number;

    // ключи объектов в MinIO
    imageKey: string;
    videoKey: string;

    status: OxygenationDegreeStatus;
    likedByUserIds: number[];
}
