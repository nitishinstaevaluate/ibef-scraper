import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  // MongoDB Configuration
  mongodb: {
    uri: string;
    database: string;
  };
  
  // Scraping Configuration
  scraping: {
    baseUrl: string;
    industryListUrl: string;
    delay: number;
    maxRetries: number;
    timeout: number;
    userAgent: string;
  };
  
  // Server Configuration
  server: {
    port: number;
    nodeEnv: string;
  };
  
  // Logging Configuration
  logging: {
    level: string;
    logFile: string;
  };
  
  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: EnvironmentConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ifin',
    database: process.env.MONGODB_DATABASE || 'ibef_scraper'
  },
  
  scraping: {
    baseUrl: process.env.IBEF_BASE_URL || 'https://ibef.org',
    industryListUrl: process.env.IBEF_INDUSTRY_LIST_URL || 'https://ibef.org/industry',
    delay: parseInt(process.env.SCRAPING_DELAY || '2000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/scraper.log'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
};

export default config;
