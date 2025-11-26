import { SequelizeModuleOptions } from '@nestjs/sequelize';

export default (): SequelizeModuleOptions => {
  if (process.env.NODE_ENV === 'test') {
    return {
      dialect: 'sqlite',
      storage: ':memory:',
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    };
  }

  return {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    autoLoadModels: true,
    synchronize: true,
  };
};
