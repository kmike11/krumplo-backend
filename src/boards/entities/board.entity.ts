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
import { UserEntity } from '../../users/user.entity';
import { BoardColumnEntity } from './board-column.entity';
import { CardEntity } from './card.entity';
import { LabelEntity } from './label.entity';
import { SprintEntity } from './sprint.entity';

@Entity('boards')
export class BoardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => UserEntity, (user) => user.ownedBoards, {
    onDelete: 'SET NULL',
  })
  owner?: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.boards, { eager: false })
  @JoinTable({
    name: 'board_members',
    joinColumn: { name: 'board_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  members?: UserEntity[];

  @OneToMany(() => BoardColumnEntity, (column) => column.board, {
    cascade: true,
  })
  columns?: BoardColumnEntity[];

  @OneToMany(() => LabelEntity, (label) => label.board, { cascade: true })
  labels?: LabelEntity[];

  @OneToMany(() => SprintEntity, (sprint) => sprint.board, { cascade: true })
  sprints?: SprintEntity[];

  @OneToMany(() => CardEntity, (card) => card.board)
  cards?: CardEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
