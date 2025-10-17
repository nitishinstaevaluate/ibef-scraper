#!/usr/bin/env node

import { ScraperService } from '../services/scraperService';
import { MongoService } from '../services/mongoService';
import { IndustryScraper } from '../services/industryScraper';
import { ScrapingConfig } from '../types/ibef';
import { logger } from '../utils/logger';
import config from '../config/environment';

async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.error('Usage: npm run scrape:single <URL>');
    console.error('Example: npm run scrape:single https://ibef.org/industry/msme');
    process.exit(1);
  }

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
    logger.info(`Starting single industry scraper for: ${url}`);
    
    // Initialize services
    await mongoService.connect(config.mongodb.uri);
    await scraperService.initialize();
    
    // Scrape the industry page
    logger.info('Scraping industry page...');
    const { html } = await scraperService.scrapePage(url);
    
    // Extract data
    logger.info('Extracting industry data...');
    const industryScraper = new IndustryScraper(html);
    const data = industryScraper.extractIndustryData(url);
    
    if (data) {
      // Save to database
      await mongoService.saveIndustryData(data);
      logger.info(`✓ Successfully scraped and saved: ${data.industryName}`);
      
      // Display summary
      console.log('\n=== SCRAPING SUMMARY ===');
      console.log(`Industry: ${data.industryName}`);
      console.log(`URL: ${data.url}`);
      console.log(`Key Stats: ${data.overview.keyStats.length}`);
      console.log(`Schemes: ${data.governmentSchemes.schemes.length}`);
      console.log(`Policies: ${data.policySupport.policies.length}`);
      console.log(`News Items: ${data.relatedNews.length}`);
      console.log(`Word Count: ${data.metadata.wordCount}`);
    } else {
      logger.error('✗ Failed to extract data from the page');
      process.exit(1);
    }
    
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
