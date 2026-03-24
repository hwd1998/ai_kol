import { CreateDateColumn, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'platforms' })
export class PlatformEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  region!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

