import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, Not, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { OxygenationDegreeResponseDto } from './dto/oxygenation-degree-response.dto.js';
import { PublishOxygenationDegreeDto } from './dto/publish-oxygenation-degree.dto.js';
import { OxygenationDegree } from './entities/oxygenation-degree.entity.js';
import { OxygenationDegreeLike } from './entities/oxygenation-degree-like.entity.js';
import { OxygenationMediaService } from './oxygenation-media.service.js';

@Injectable()
export class OxygenationDegreesService {
  constructor(
    @InjectRepository(OxygenationDegree)
    private readonly oxygenationDegreeRepository: Repository<OxygenationDegree>,
    @InjectRepository(OxygenationDegreeLike)
    private readonly oxygenationDegreeLikeRepository: Repository<OxygenationDegreeLike>,
    private readonly oxygenationMediaService: OxygenationMediaService,
  ) {}

  // список: опубликованные степени вместе с лайками,
  // фильтр по верхней границе индекса PaO2/FiO2 выполняет БД
  async findForGrid(
      doctorId: number,
      maxPfRatio?: number,
    ): Promise<OxygenationDegreeResponseDto[]> {    
    const where: FindOptionsWhere<OxygenationDegree> = { status: 'published' };
    // запрос без фильтра возвращает все опубликованные степени
    if (maxPfRatio !== undefined) {
      where.pfRatioUpperBound = LessThanOrEqual(maxPfRatio);
    }
    const degrees = await this.oxygenationDegreeRepository.find({
      where,
      relations: { likes: true },
      order: { id: 'ASC' },
    });

    // лайки каждой степени загружены вместе с ней из таблицы м-м
    return degrees.map((degree) =>
      this.toResponseDto(
        degree,
        doctorId,
        degree.likes.length,
        degree.likes.some((like) => like.doctorId === doctorId),
      ),
    );
  }

  // черновик врача, у каждого не больше одного
  async findDraft(doctorId: number): Promise<OxygenationDegreeResponseDto> {
    const draft = await this.oxygenationDegreeRepository.findOne({
      where: { creatorId: doctorId, status: 'draft' },
    });
    if (!draft) {
      throw new NotFoundException();
    }
    return this.toResponseDtoWithLikes(draft, doctorId);
  }

  // лента: findOne - это SELECT ... LIMIT 1, из БД приходит одна строка
  async findForFeed(
    doctorId: number,
    id?: number,
    next = false,
  ): Promise<OxygenationDegreeResponseDto> {
    let degree: OxygenationDegree | null;
    if (id === undefined) {
      // лента без id открывает первую опубликованную степень
      degree = await this.findFirstPublished();
    } else if (!next) {
      // удалённые степени и черновики по id не открываются
      degree = await this.oxygenationDegreeRepository.findOne({
        where: { id, status: 'published' },
      });
    } else {
      // следующая опубликованная после текущей, после последней - снова первая
      const nextDegree = await this.oxygenationDegreeRepository.findOne({
        where: { id: MoreThan(id), status: 'published' },
        order: { id: 'ASC' },
      });
      degree = nextDegree ?? (await this.findFirstPublished());
    }
 
    if (!degree) {
      throw new NotFoundException();
    }
    return this.toResponseDtoWithLikes(degree, doctorId);
  }

  private findFirstPublished(): Promise<OxygenationDegree | null> {
    return this.oxygenationDegreeRepository.findOne({
      where: { status: 'published' },
      order: { id: 'ASC' },
    });
  }

