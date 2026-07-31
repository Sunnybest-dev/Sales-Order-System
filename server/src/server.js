require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');

const routes = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sequelize } = require('./models/associations');
const logger = require('./config/logger');

const app = express();

app.use(helmet());
app.use(xss());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = (process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.includes(origin) || /\.vercel\.app$/.test(origin) || origin === 'http://localhost:3000' || origin === 'http://localhost:5173') {
      return cb(null, true);
    }
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

app.use('/api/v1', routes);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: process.env.DROP_AND_SYNC === 'true' });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    logger.info('Tables synced');
    if (process.env.SEED_DB === 'true') {
      const { seedUsers } = require('./database/seeders/index');
      await seedUsers();
      logger.info('Seeded');
    }
    app.listen(PORT, () => logger.info(`Server on port ${PORT}`));
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
module.exports = app;
