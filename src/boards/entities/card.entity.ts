import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardPriority } from '../../common/enums/card-priority.enum';
import { CardType } from '../../common/enums/card-type.enum';
import { UserEntity } from '../../users/user.entity';
import { BoardColumnEntity } from './board-column.entity';
import { BoardEntity } from './board.entity';
import { CommentEntity } from './comment.entity';

@Entity('cards')
export class CardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'enum', enum: CardPriority, default: CardPriority.MEDIUM })
  priority!: CardPriority;

  @Column({ type: 'enum', enum: CardType, default: CardType.TASK })
  type!: CardType;

  @Column({ type: 'int', nullable: true })
  storyPoints?: number;

  @ManyToOne(() => BoardColumnEntity, (column) => column.cards, {
    onDelete: 'CASCADE',
  })
  column!: BoardColumnEntity;

  @ManyToOne(() => BoardEntity, (board) => board.cards, { onDelete: 'CASCADE' })
  board!: BoardEntity;

  @ManyToOne(() => UserEntity, (user) => user.assignedCards, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  assignee?: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.reportedCards, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  reporter?: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.card, { cascade: true })
  comments?: CommentEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
