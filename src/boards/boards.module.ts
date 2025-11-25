import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardColumnEntity } from './entities/board-column.entity';
import { BoardEntity } from './entities/board.entity';
import { CardEntity } from './entities/card.entity';
import { CommentEntity } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoardEntity,
      BoardColumnEntity,
      CardEntity,
      CommentEntity,
    ]),
    UsersModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
