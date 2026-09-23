import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { OxygenationDegree } from './entities/oxygenation-degree.entity.js';
import { OxygenationDegreeLike } from './entities/oxygenation-degree-like.entity.js';

// поля, которые врач заполняет перед публикацией
export interface OxygenationDegreePublication {
    degreeName: string;
    description: string;
    pfRatioUpperBound: number;
    mortalityRate: number;
}

@Injectable()
export class OxygenationDegreesService {
    constructor(
        @InjectRepository(OxygenationDegree)
        private readonly oxygenationDegreeRepository: Repository<OxygenationDegree>,
        @InjectRepository(OxygenationDegreeLike)
        private readonly oxygenationDegreeLikeRepository: Repository<OxygenationDegreeLike>,
    ) {}

    // плитка: опубликованные степени вместе с лайками,
    // фильтр по верхней границе индекса PaO2/FiO2 выполняет БД
    findForGrid(maxPfRatio?: number): Promise<OxygenationDegree[]> {
        const where: FindOptionsWhere<OxygenationDegree> = { status: 'published' };
        // загрузка без фильтра возвращает все карточки
        if (maxPfRatio !== undefined) {
            where.pfRatioUpperBound = LessThanOrEqual(maxPfRatio);
        }
        return this.oxygenationDegreeRepository.find({
            where,
            relations: { likes: true },
            order: { id: 'ASC' },
        });
    }

    // черновик врача, у каждого не больше одного
    findDraft(creatorId: number): Promise<OxygenationDegree | null> {
        return this.oxygenationDegreeRepository.findOne({
            where: { creatorId, status: 'draft' },
        });
    }

    // лента: findOne - это SELECT ... LIMIT 1, из БД приходит одна строка
    async findForFeed(id?: number, next = false): Promise<OxygenationDegree | null> {
        // вкладка "Лента" без id открывает первую опубликованную степень
        if (id === undefined) {
            return this.findFirstPublished();
        }
        if (!next) {
            // удалённые степени и черновики по id не открываются
            return this.oxygenationDegreeRepository.findOne({
                where: { id, status: 'published' },
            });
        }
        // следующая опубликованная после текущей, после последней - снова первая
        const nextDegree = await this.oxygenationDegreeRepository.findOne({
            where: { id: MoreThan(id), status: 'published' },
            order: { id: 'ASC' },
        });
        return nextDegree ?? this.findFirstPublished();
    }

    private findFirstPublished(): Promise<OxygenationDegree | null> {
        return this.oxygenationDegreeRepository.findOne({
            where: { status: 'published' },
            order: { id: 'ASC' },
        });
    }

    // количество лайков одной степени: SELECT COUNT(*) по таблице м-м
    countLikes(oxygenationDegreeId: number): Promise<number> {
        return this.oxygenationDegreeLikeRepository.count({
            where: { oxygenationDegreeId },
        });
    }

    // кнопка "Далее": черновик создаётся только с названием,
    // фото и видео на сервер не передаются, их url остаются пустыми
    async createDraft(creatorId: number, degreeName: string): Promise<void> {
        const existingDraft = await this.findDraft(creatorId);
        if (existingDraft) {
            return;
        }
        await this.oxygenationDegreeRepository.insert({
            degreeName,
            creatorId,
            status: 'draft',
        });
    }

    // кнопка "Опубликовать": черновик получает описание, поля по теме,
    // статус "опубликован" и дату формирования
    async publishDraft(
        creatorId: number,
        publication: OxygenationDegreePublication,
    ): Promise<number | null> {
        const draft = await this.findDraft(creatorId);
        if (!draft) {
            return null;
        }
        await this.oxygenationDegreeRepository.update(
            { id: draft.id },
            { ...publication, status: 'published', formedAt: new Date() },
        );
        return draft.id;
    }

    // логическое удаление без ORM: SQL-запрос UPDATE через курсор
    async deleteDegree(id: number): Promise<void> {
        await this.oxygenationDegreeRepository.query(
            `UPDATE oxygenation_degrees SET status = 'deleted' WHERE id = $1`,
            [id],
        );
    }
}
