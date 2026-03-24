import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PlatformEntity } from '../platform/platform.entity';

export type SocialAccountStatus = 'ACTIVE' | 'DISABLED';

@Entity({ name: 'social_accounts' })
export class SocialAccountEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'platform_id', type: 'int' })
  platformId!: number;

  @ManyToOne(() => PlatformEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'platform_id' })
  platform!: PlatformEntity;

  @Column({ name: 'account_name', type: 'varchar', length: 80 })
  accountName!: string;

  @Column({ name: 'login_username', type: 'varchar', length: 80 })
  loginUsername!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  remark!: string;

  @Column({ type: 'enum', enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' })
  status!: SocialAccountStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

