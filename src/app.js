const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./db');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res, next) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      data: {
        status: 'ok',
        database: 'connected'
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(503).json({
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service is unavailable'
    }
  });
});

module.exports = app;