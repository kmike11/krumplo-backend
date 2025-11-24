import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity';
import { CardEntity } from './card.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => CardEntity, (card) => card.comments, { onDelete: 'CASCADE' })
  card!: CardEntity;

  @ManyToOne(() => UserEntity, (user) => user.comments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  author?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
