#!/usr/bin/env node

import { ScraperService } from '../services/scraperService';
import { MongoService } from '../services/mongoService';
import { IndustryScraper } from '../services/industryScraper';
import { ScrapingConfig } from '../types/ibef';
import { logger } from '../utils/logger';
import config from '../config/environment';

async function main() {
  const scrapingConfig: ScrapingConfig = {
    baseUrl: config.scraping.baseUrl,
    industryListUrl: config.scraping.industryListUrl,
    delayBetweenRequests: config.scraping.delay,
    maxRetries: config.scraping.maxRetries,
    timeout: config.scraping.timeout,
    userAgent: config.scraping.userAgent
  };

  const scraperService = new ScraperService(scrapingConfig);
  const mongoService = new MongoService();

  try {
    logger.info('Starting IBEF scraper...');
    
    // Initialize services
    await mongoService.connect(config.mongodb.uri);
    await scraperService.initialize();
    
    // Get list of industries
    logger.info('Fetching industry list...');
    const industryList = await scraperService.scrapeIndustryList();
    logger.info(`Found ${industryList.totalCount} industries to scrape`);
    
    // Scrape each industry
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < industryList.industries.length; i++) {
      const url = industryList.industries[i];
      const industryName = url.split('/').pop()?.replace(/-/g, ' ') || 'Unknown';
      
      logger.info(`Scraping ${i + 1}/${industryList.industries.length}: ${industryName}`);
      
      try {
        const { html } = await scraperService.scrapePage(url);
        const industryScraper = new IndustryScraper(html);
        const data = industryScraper.extractIndustryData(url);
        
        if (data) {
          await mongoService.saveIndustryData(data);
          successCount++;
          logger.info(`✓ Successfully scraped: ${industryName}`);
        } else {
          failCount++;
          logger.warn(`✗ Failed to extract data: ${industryName}`);
        }
      } catch (error) {
        failCount++;
        logger.error(`✗ Error scraping ${industryName}:`, error);
      }
      
      // Add delay between requests
      if (i < industryList.industries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.scraping.delay));
      }
    }
    
    logger.info(`Scraping completed! Success: ${successCount}, Failed: ${failCount}`);
    
  } catch (error) {
    logger.error('Scraping failed:', error);
    process.exit(1);
  } finally {
    await scraperService.close();
    await mongoService.disconnect();
    logger.info('Scraper shutdown complete');
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the scraper
main().catch(error => {
  logger.error('Main function failed:', error);
  process.exit(1);
});
