import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './boards/boards.module';
import { UserEntity } from './users/user.entity';
import { BoardEntity } from './boards/entities/board.entity';
import { BoardColumnEntity } from './boards/entities/board-column.entity';
import { CardEntity } from './boards/entities/card.entity';
import { LabelEntity } from './boards/entities/label.entity';
import { ChecklistItemEntity } from './boards/entities/checklist-item.entity';
import { CommentEntity } from './boards/entities/comment.entity';
import { AttachmentEntity } from './boards/entities/attachment.entity';
import { SprintEntity } from './boards/entities/sprint.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'trello_jira_db'),
        entities: [
          UserEntity,
          BoardEntity,
          BoardColumnEntity,
          CardEntity,
          LabelEntity,
          ChecklistItemEntity,
          CommentEntity,
          AttachmentEntity,
          SprintEntity,
        ],
        synchronize: true,
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
    }),
    AuthModule,
    UsersModule,
    BoardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
