import {
  AllowNull,
  BelongsTo,
  Column,
  Model,
  Table,
} from 'sequelize-typescript';
import { Profile } from 'src/modules/profiles/models/profile.model';

@Table
export class Conversation extends Model {
  @BelongsTo(() => Profile, 'participant1Id')
  declare participant1: Profile;

  @BelongsTo(() => Profile, 'participant2Id')
  declare participant2: Profile;

  @AllowNull(false)
  @Column
  declare lastMessage: string;

  @BelongsTo(() => Profile, 'lastMessageAuthorId')
  declare lastMessageAuthor: Profile;
}
