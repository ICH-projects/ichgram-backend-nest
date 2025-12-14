import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './services/conversations.service';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@WebSocketGateway()
export class ConversationsGateway {
  constructor(private readonly conversationsService: ConversationsService) {}

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('createConversation')
  createConversation(
    @MessageBody() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(createConversationDto);
  }

  @SubscribeMessage('findAllConversations')
  findAll() {
    return this.conversationsService.findAll();
  }

  @SubscribeMessage('findOneConversation')
  findOne(@MessageBody() id: number) {
    return this.conversationsService.findOne(id);
  }

  @SubscribeMessage('updateConversation')
  update(@MessageBody() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(
      updateConversationDto.id,
      updateConversationDto,
    );
  }

  @SubscribeMessage('removeConversation')
  remove(@MessageBody() id: number) {
    return this.conversationsService.remove(id);
  }
}
