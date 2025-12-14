import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ConversationsController } from './controllers/conversations.controller';
import { MessagesController } from './controllers/messages.controller';

import { ConversationsGateway } from './conversations.gateway';

import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';

import { Conversation } from './models/conversation.model';
import { Message } from './models/message.model';


@Module({
  imports: [SequelizeModule.forFeature([Conversation, Message])],
  controllers: [ConversationsController, MessagesController],
  providers: [ConversationsService, MessagesService, ConversationsGateway],
})
export class ConversationsModule {}
