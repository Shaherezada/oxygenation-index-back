import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import type { OxygenationDegree } from './oxygenation-degree.model.js';
import {
    OXYGENATION_MEDIA_BASE_URL,
    OxygenationDegreesService,
} from './oxygenation-degrees.service.js';

// шкала слайдера фильтра по индексу PaO2/FiO2, мм рт. ст.
const PF_RATIO_SCALE = [100, 200, 300, 400, 500]

interface OxygenationDegreeView extends OxygenationDegree{
    likesCount: number;
    imageUrl: string;
    videoUrl: string;
}

@Controller('oxygenation-degrees')
export class OxygenationDegreesController {
    constructor(
        private readonly oxygenationDegreesService: OxygenationDegreesService,
    ) {}

    // GET /oxygenation-degrees[?maxPfRatio=...]
    @Get()
    @Render('grid')
    getOxygenationDegreeGrid(@Query('maxPfRatio') maxPfRatio?: string) {
        const parsedMaxPfRatio = this.parsePfRatio(maxPfRatio);
        const degrees = this.oxygenationDegreesService.findForGrid(parsedMaxPfRatio);

        return {
            pageTitle: 'Степени оксигенации',
            activeTab: 'grid',
            // без фильтра слайдер стоит на максимуме и показываются все степени,
            // после запроса выбранное значение сохраняется в слайдере
            filter: {
                value: parsedMaxPfRatio ?? PF_RATIO_SCALE[PF_RATIO_SCALE.length - 1],
                min: PF_RATIO_SCALE[0],
                max: PF_RATIO_SCALE[PF_RATIO_SCALE.length - 1],
                step: PF_RATIO_SCALE[1] - PF_RATIO_SCALE[0],
                scale: PF_RATIO_SCALE,
            },
            degrees: degrees.map((degree) => this.toView(degree)),
            isEmpty: degrees.length === 0,
        };
    }

    @Get('draft')
    @Render('draft')
    getDraftOxygenationDegree() {
        const draftDegree = this.oxygenationDegreesService.findDraft();

        return {
            pageTitle: 'Добавление степени',
            activeTab: 'draft',
            degree: draftDegree ? this.toView(draftDegree) : null,
        };
    }

    @Get(['feed', 'feed/:id'])
    @Render('feed')
    getOxygenationDegreeFeed(
        @Param('id') id?: string,
        @Query('next') next?: string,
    ) {
        const parsedId = id === undefined ? undefined : Number(id);
        const degree = this.oxygenationDegreesService.findForFeed(
            Number.isFinite(parsedId) ? parsedId : undefined,
            next === 'true',
        );

        return {
            pageTitle: degree ? degree.degreeName : 'Степень не найдена',
            activeTab: 'feed',
            degree: degree ? this.toView(degree) : null,
        };
    }

    private toView(degree: OxygenationDegree): OxygenationDegreeView {
        return {
            ...degree,
            likesCount: degree.likedByUserIds.length,
            imageUrl: `${OXYGENATION_MEDIA_BASE_URL}/${degree.imageKey}`,
            videoUrl: `${OXYGENATION_MEDIA_BASE_URL}/${degree.videoKey}`,
        };
    }

    // пустая или нечисловая строка фильтра означает "показать всё"
    private parsePfRatio(rawValue?: string): number | undefined {
        if (rawValue === undefined || rawValue.trim() === '') {
            return undefined;
        }
        const parsedValue = Number(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }
}
