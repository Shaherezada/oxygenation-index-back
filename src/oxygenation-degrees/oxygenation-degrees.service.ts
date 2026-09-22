import { Injectable } from '@nestjs/common';
import type { OxygenationDegree } from './oxygenation-degree.model.js'

// адрес бакета MinIO
export const OXYGENATION_MEDIA_BASE_URL = 
    'http://localhost:9000/oxygenation-media'

@Injectable()
export class OxygenationDegreesService {
    // границы взяты напрямую из MDCalc
    // mdcalc.com/calc/4062/horowitz-index-lung-function-p-f-ratio#evidence
    // остальные клинические утверждения в коллекции основаны на англояз. источниках

    private readonly oxygenationDegrees: OxygenationDegree[] = [
        {
            id: 1,
            degreeName: 'Нормальная оксигенация',
            shortDescription: 'Индекс 400-500 мм рт. ст., газообмен не нарушен',
            description:
                'Расчётное отношение PaO2/FiO2 в диапазоне 400-500 мм рт. ст. соответствует ' +
                'нормальному газообмену в лёгких. Например, при PaO2 95 мм рт. ст. и дыхании ' +
                'атмосферным воздухом (FiO2 = 0,21) индекс равен 452 мм рт. ст. Признаков ' +
                'острого респираторного дистресс-синдрома нет, респираторная поддержка не требуется.',
            pfRatioUpperBound: 500,
            // ОРДС нет, поэтому летальность от ОРДС к этой степени очевидно не применима
            mortalityRate: 0,
            imageKey: 'normal-oxygenation.jpg',
            videoKey: 'normal-oxygenation.mp4',
            status: 'published',
            likedByUserIds: [4, 11, 27, 38],
        },
        {
            id: 2,
            degreeName: 'ОРДС лёгкой степени',
            shortDescription: 'Индекс 200-300 мм рт. ст. при ПДКВ не менее 5 см вод. ст.',
            description:
                'Лёгкая степень острого респираторного дистресс-синдрома по Берлинскому ' +
                'определению: 200 < PaO2/FiO2 <= 300 мм рт. ст. при положительном давлении ' +
                'конца выдоха (ПДКВ) не менее 5 см вод. ст. Госпитальная летальность по данным ' +
                'ARDS Definition Task Force составляет около 27 %. Показана неинвазивная ' +
                'вентиляция лёгких или высокопоточная оксигенотерапия.',
            pfRatioUpperBound: 300,
            mortalityRate: 27,
            imageKey: 'mild-ards.jpg',
            videoKey: 'mild-ards.mp4',
            status: 'published',
            likedByUserIds: [4, 8, 15, 19, 27, 33, 41],
        },
        {
            id: 3,
            degreeName: 'ОРДС средней степени',
            shortDescription: 'Индекс 100-200 мм рт. ст. при ПДКВ не менее 5 см вод. ст.',
            description:
                'Умеренная (средняя) степень ОРДС: 100 < PaO2/FiO2 <= 200 мм рт. ст. при ПДКВ ' +
                'не менее 5 см вод. ст. Госпитальная летальность около 32 %. Требуется ' +
                'инвазивная ИВЛ с протективными параметрами: дыхательный объём 6 мл/кг должной ' +
                'массы тела, давление плато не выше 30 см вод. ст. (ARDSNet ARMA, 2000).',
            pfRatioUpperBound: 200,
            mortalityRate: 32,
            imageKey: 'moderate-ards.jpg',
            videoKey: 'moderate-ards.mp4',
            status: 'published',
            likedByUserIds: [8, 15, 27, 33, 41, 52],
        },
        {
            id: 4,
            degreeName: 'ОРДС тяжёлой степени',
            shortDescription: 'Индекс не выше 100 мм рт. ст. при ПДКВ не менее 5 см вод. ст.',
            description:
                'Тяжёлая степень ОРДС: PaO2/FiO2 <= 100 мм рт. ст. при ПДКВ не менее 5 см вод. ст. ' +
                'Летальность достигает 45 %. Показана прон-позиция не менее 16 часов в сутки ' +
                '(PROSEVA, 2013) и оценка показаний к экстракорпоральной мембранной оксигенации. ' +
                'Рутинная миорелаксация после исследования ROSE (2019) больше не рекомендуется.',
            pfRatioUpperBound: 100,
            mortalityRate: 45,
            imageKey: 'severe-ards.jpg',
            videoKey: 'severe-ards.mp4',
            status: 'published',
            likedByUserIds: [8, 15, 22, 27, 33, 41, 52, 60, 71],
        },
        {
            id: 5,
            degreeName: 'Рефрактерная гипоксемия',
            shortDescription: 'Индекс ниже 80 мм рт. ст., показание к ЭКМО',
            description:
                'Рефрактерная гипоксемия: PaO2/FiO2 сохраняется ниже 80 мм рт. ст. более 6 часов ' +
                'несмотря на протективную ИВЛ, прон-позицию и миорелаксацию. По критериям отбора ' +
                'исследования EOLIA рассматривается вено-венозная экстракорпоральная мембранная ' +
                'оксигенация. При продолжении конвенциональной ИВЛ 60-дневная летальность ' +
                'составляет 46 %.',
            pfRatioUpperBound: 80,
            mortalityRate: 46,
            imageKey: 'refractory-hypoxemia.jpg',
            videoKey: 'refractory-hypoxemia.mp4',
            status: 'published',
            likedByUserIds: [15, 22, 33, 41, 52, 60],
        },
        {
        // единственная степень в статусе "черновик"
        // она открывается на странице добавления
        id: 6,
        degreeName: 'ОРДС на вено-венозной ЭКМО',
        shortDescription: 'Индекс ниже 80 мм рт. ст. на экстракорпоральной поддержке',
        description:
            'Тяжёлый ОРДС, переведённый на вено-венозную экстракорпоральную мембранную ' +
            'оксигенацию. В исследовании EOLIA раннее начало ЭКМО при PaO2/FiO2 ниже ' +
            '80 мм рт. ст. снижало 60-дневную летальность до 35 % против 46 % на ' +
            'конвенциональной ИВЛ. Различие не достигло статистической значимости, ' +
            'поэтому показания к ЭКМО остаются предметом обсуждения.',
        pfRatioUpperBound: 80,
        mortalityRate: 35,
        imageKey: 'ecmo-ards.jpg',
        videoKey: 'ecmo-ards.mp4',
        status: 'draft',
        likedByUserIds: [],
        },
        {
        // удалённая степень: устаревшая градация, в интерфейсе не отображается
        id: 7,
        degreeName: 'Острое повреждение лёгких (ОПЛ)',
        shortDescription: 'Устаревшая градация AECC 1994, отменена в 2012 году',
        description:
            'Категория «острое повреждение лёгких» (ОПЛ, ALI) с порогом PaO2/FiO2 <= 300 мм рт. ст. ' +
            'использовалась по критериям Американо-Европейской согласительной конференции 1994 года. ' +
            'Берлинское определение 2012 года упразднило этот термин, заменив его лёгкой степенью ' +
            'ОРДС, поэтому запись переведена в статус «удалена». Пулированная летальность по ' +
            'публикациям 1994-2006 годов составляла 43 %.',
        pfRatioUpperBound: 300,
        mortalityRate: 43,
        imageKey: 'acute-lung-injury.jpg',
        videoKey: 'acute-lung-injury.mp4',
        status: 'deleted',
        likedByUserIds: [15],
        },
    ];
    
