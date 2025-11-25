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

import { emailPattern } from 'src/auth/validation/auth.patterns';
import { Session } from './session.model';

@Table
export class User extends Model {
  @AllowNull(false)
  @Unique
  @Is({ args: emailPattern.regexp, msg: emailPattern.message })
  @Column
  email: string;

  @AllowNull(false)
  @Column
  password: string;

  @AllowNull(false)
  @Default(false)
  @Column
  isConfirmed: boolean;

  @HasOne(() => Session)
  session: Session;
}
