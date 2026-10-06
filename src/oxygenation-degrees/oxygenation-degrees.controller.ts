import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { getCurrentDoctorId } from '../doctors/current-doctor.js';
import { CreateOxygenationDegreeDto } from './dto/create-oxygenation-degree.dto.js';
import { LikeOxygenationDegreeDto } from './dto/like-oxygenation-degree.dto.js';
import { OxygenationDegreeFiltersDto } from './dto/oxygenation-degree-filters.dto.js';
import { OxygenationDegreeResponseDto } from './dto/oxygenation-degree-response.dto.js';
import { PublishOxygenationDegreeDto } from './dto/publish-oxygenation-degree.dto.js';
import { OxygenationDegreesService } from './oxygenation-degrees.service.js';
 
// файлы формы добавления: одно изображение и одно видео
interface OxygenationDegreeFiles {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
}
 
// домен степеней оксигенации: все методы начинаются с /api/oxygenation-degrees
@Controller('oxygenation-degrees')
export class OxygenationDegreesController {
  constructor(
    private readonly oxygenationDegreesService: OxygenationDegreesService,
  ) {}

  // GET /api/oxygenation-degrees[?maxPfRatio=...] - список опубликованных степеней
  @Get()
  getOxygenationDegrees(
    @Query() filters: OxygenationDegreeFiltersDto,
  ): Promise<OxygenationDegreeResponseDto[]> {
    return this.oxygenationDegreesService.findForGrid(
      getCurrentDoctorId(),
      filters.maxPfRatio,
    );
  }
 
  // GET /api/oxygenation-degrees/draft - черновик текущего врача, id не указывается
  @Get('draft')
  getOxygenationDegreeDraft(): Promise<OxygenationDegreeResponseDto> {
    return this.oxygenationDegreesService.findDraft(getCurrentDoctorId());
  }
 
  // GET /api/oxygenation-degrees/feed[/:id][?next=true] - лента
  @Get(['feed', 'feed/:id'])
  getOxygenationDegreeFeed(
    @Param('id', new ParseIntPipe({ optional: true })) id?: number,
    @Query('next') next?: string,
  ): Promise<OxygenationDegreeResponseDto> {
    return this.oxygenationDegreesService.findForFeed(
      getCurrentDoctorId(),
      id,
      next === 'true',
    );
  }
 
  // POST /api/oxygenation-degrees - добавление: название и файлы image, video
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        // фото и короткое видео, не больше 50 МБ каждый файл
        limits: { fileSize: 50 * 1024 * 1024 },
        // в поле image принимается только изображение, в поле video - только видео
        fileFilter: (request, file, callback) => {
          const isAllowed = file.mimetype.startsWith(`${file.fieldname}/`);
          callback(isAllowed ? null : new BadRequestException(), isAllowed);
        },
      },
    ),
  )
  createOxygenationDegree(
    @Body() dto: CreateOxygenationDegreeDto,
    @UploadedFiles() files?: OxygenationDegreeFiles,
  ): Promise<OxygenationDegreeResponseDto> {
    return this.oxygenationDegreesService.createDraft(
      getCurrentDoctorId(),
      dto.degreeName,
      files?.image?.[0],
      files?.video?.[0],
    );
  }

  // PUT /api/oxygenation-degrees/:id - публикация черновика
  @Put(':id')
  publishOxygenationDegree(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishOxygenationDegreeDto,
  ): Promise<OxygenationDegreeResponseDto> {
    return this.oxygenationDegreesService.publishDraft(
      getCurrentDoctorId(),
      id,
      dto,
    );
  }
 
  // DELETE /api/oxygenation-degrees/:id - логическое удаление своей степени
  @Delete(':id')
  deleteOxygenationDegree(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.oxygenationDegreesService.deleteDegree(
      getCurrentDoctorId(),
      id,
    );
  }

  // POST /api/oxygenation-degrees/:id/like - лайк текущего врача
  @Post(':id/like')
  @HttpCode(200)
  likeOxygenationDegree(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeOxygenationDegreeDto,
  ): Promise<OxygenationDegreeResponseDto> {
    return this.oxygenationDegreesService.setLike(
      getCurrentDoctorId(),
      id,
      dto.isLiked,
    );
  }
}