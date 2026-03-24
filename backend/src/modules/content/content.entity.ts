import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { SocialAccountEntity } from '../social-account/social-account.entity';

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
export type PublishMode = 'MANUAL' | 'SCHEDULED';

@Entity({ name: 'contents' })
export class ContentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'uploader_id', type: 'int' })
  uploaderId!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploader_id' })
  uploader!: UserEntity;

  @Column({ name: 'target_account_id', type: 'int' })
  targetAccountId!: number;

  @ManyToOne(() => SocialAccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_account_id' })
  targetAccount!: SocialAccountEntity;

  @Column({ name: 'file_path', type: 'varchar', length: 255 })
  filePath!: string;

  @Column({ name: 'file_original_name', type: 'varchar', length: 255 })
  fileOriginalName!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 120 })
  productName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'scheduled_time', type: 'datetime' })
  scheduledTime!: Date;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'],
    default: 'DRAFT',
  })
  status!: ContentStatus;

  @Column({
    name: 'publish_mode',
    type: 'enum',
    enum: ['MANUAL', 'SCHEDULED'],
    nullable: true,
    default: null,
  })
  publishMode!: PublishMode | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason!: string | null;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'publisher_id', type: 'int', nullable: true })
  publisherId!: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'publisher_id' })
  publisher!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

