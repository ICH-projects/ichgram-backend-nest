// import "dotenv/config"
require('dotenv/config');
// const Sequelize = require('@sequelize/core')
// const SqliteDialect = require('@sequelize/sqlite3')

const configData = {
  "development": {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    dialect: "postgres",
  },
  // "test": {
  //   storage: ':memory:',
  //   dialect: "sqlite",
  //   pool: { max: 1, idle: Infinity, maxUses: Infinity },
  // },
  // "production": {
  //   username: process.env.PROD_DATABASE_USER,
  //   password: process.env.PROD_DATABASE_PASSWORD,
  //   database: process.env.PROD_DATABASE_NAME,
  //   host: process.env.PROD_DATABASE_NAME,
  //   port: Number(process.env.PROD_DATABASE_PORT),
  //   dialect: "postgres",
  //   dialectOptions: {
  //     ssl: {
  //       require: true, // Enable SSL
  //       rejectUnauthorized: false // Adjust based on your SSL certificate setup
  //     }
  //   },
  // }
}

// export default configData;
module.exports = configData;