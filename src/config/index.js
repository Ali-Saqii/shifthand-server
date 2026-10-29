const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ['mysql', 'mysql2'] }),
  DB_HOST: Joi.string(),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string(),
  DB_USER: Joi.string(),
  DB_PASSWORD: Joi.string().allow(''),
  JWT_SECRET: Joi.string().min(32),
  JWT_ACCESS_SECRET: Joi.string().min(32),
  JWT_REFRESH_SECRET: Joi.string().min(32),
  ACCESS_TTL: Joi.string().default('15m'),
  REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(30),
  PUBLIC_URL: Joi.string().uri({ scheme: ['http', 'https'] }),
  PUBLIC_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] }),
  CORS_ORIGINS: Joi.string().default('*')
}).unknown(true);

const { value: env, error } = schema.validate(process.env, {
  abortEarly: false,
  convert: true
});

if (error) {
  const details = error.details.map((detail) => detail.message).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

if (!env.DATABASE_URL && (!env.DB_HOST || !env.DB_NAME || !env.DB_USER || env.DB_PASSWORD === undefined)) {
  throw new Error('Invalid environment configuration: provide DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD');
}

const accessSecret = env.JWT_SECRET || env.JWT_ACCESS_SECRET;
const refreshSecret = env.JWT_SECRET || env.JWT_REFRESH_SECRET;
if (!accessSecret || !refreshSecret) {
  throw new Error('Invalid environment configuration: provide JWT_SECRET or both JWT_ACCESS_SECRET and JWT_REFRESH_SECRET');
}

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  database: {
    url: env.DATABASE_URL,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD
  },
  jwt: {
    accessSecret,
    refreshSecret,
    accessTtl: env.ACCESS_TTL,
    refreshTtlDays: env.REFRESH_TTL_DAYS
  },
  publicUrl: env.PUBLIC_BASE_URL || env.PUBLIC_URL || 'http://localhost:3000',
  corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
};