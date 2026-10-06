import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// пользователи системы - врачи: создают степени и добавляют их в избранное
@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  login: string;

  // хэш пароля (bcrypt), сам пароль в БД не хранится
  @Column ({ type: 'varchar', length: 128})
  password: string;

  @Column({ type: 'varchar', length: 100 })
  fullName: string;
}
