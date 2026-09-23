import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Doctor } from './doctor.entity.js';
import { OxygenationDegree } from './oxygenation-degree.entity.js';
 
// лайк (добавление в избранное) - связь многие-ко-многим врач - степень
@Entity('oxygenation_degree_likes')
// один врач добавляет степень в избранное только один раз
@Unique(['doctorId', 'oxygenationDegreeId'])
export class OxygenationDegreeLike {
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column({ type: 'integer' })
    doctorId: number;
 
    @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'doctorId' })
    doctor: Relation<Doctor>;
 
    @Column({ type: 'integer' })
    oxygenationDegreeId: number;
 
    @ManyToOne(() => OxygenationDegree, (degree) => degree.likes, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'oxygenationDegreeId' })
    oxygenationDegree: Relation<OxygenationDegree>;
}