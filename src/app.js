const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./db');
const authRoutes = require('./modules/auth/auth.routes');
const orgRoutes = require('./modules/orgs/orgs.routes');
const eventRoutes = require('./modules/events/events.routes');
const shiftRoutes = require('./modules/shifts/shifts.routes');
const signupRoutes = require('./modules/signups/signups.routes');
const deviceRoutes = require('./modules/devices/devices.routes');
const errorHandler = require('./middleware/errorHandler');
const requestContext = require('./middleware/requestContext');
const AppError = require('./lib/AppError');

const app = express();

app.use(helmet());
app.use(cors());
app.use(requestContext);
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/orgs', orgRoutes);
app.use('/orgs/:organizationId/events', eventRoutes);
app.use('/events', shiftRoutes);
app.use('/shifts', signupRoutes);
app.use('/devices', deviceRoutes);

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

if (process.env.NODE_ENV === 'test') {
  app.get('/__test__/error', (req, res, next) => {
    next(new Error('sensitive test error'));
  });
}

app.use((req, res, next) => {
  next(new AppError('Route not found', 404, 'ROUTE_NOT_FOUND'));
});

app.use(errorHandler);

module.exports = app;