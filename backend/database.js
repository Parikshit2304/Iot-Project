const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'iot_sensor_db',
  password: 'yourpassword',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};