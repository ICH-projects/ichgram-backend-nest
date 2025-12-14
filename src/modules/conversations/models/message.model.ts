import {
  AllowNull,
  BelongsTo,
  Column,
  Model,
  Table,
} from 'sequelize-typescript';
import { Profile } from '../../profiles/models/profile.model';
import { Conversation } from './conversation.model';

@Table
export class Message extends Model {
  @BelongsTo(() => Conversation, 'conversationId')
  declare conversation: Conversation;

  @BelongsTo(() => Profile, 'authorId')
  declare author: Profile;

  @AllowNull(false)
  @Column
  declare text: string;
}