  // добавление: создаётся черновик с названием, файлы уходят в MinIO,
  // в БД сохраняются их url
  async createDraft(
    doctorId: number,
    degreeName: string,
    image?: Express.Multer.File,
    video?: Express.Multer.File,
  ): Promise<OxygenationDegreeResponseDto> {
    // второй черновик врачу создать нельзя
    const hasDraft = await this.oxygenationDegreeRepository.existsBy({
      creatorId: doctorId,
      status: 'draft',
    });
    if (hasDraft) {
      throw new ConflictException();
    }

    // без файла url остаётся пустым, и клиент покажет фото или видео по умолчанию
    const imageUrl = image
      ? await this.oxygenationMediaService.uploadOxygenationDegreeFile(image)
      : '';
    const videoUrl = video
      ? await this.oxygenationMediaService.uploadOxygenationDegreeFile(video)
      : '';

    await this.oxygenationDegreeRepository.insert({
      degreeName,
      imageUrl,
      videoUrl,
      status: 'draft',
      creatorId: doctorId,
    });
    return this.findDraft(doctorId);
  }

  // кнопка "Опубликовать": черновик получает описание, поля по теме,
  // статус "опубликован" и дату формирования
  async publishDraft(
    doctorId: number,
    id: number,
    publication: PublishOxygenationDegreeDto,
  ): Promise<OxygenationDegreeResponseDto> {
    // условие WHERE пропускает только свой черновик: опубликовать чужую,
    // уже опубликованную или удалённую степень нельзя
    const updateResult = await this.oxygenationDegreeRepository.update(
      { id, creatorId: doctorId, status: 'draft' },
      { ...publication, status: 'published', formedAt: new Date() },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
    return this.findForFeed(doctorId, id);
  }

  // логическое удаление через ORM: статус меняется на "удалён".
  // Удалить можно только свою степень, вернуть её из удалённых нельзя
  async deleteDegree(doctorId: number, id: number): Promise<void> {
    const updateResult = await this.oxygenationDegreeRepository.update(
      { id, creatorId: doctorId, status: Not('deleted') },
      { status: 'deleted' },
    );
    if (!updateResult.affected) {
      throw new NotFoundException();
    }
  }

    // лайк текущего врача: 1 - поставить, 0 - отменить
  async setLike(
    doctorId: number,
    id: number,
    isLiked: number,
  ): Promise<OxygenationDegreeResponseDto> {
    // лайкнуть можно только опубликованную степень, иначе здесь будет 404
    const degree = await this.findForFeed(doctorId, id);
 
    // строка в таблице м-м добавляется или удаляется, только если лайк меняется
    const like = { doctorId, oxygenationDegreeId: id };
    if (isLiked === 1 && degree.isLiked === 0) {
      await this.oxygenationDegreeLikeRepository.insert(like);
    }
    if (isLiked === 0 && degree.isLiked === 1) {
      await this.oxygenationDegreeLikeRepository.delete(like);
    }
    return this.findForFeed(doctorId, id);
  }
 
  // лайки одной степени - два коротких запроса к таблице м-м:
  // SELECT COUNT(*) и проверка, есть ли строка текущего врача
  private async toResponseDtoWithLikes(
    degree: OxygenationDegree,
    doctorId: number,
  ): Promise<OxygenationDegreeResponseDto> {
    const likesCount = await this.oxygenationDegreeLikeRepository.count({
      where: { oxygenationDegreeId: degree.id },
    });
    const isLiked = await this.oxygenationDegreeLikeRepository.existsBy({
      oxygenationDegreeId: degree.id,
      doctorId,
    });
    return this.toResponseDto(degree, doctorId, likesCount, isLiked);
  }

  // сериализация: из модели в ответ переносятся только нужные клиенту поля,
  // к ним добавляются количество лайков и два признака 0/1
  private toResponseDto(
    degree: OxygenationDegree,
    doctorId: number,
    likesCount: number,
    isLiked: boolean,
  ): OxygenationDegreeResponseDto {
    return {
      id: degree.id,
      degreeName: degree.degreeName,
      description: degree.description,
      imageUrl: degree.imageUrl,
      videoUrl: degree.videoUrl,
      pfRatioUpperBound: degree.pfRatioUpperBound,
      mortalityRate: degree.mortalityRate,
      likesCount,
      isCreator: degree.creatorId === doctorId ? 1 : 0,
      isLiked: isLiked ? 1 : 0,
    };
  }
}