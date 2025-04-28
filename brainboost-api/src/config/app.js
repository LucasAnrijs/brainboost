require('dotenv').config();

/**
 * Application configuration
 * Loads from environment variables with sensible defaults
 */
module.exports = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    additionalClientUrls: process.env.ADDITIONAL_CLIENT_URLS
      ? process.env.ADDITIONAL_CLIENT_URLS.split(',')
      : [],
    corsAllowAll: process.env.CORS_ALLOW_ALL === 'true' || false,
    apiVersion: 'v1',
    apiPrefix: '/api',
    trustProxy: process.env.TRUST_PROXY === 'true' || false,
  },
  
  // Database configuration
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/brainboost',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV !== 'production', // Disable auto-indexing in production
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10, // Maintain up to 10 socket connections
      family: 4, // Use IPv4, skip IPv6
    },
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },
  
  // Password hashing configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },
  
  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@brainboost.app',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    secure: process.env.EMAIL_SECURE === 'true' || false,
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE !== 'false',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10,
    maxSize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
  },
  
  // Rate limiting configuration
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES 
      ? process.env.ALLOWED_FILE_TYPES.split(',') 
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    storage: process.env.UPLOAD_STORAGE || 'local', // 'local', 's3', etc.
    localDir: process.env.UPLOAD_LOCAL_DIR || 'uploads',
  },
  
  // SRS algorithm configuration
  srs: {
    defaultNewCardsPerDay: parseInt(process.env.DEFAULT_NEW_CARDS_PER_DAY) || 10,
    defaultReviewsPerDay: parseInt(process.env.DEFAULT_REVIEWS_PER_DAY) || 50,
    initialEaseFactor: parseFloat(process.env.INITIAL_EASE_FACTOR) || 2.5,
    minEaseFactor: parseFloat(process.env.MIN_EASE_FACTOR) || 1.3,
    maxEaseFactor: parseFloat(process.env.MAX_EASE_FACTOR) || 3.0,
    maxInterval: parseInt(process.env.MAX_INTERVAL) || 365, // days
  },
  
  // AI service configuration (for card generation)
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-change-this-in-production',
    name: 'brainboost.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    resave: false,
    saveUninitialized: false,
  },
};
