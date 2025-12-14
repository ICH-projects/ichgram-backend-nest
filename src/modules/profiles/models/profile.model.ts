import { AllowNull, Column, Model, Table } from 'sequelize-typescript';

@Table
export class Profile extends Model {
  @AllowNull(false)
  @Column
  declare email: string;

  @AllowNull(true)
  @Column
  declare fullname: string;

  @AllowNull(true)
  @Column
  declare username: string;

  @AllowNull(true)
  @Column
  declare avatar: string;

  @AllowNull(true)
  @Column
  declare about: string;

  @AllowNull(true)
  @Column
  declare website: string;
}
