import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../user/user.entity';

export type AuditActionType =
  | 'LOGIN'
  | 'UPLOAD'
  | 'CONTENT_EDIT'
  | 'CONTENT_SUBMIT'
  | 'CONTENT_WITHDRAW'
  | 'REVIEW_APPROVE'
  | 'REVIEW_REJECT'
  | 'MOCK_PUBLISH'
  | 'USER_CREATE'
  | 'USER_SET_ENABLED'
  | 'PLATFORM_CREATE'
  | 'PLATFORM_SET_ENABLED'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_SET_ENABLED'
  | 'SOCIAL_ACCOUNT_CREATE'
  | 'SOCIAL_ACCOUNT_SET_STATUS';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'action_type', type: 'varchar', length: 48 })
  actionType!: AuditActionType;

  @Column({ name: 'target_id', type: 'int', nullable: true })
  targetId!: number | null;

  @Column({ type: 'json', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

