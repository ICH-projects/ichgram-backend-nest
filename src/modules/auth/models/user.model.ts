import {
  AllowNull,
  Column,
  Default,
  HasOne,
  Is,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';

import { Session } from './session.model';

import { emailPattern } from '../validation/auth.patterns';

@Table
export class User extends Model {
  @AllowNull(false)
  @Unique
  @Is({ args: emailPattern.regexp, msg: emailPattern.message })
  @Column
  declare email: string;

  @AllowNull(false)
  @Column
  declare password: string;

  @AllowNull(false)
  @Default(false)
  @Column
  declare isConfirmed: boolean;

  @HasOne(() => Session)
  session: Session;
}
