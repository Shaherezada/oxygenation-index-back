import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as Minio from 'minio';
 
// загрузка фото и видео степеней в бакет MinIO
@Injectable()
export class OxygenationMediaService {
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;
  // адрес бакета, с него начинается url каждого файла
  private readonly bucketUrl: string;
 
  constructor(config: ConfigService) {
    const endPoint = config.get('MINIO_ENDPOINT', 'localhost');
    const port = Number(config.get('MINIO_PORT', 9000));
    this.bucketName = config.get('MINIO_BUCKET', 'oxygenation-media');
    this.bucketUrl = `http://${endPoint}:${port}/${this.bucketName}`;
 
    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL: false,
      accessKey: config.get('MINIO_ACCESS_KEY'),
      secretKey: config.get('MINIO_SECRET_KEY'),
    });
  }

   // кладёт файл в MinIO и возвращает его url для колонки imageUrl или videoUrl
  async uploadOxygenationDegreeFile(
    file: Express.Multer.File,
  ): Promise<string> {
    // имя генерируется на латинице, исходное имя файла не используется;
    // расширение берётся из типа содержимого: image/jpeg -> jpeg, video/mp4 -> mp4
    const extension = file.mimetype.split('/')[1];
    const fileName = `oxygenation-degree-${randomUUID()}.${extension}`;
 
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );
    return `${this.bucketUrl}/${fileName}`;
  }
}