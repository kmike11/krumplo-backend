import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { BoardEntity } from '../boards/entities/board.entity';
import { CardEntity } from '../boards/entities/card.entity';
import { CommentEntity } from '../boards/entities/comment.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  @Exclude()
  password!: string;

  @Column()
  displayName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @ManyToMany(() => BoardEntity, (board) => board.members)
  boards?: BoardEntity[];

  @OneToMany(() => BoardEntity, (board) => board.owner)
  ownedBoards?: BoardEntity[];

  @OneToMany(() => CardEntity, (card) => card.assignee)
  assignedCards?: CardEntity[];

  @OneToMany(() => CardEntity, (card) => card.reporter)
  reportedCards?: CardEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.author)
  comments?: CommentEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
