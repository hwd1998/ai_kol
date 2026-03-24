import { CreateDateColumn, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
