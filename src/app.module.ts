import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import databaseConfig from './config/database-config';

import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ChatTempSocketioModule } from './chat_temp_socketio/chat_temp_socketio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot(databaseConfig()),
    AuthModule,
    PostsModule,
    ProfilesModule,
    ConversationsModule,
    ChatTempSocketioModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
