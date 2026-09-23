import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Doctor } from './doctor.entity.js';
import { OxygenationDegreeLike } from './oxygenation-degree-like.entity.js';
 
export type OxygenationDegreeStatus = 'draft' | 'published' | 'deleted'
 
// степень оксигенации - услуга
@Entity('oxygenation_degrees')
// статус - обычная колонка, справочник статусов в курсе не делаем
@Check(`"status" IN ('draft', 'published', 'deleted')`)
// у врача не больше одного черновика: уникальный индекс только по строкам-черновикам
@Index(['creatorId'], { unique: true, where: `"status" = 'draft'` })
export class OxygenationDegree {
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column({ type: 'varchar', length: 100 })
    degreeName: string;
 
    // описание под видео в ленте, заполняется при публикации
    @Column({ type: 'varchar', length: 1000, nullable: true })
    description: string | null;
 
    @Column({ type: 'varchar', length: 20, default: 'draft' })
    status: OxygenationDegreeStatus;
 
    // полные url объектов в MinIO, у новых карточек пустые
    @Column({ type: 'varchar', length: 255, nullable: true })
    imageUrl: string | null;
 
    @Column({ type: 'varchar', length: 255, nullable: true })
    videoUrl: string | null;
 
    // два поля по предметной области, заполняются при публикации
 
    // верхняя граница индекса PaO2/FiO2, мм рт. ст., по ней фильтруется плитка
    @Column({ type: 'integer', nullable: true })
    pfRatioUpperBound: number | null;
 
    // летальность для данной степени, %
    @Column({ type: 'integer', nullable: true })
    mortalityRate: number | null;
 
    // дата создания, ставится самой БД при INSERT
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
 
    // дата формирования - момент публикации
    @Column({ type: 'timestamptz', nullable: true })
    formedAt: Date | null;
 
    @Column({ type: 'integer' })
    creatorId: number;
 
    // создатель; RESTRICT - врача с карточками удалить нельзя, каскада нет
    @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'creatorId' })
    creator: Relation<Doctor>;
 
    @OneToMany(() => OxygenationDegreeLike, (like) => like.oxygenationDegree)
    likes: Relation<OxygenationDegreeLike[]>;
}