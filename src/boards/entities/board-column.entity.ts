import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

@Entity('board_columns')
export class BoardColumnEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @ManyToOne(() => BoardEntity, (board) => board.columns, {
    onDelete: 'CASCADE',
  })
  board!: BoardEntity;

  @OneToMany(() => CardEntity, (card) => card.column, { cascade: true })
  cards?: CardEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
