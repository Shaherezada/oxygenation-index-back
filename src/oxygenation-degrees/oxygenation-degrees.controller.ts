import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Redirect,
    Render,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { OxygenationDegree } from './entities/oxygenation-degree.entity.js';
import { OxygenationDegreesService } from './oxygenation-degrees.service.js';

// шкала слайдера фильтра по индексу PaO2/FiO2, мм рт. ст.
const PF_RATIO_SCALE = [100, 200, 300, 400, 500]

// авторизации пока нет, поэтому все действия выполняет один врач из таблицы doctors
const CURRENT_DOCTOR_ID = 1;

// поля формы публикации, из POST-запроса они приходят строками
interface PublishDraftForm {
    degreeName?: string;
    description?: string;
    pfRatioUpperBound?: string;
    mortalityRate?: string;
}

interface OxygenationDegreeView extends OxygenationDegree{
    likesCount: number;
}

@Controller('oxygenation-degrees')
export class OxygenationDegreesController {
    constructor(
        private readonly oxygenationDegreesService: OxygenationDegreesService,
    ) {}

    // GET /oxygenation-degrees[?maxPfRatio=...]
    @Get()
    @Render('oxygenationDegreeGrid')
    async getOxygenationDegreeGrid(@Query('maxPfRatio') maxPfRatio?: string) {
        const parsedMaxPfRatio = this.parseNumber(maxPfRatio);
        const degrees = await this.oxygenationDegreesService.findForGrid(parsedMaxPfRatio);

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
            // лайки каждой степени загружены вместе с ней из таблицы м-м
            degrees: degrees.map((degree) => this.toView(degree, degree.likes.length)),
            isEmpty: degrees.length === 0,
        };
    }

    // GET /oxygenation-degrees/draft
    @Get('draft')
    @Render('oxygenationDegreeDraft')
    async getDraftOxygenationDegree() {
        const draftDegree = await this.oxygenationDegreesService.findDraft(CURRENT_DOCTOR_ID);

        return {
            pageTitle: 'Добавление степени',
            activeTab: 'draft',
            // нет черновика - форма создания с кнопкой "Далее",
            // есть - заполненная форма с кнопкой "Опубликовать"
            degree: draftDegree,
        };
    }

    // POST /oxygenation-degrees/draft - кнопка "Далее"
    @Post('draft')
    @Redirect('/oxygenation-degrees/draft', 302)
    async createDraftOxygenationDegree(@Body('degreeName') degreeName?: string) {
        const trimmedName = degreeName?.trim();
        if (trimmedName) {
            await this.oxygenationDegreesService.createDraft(CURRENT_DOCTOR_ID, trimmedName);
        }
    }

    // POST /oxygenation-degrees/draft/publish - кнопка "Опубликовать"
    @Post('draft/publish')
    @Redirect('/oxygenation-degrees/draft', 302)
    async publishDraftOxygenationDegree(@Body() form: PublishDraftForm) {
        const degreeName = form.degreeName?.trim();
        const description = form.description?.trim();
        const pfRatioUpperBound = this.parseNumber(form.pfRatioUpperBound);
        const mortalityRate = this.parseNumber(form.mortalityRate);
        // не все поля заполнены - остаёмся на странице черновика
        if (!degreeName || !description
            || pfRatioUpperBound === undefined || mortalityRate === undefined) {
            return;
        }

        const publishedId = await this.oxygenationDegreesService.publishDraft(
            CURRENT_DOCTOR_ID,
            { degreeName, description, pfRatioUpperBound, mortalityRate },
        );
        // опубликованная степень сразу открывается в ленте
        if (publishedId !== null) {
            return { url: `/oxygenation-degrees/feed/${publishedId}` };
        }
    }

    // GET /oxygenation-degrees/feed[/:id][?next=true]
    @Get(['feed', 'feed/:id'])
    @Render('oxygenationDegreeFeed')
    async getOxygenationDegreeFeed(
        @Res({ passthrough: true }) response: Response,
        @Param('id') id?: string,
        @Query('next') next?: string,
    ) {
        const parsedId = id === undefined ? undefined : Number(id);
        const degree = await this.oxygenationDegreesService.findForFeed(
            Number.isFinite(parsedId) ? parsedId : undefined,
            next === 'true',
        );

        // удалённую или несуществующую степень посмотреть нельзя
        if (!degree) {
            response.status(404);
            return {
                pageTitle: 'Степень не найдена',
                activeTab: 'feed',
                degree: null,
            };
        }

        const likesCount = await this.oxygenationDegreesService.countLikes(degree.id);
        return {
            pageTitle: degree.degreeName,
            activeTab: 'feed',
            degree: this.toView(degree, likesCount),
        };
    }

    // POST /oxygenation-degrees/:id/delete - корзина на карточке плитки
    @Post(':id/delete')
    @Redirect('/oxygenation-degrees', 302)
    async deleteOxygenationDegree(@Param('id', ParseIntPipe) id: number) {
        await this.oxygenationDegreesService.deleteDegree(id);
    }

    private toView(degree: OxygenationDegree, likesCount: number): OxygenationDegreeView {
        return {
            ...degree,
            likesCount,
        };
    }

    // пустая или нечисловая строка означает "значение не задано"
    private parseNumber(rawValue?: string): number | undefined {
        if (rawValue === undefined || rawValue.trim() === '') {
            return undefined;
        }
        const parsedValue = Number(rawValue);
        return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }
}
