const knex = require('knex');
const { config } = require('../config');

// Initialize knex with PostgreSQL configuration
const db = knex({
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
  },
});

// Connect function that returns a promise
const connect = async () => {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

module.exports = {
  db,
  connect,
};