    findPublished(): OxygenationDegree[] {
        return this.oxygenationDegrees.filter(
            (degree) => degree.status === 'published'
        );
    }

    // фильтрация плитки по верхней границке индекса PaO2/FiO2
    findForGrid(maxPfRatio?: number): OxygenationDegree[] {
        const publishedDegrees = this.findPublished();
        // загрузка без фильтра возвращает все карточки
        if (maxPfRatio === undefined) {
            return publishedDegrees;
        }
        return publishedDegrees.filter(
            (degree) => degree.pfRatioUpperBound <= maxPfRatio
        );
    }
    
    findDraft(): OxygenationDegree | undefined {
        return this.oxygenationDegrees.find(
            (degree) => degree.status === 'draft'
        );
    }

    findForFeed(id?: number, next = false): OxygenationDegree | undefined {
        const publishedDegrees = this.findPublished();
        if (publishedDegrees.length === 0) {
            return undefined;
        }
        if (id === undefined) {
            return publishedDegrees[0];
        }
        const currentIndex = publishedDegrees.findIndex(
            (degree) => degree.id === id
        );
        if (currentIndex === -1) {
            return undefined;
        }
        if (!next) {
            return publishedDegrees[currentIndex];
        }
        return publishedDegrees[(currentIndex + 1) % publishedDegrees.length];
    }
}
