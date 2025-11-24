import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SprintStatus } from '../../common/enums/sprint-status.enum';
import { BoardEntity } from './board.entity';
import { CardEntity } from './card.entity';

@Entity('sprints')
export class SprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  goal?: string;

  @Column({ type: 'datetime', nullable: true })
  startDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date;

  @Column({ type: 'enum', enum: SprintStatus, default: SprintStatus.PLANNED })
  status!: SprintStatus;

  @ManyToOne(() => BoardEntity, (board) => board.sprints, {
    onDelete: 'CASCADE',
  })
  board!: BoardEntity;

  @OneToMany(() => CardEntity, (card) => card.sprint)
  cards?: CardEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
