import { Router } from 'express';
import { ScraperController } from '../controllers/scraperController';

const router = Router();
const scraperController = new ScraperController();

// Initialize the controller
scraperController.initialize().catch(error => {
  console.error('Failed to initialize scraper controller:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await scraperController.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await scraperController.cleanup();
  process.exit(0);
});

// Health check
router.get('/health', scraperController.healthCheck);

// Scraping operations
router.post('/scrape/start', scraperController.startScraping);
router.post('/scrape/single', scraperController.scrapeSingleIndustry);
router.get('/scrape/status', scraperController.getScrapingStatus);

// Industry data operations
router.get('/industries', scraperController.getAllIndustries);
router.get('/industries/recent', scraperController.getRecentIndustries);
router.get('/industries/search', scraperController.searchIndustries);
router.get('/industries/:slug', scraperController.getIndustryBySlug);
router.delete('/industries/:slug', scraperController.deleteIndustry);

// Statistics
router.get('/stats', scraperController.getScrapingStats);

export default router;
