import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

@Entity('labels')
export class LabelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: '#1976d2' })
  color!: string;

  @ManyToOne(() => BoardEntity, (board) => board.labels, {
    onDelete: 'CASCADE',
  })
  board!: BoardEntity;

  @ManyToMany(() => CardEntity, (card) => card.labels)
  cards?: CardEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
