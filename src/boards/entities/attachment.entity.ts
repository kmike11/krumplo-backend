import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity';
import { CardEntity } from './card.entity';

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  mimeType?: string;

  @ManyToOne(() => CardEntity, (card) => card.attachments, {
    onDelete: 'CASCADE',
  })
  card!: CardEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  uploadedBy?: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;
}
