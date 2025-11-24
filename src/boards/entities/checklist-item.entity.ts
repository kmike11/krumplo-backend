import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardEntity } from './card.entity';

@Entity('checklist_items')
export class ChecklistItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  content!: string;

  @Column({ default: false })
  completed!: boolean;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @ManyToOne(() => CardEntity, (card) => card.checklistItems, {
    onDelete: 'CASCADE',
  })
  card!: CardEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
