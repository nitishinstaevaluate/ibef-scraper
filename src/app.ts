import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import scraperRoutes from './routes/scraperRoutes';
import config from './config/environment';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', scraperRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IBEF Scraper API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      scrape: '/api/scrape/start',
      industries: '/api/industries',
      stats: '/api/stats'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
  logger.info(`MongoDB URI: ${config.mongodb.uri}`);
});

export default app;
