import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'CREATOR' | 'REVIEW' | 'ADMIN';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  email!: string;

  @Column({ type: 'enum', enum: ['CREATOR', 'REVIEW', 'ADMIN'], default: 'CREATOR' })
  role!: UserRole;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  // 简体中文注释：密码哈希严禁返回给前端；此字段仅用于入库与校验
  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

