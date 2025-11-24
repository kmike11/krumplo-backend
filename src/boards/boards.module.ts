import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { AttachmentEntity } from './entities/attachment.entity';
import { BoardColumnEntity } from './entities/board-column.entity';
import { BoardEntity } from './entities/board.entity';
import { CardEntity } from './entities/card.entity';
import { ChecklistItemEntity } from './entities/checklist-item.entity';
import { CommentEntity } from './entities/comment.entity';
import { LabelEntity } from './entities/label.entity';
import { SprintEntity } from './entities/sprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardColumnEntity,
      CardEntity,
      LabelEntity,
      ChecklistItemEntity,
      CommentEntity,
      AttachmentEntity,
      SprintEntity,
    ]),
    UsersModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
