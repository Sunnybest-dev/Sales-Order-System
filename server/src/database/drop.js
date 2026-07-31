require('dotenv').config();
const { sequelize } = require('../models/associations');

(async () => {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.drop();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('All tables dropped.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
