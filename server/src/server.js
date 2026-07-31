require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const path = require('path');

const routes = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sequelize } = require('./models/associations');
const logger = require('./config/logger');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  'http://localhost:3000',
  'http://localhost:5173',
].flatMap((v) => {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
});

app.use(helmet());
app.use(xss());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || /https:\/\/.*\.vercel\.app$/i.test(origin)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(['/api', '/api/v1'], routes);
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
      logger.info('Database seeded');
    }

    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
