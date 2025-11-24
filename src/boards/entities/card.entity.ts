import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardPriority } from '../../common/enums/card-priority.enum';
import { CardType } from '../../common/enums/card-type.enum';
import { UserEntity } from '../../users/user.entity';
import { AttachmentEntity } from './attachment.entity';
import { BoardColumnEntity } from './board-column.entity';
import { BoardEntity } from './board.entity';
import { ChecklistItemEntity } from './checklist-item.entity';
import { CommentEntity } from './comment.entity';
import { LabelEntity } from './label.entity';
import { SprintEntity } from './sprint.entity';

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

  @ManyToMany(() => UserEntity, (user) => user.watchingCards, {
    cascade: false,
  })
  @JoinTable({
    name: 'card_watchers',
    joinColumn: { name: 'card_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  watchers?: UserEntity[];

  @ManyToMany(() => LabelEntity, (label) => label.cards, { cascade: false })
  @JoinTable({
    name: 'card_labels',
    joinColumn: { name: 'card_id' },
    inverseJoinColumn: { name: 'label_id' },
  })
  labels?: LabelEntity[];

  @OneToMany(() => ChecklistItemEntity, (item) => item.card, { cascade: true })
  checklistItems?: ChecklistItemEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.card, { cascade: true })
  comments?: CommentEntity[];

  @OneToMany(() => AttachmentEntity, (attachment) => attachment.card, {
    cascade: true,
  })
  attachments?: AttachmentEntity[];

  @ManyToOne(() => SprintEntity, (sprint) => sprint.cards, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  sprint?: SprintEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
