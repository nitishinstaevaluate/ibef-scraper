import { Request, Response } from 'express';
import { ScraperService } from '../services/scraperService';
import { MongoService } from '../services/mongoService';
import { IndustryScraper } from '../services/industryScraper';
import { ScrapingConfig, ScrapingResult, ScrapingStatus, ScrapingProgress } from '../types/ibef';
import { logger } from '../utils/logger';
import config from '../config/environment';

export class ScraperController {
  private scraperService: ScraperService;
  private mongoService: MongoService;
  private scrapingStatus: ScrapingStatus | null = null;

  constructor() {
    const scrapingConfig: ScrapingConfig = {
      baseUrl: config.scraping.baseUrl,
      industryListUrl: config.scraping.industryListUrl,
      delayBetweenRequests: config.scraping.delay,
      maxRetries: config.scraping.maxRetries,
      timeout: config.scraping.timeout,
      userAgent: config.scraping.userAgent
    };

    this.scraperService = new ScraperService(scrapingConfig);
    this.mongoService = new MongoService();
  }

  async initialize(): Promise<void> {
    try {
      await this.mongoService.connect(config.mongodb.uri);
      await this.scraperService.initialize();
      logger.info('Scraper controller initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scraper controller:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.scraperService.close();
      await this.mongoService.disconnect();
      logger.info('Scraper controller cleaned up successfully');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get scraping status
   */
  getScrapingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.scrapingStatus) {
        res.status(404).json({ message: 'No scraping operation in progress' });
        return;
      }

      res.json(this.scrapingStatus);
    } catch (error) {
      logger.error('Error getting scraping status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Start scraping all industries
   */
  startScraping = async (req: Request, res: Response): Promise<void> => {
    try {
      if (this.scrapingStatus && !this.scrapingStatus.isComplete) {
        res.status(400).json({ message: 'Scraping operation already in progress' });
        return;
      }

      logger.info('Starting full scraping operation...');
      
      // Get list of industries
      const industryList = await this.scraperService.scrapeIndustryList();
      
      // Initialize scraping status
      this.scrapingStatus = {
        totalIndustries: industryList.totalCount,
        completed: 0,
        failed: 0,
        inProgress: 0,
        results: [],
        startTime: new Date(),
        isComplete: false
      };

      res.json({ 
        message: 'Scraping started', 
        totalIndustries: industryList.totalCount,
        startTime: this.scrapingStatus.startTime
      });

      // Start scraping in background
      this.scrapeIndustries(industryList.industries);
    } catch (error) {
      logger.error('Error starting scraping:', error);
      res.status(500).json({ error: 'Failed to start scraping operation' });
    }
  };

  /**
   * Scrape a single industry
   */
  scrapeSingleIndustry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body;
      
      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      logger.info(`Scraping single industry: ${url}`);
      
      const result = await this.scrapeIndustryPage(url);
      
      if (result.success && result.data) {
        await this.mongoService.saveIndustryData(result.data);
        res.json({ 
          message: 'Industry scraped successfully', 
          data: result.data 
        });
      } else {
        res.status(400).json({ 
          error: 'Failed to scrape industry', 
          details: result.error 
        });
      }
    } catch (error) {
      logger.error('Error scraping single industry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get all scraped industries
   */
  getAllIndustries = async (req: Request, res: Response): Promise<void> => {
    try {
      const industries = await this.mongoService.getAllIndustries();
      res.json({ 
        industries, 
        count: industries.length 
      });
    } catch (error) {
      logger.error('Error getting all industries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get industry by slug
   */
  getIndustryBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const industry = await this.mongoService.getIndustryData(slug);
      
      if (!industry) {
        res.status(404).json({ error: 'Industry not found' });
        return;
      }

      res.json(industry);
    } catch (error) {
      logger.error('Error getting industry by slug:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Search industries
   */
  searchIndustries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const industries = await this.mongoService.searchIndustries(q);
      res.json({ 
        industries, 
        count: industries.length,
        query: q
      });
    } catch (error) {
      logger.error('Error searching industries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get scraping statistics
   */
  getScrapingStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.mongoService.getScrapingStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Delete industry data
   */
  deleteIndustry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const deleted = await this.mongoService.deleteIndustryData(slug);
      
      if (deleted) {
        res.json({ message: 'Industry deleted successfully' });
      } else {
        res.status(404).json({ error: 'Industry not found' });
      }
    } catch (error) {
      logger.error('Error deleting industry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get recent industries
   */
  getRecentIndustries = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const industries = await this.mongoService.getRecentIndustries(limit);
      res.json({ 
        industries, 
        count: industries.length 
      });
    } catch (error) {
      logger.error('Error getting recent industries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Health check
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const isHealthy = await this.scraperService.isHealthy();
      const isDbConnected = await this.mongoService.isConnected();
      
      res.json({
        status: isHealthy && isDbConnected ? 'healthy' : 'unhealthy',
        scraper: isHealthy,
        database: isDbConnected,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in health check:', error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  };

  /**
   * Private method to scrape industries in background
   */
  private async scrapeIndustries(urls: string[]): Promise<void> {
    try {
      for (let i = 0; i < urls.length; i++) {
        if (!this.scrapingStatus) break;

        const url = urls[i];
        this.scrapingStatus.inProgress = 1;
        
        try {
          const result = await this.scrapeIndustryPage(url);
          this.scrapingStatus.results.push(result);
          
          if (result.success) {
            this.scrapingStatus.completed++;
            if (result.data) {
              await this.mongoService.saveIndustryData(result.data);
            }
          } else {
            this.scrapingStatus.failed++;
          }
        } catch (error) {
          logger.error(`Error scraping ${url}:`, error);
          this.scrapingStatus.failed++;
          this.scrapingStatus.results.push({
            success: false,
            industryName: this.extractIndustryNameFromUrl(url),
            url,
            error: (error as Error).message,
            scrapedAt: new Date(),
            processingTime: 0
          });
        }

        this.scrapingStatus.inProgress = 0;
        
        // Add delay between requests
        if (i < urls.length - 1) {
          await this.delay(config.scraping.delay);
        }
      }

      if (this.scrapingStatus) {
        this.scrapingStatus.isComplete = true;
        this.scrapingStatus.endTime = new Date();
        logger.info('Scraping operation completed');
      }
    } catch (error) {
      logger.error('Error in background scraping:', error);
      if (this.scrapingStatus) {
        this.scrapingStatus.isComplete = true;
        this.scrapingStatus.endTime = new Date();
      }
    }
  }

  /**
   * Private method to scrape a single industry page
   */
  private async scrapeIndustryPage(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      const { html } = await this.scraperService.scrapePage(url);
      const industryScraper = new IndustryScraper(html);
      const data = industryScraper.extractIndustryData(url);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: !!data,
        industryName: this.extractIndustryNameFromUrl(url),
        url,
        data: data || undefined,
        scrapedAt: new Date(),
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        industryName: this.extractIndustryNameFromUrl(url),
        url,
        error: (error as Error).message,
        scrapedAt: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  private extractIndustryNameFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^\/\?]+)/);
    return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
