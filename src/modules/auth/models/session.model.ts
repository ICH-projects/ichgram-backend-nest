import {
  AllowNull,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table
export class Session extends Model {
  @AllowNull(false)
  @Column
  declare accessToken: string;

  @AllowNull(false)
  @Column
  declare refreshToken: string;

  @ForeignKey(() => User)
  @Column
  declare userId: number;

  @BelongsTo(() => User)
  user: User;
}
