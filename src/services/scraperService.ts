import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScrapingConfig, ScrapingResult, IndustryListResponse } from '../types/ibef';
import { logger } from '../utils/logger';

export class ScraperService {
  private browser: Browser | null = null;
  private config: ScrapingConfig;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  async scrapePage(url: string): Promise<{ html: string; title: string }> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    
    try {
      logger.info(`Scraping page: ${url}`);
      
      // Set user agent and viewport
      await page.setUserAgent(this.config.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set request interception to block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get page content
      const html = await page.content();
      const title = await page.title();

      logger.info(`Successfully scraped: ${title}`);
      return { html, title };
    } catch (error) {
      logger.error(`Failed to scrape ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeIndustryList(): Promise<IndustryListResponse> {
    try {
      logger.info('Scraping industry list...');
      const { html } = await this.scrapePage(this.config.industryListUrl);
      const $ = cheerio.load(html);
      const industries: string[] = [];

      // Extract industry links from the industry page
      $('a[href*="/industry/"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.includes('#') && href !== '/industry') {
          const fullUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
          industries.push(fullUrl);
        }
      });

      // Remove duplicates and filter out invalid URLs
      const uniqueIndustries = [...new Set(industries)].filter(url => 
        url.includes('/industry/') && !url.includes('#')
      );

      logger.info(`Found ${uniqueIndustries.length} industry pages`);
      
      return {
        industries: uniqueIndustries,
        totalCount: uniqueIndustries.length,
        scrapedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to scrape industry list:', error);
      throw error;
    }
  }

  async scrapeWithRetry(url: string, maxRetries: number = 3): Promise<ScrapingResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { html, title } = await this.scrapePage(url);
        const processingTime = Date.now() - startTime;

        return {
          success: true,
          industryName: this.extractIndustryNameFromUrl(url),
          url,
          scrapedAt: new Date(),
          processingTime
        };
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt < maxRetries) {
          const delay = this.config.delayBetweenRequests * attempt;
          logger.info(`Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    return {
      success: false,
      industryName: this.extractIndustryNameFromUrl(url),
      url,
      error: lastError?.message || 'Unknown error',
      scrapedAt: new Date(),
      processingTime: Date.now() - startTime
    };
  }

  private extractIndustryNameFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^\/\?]+)/);
    return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  }

  private extractSlugFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeMultiplePages(urls: string[]): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    logger.info(`Starting to scrape ${urls.length} industry pages...`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        logger.info(`Scraping ${i + 1}/${urls.length}: ${url}`);
        const result = await this.scrapeWithRetry(url);
        results.push(result);
        
        // Add delay between requests to be respectful
        if (i < urls.length - 1) {
          await this.delay(this.config.delayBetweenRequests);
        }
      } catch (error) {
        logger.error(`Failed to scrape ${url}:`, error);
        results.push({
          success: false,
          industryName: this.extractIndustryNameFromUrl(url),
          url,
          error: (error as Error).message,
          scrapedAt: new Date(),
          processingTime: 0
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Scraping completed: ${successCount}/${urls.length} successful`);
    
    return results;
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.browser) return false;
      
      const pages = await this.browser.pages();
      return pages.length >= 0; // Basic health check
    } catch {
      return false;
    }
  }
}
