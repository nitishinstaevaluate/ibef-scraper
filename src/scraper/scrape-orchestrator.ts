import { config } from '../config';
import { ScrapingResult } from '../common/types/ibef';
import { IbefFetch } from './ibef-fetch';
import { parseIndustryPage } from './industry-parser';
import { saveIndustryData } from './industry-repository';

export class ScrapeOrchestrator {
  constructor(private readonly ibefFetch = new IbefFetch()) {}

  async scrapeSingleIndustry(url: string): Promise<ScrapingResult> {
    const result = await this.scrapeIndustryPage(url);

    if (result.success && result.data) {
      await saveIndustryData(result.data);
    }

    return result;
  }

  async scrapeAllIndustries(): Promise<{ successCount: number; failCount: number }> {
    const industryList = await this.ibefFetch.fetchIndustryList();
    let successCount = 0;
    let failCount = 0;

    console.log(`Found ${industryList.totalCount} industries to scrape`);

    for (let i = 0; i < industryList.industries.length; i++) {
      const url = industryList.industries[i];

      try {
        const result = await this.scrapeIndustryPage(url);
        if (result.success && result.data) {
          await saveIndustryData(result.data);
          successCount++;
          console.log(`Scraped ${i + 1}/${industryList.totalCount}: ${result.industryName}`);
        } else {
          failCount++;
          console.warn(`Failed ${i + 1}/${industryList.totalCount}: ${url}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error scraping ${url}`, error);
      }

      if (i < industryList.industries.length - 1) {
        await delay(config.scrapingDelay);
      }
    }

    return { successCount, failCount };
  }

  private async scrapeIndustryPage(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      const { html } = await this.ibefFetch.fetchPage(url);
      const data = parseIndustryPage(html, url);

      return {
        success: !!data,
        industryName: extractIndustryNameFromUrl(url),
        url,
        data: data || undefined,
        scrapedAt: new Date(),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        industryName: extractIndustryNameFromUrl(url),
        url,
        error: (error as Error).message,
        scrapedAt: new Date(),
        processingTime: Date.now() - startTime,
      };
    }
  }
}

function extractIndustryNameFromUrl(url: string): string {
  const match = url.match(/\/industry\/([^/?]+)/);
  return match
    ? match[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Unknown';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
