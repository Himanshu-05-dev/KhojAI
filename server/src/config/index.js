const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
require('dotenv').config({ path: path.resolve(__dirname, '../../../server/.env') })
require('dotenv').config()

const JWT_FALLBACK = 'super-secret-jwt-key-for-khojai-development-only-32chars'

module.exports = {
  port:        process.env.PORT || 5000,
  nodeEnv:     process.env.NODE_ENV || 'development',
  mongoUri:    process.env.MONGODB_URI || 'mongodb://localhost:27017/khojai',
  redisUrl:    process.env.REDIS_URL   || 'redis://localhost:6379',
  jwtSecret:   process.env.JWT_SECRET  || JWT_FALLBACK,
  jwtExpiry:   process.env.JWT_EXPIRY  || '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL    || 'http://localhost:8000',
  aiServiceKey: process.env.AI_SERVICE_SECRET || 'internal-secret',
  clientUrl:    process.env.CLIENT_URL  || 'http://localhost:5173',
  storageDir:   process.env.UPLOAD_DIR  || './uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 5,
  vapidPublicKey:  process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidEmail:      process.env.VAPID_EMAIL || 'mailto:admin@khojai.dev',
  emailProvider: process.env.EMAIL_PROVIDER || 'disabled',
  smtpHost:    process.env.SMTP_HOST,
  smtpPort:    process.env.SMTP_PORT,
  smtpUser:    process.env.SMTP_USER,
  smtpPass:    process.env.SMTP_PASS,
  smtpFrom:    process.env.SMTP_FROM || 'KhojAI <no-reply@khojai.dev>',
  demoMode:    process.env.DEMO_MODE !== 'false',
  bcryptSaltRounds: Number(process.env.SALT_ROUNDS) || 12,
}
