import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

export const config = {
  mongodbUri: requireEnv('MONGODB_URI'),
  ibefBaseUrl: process.env.IBEF_BASE_URL || 'https://www.ibef.org',
  ibefIndustryListUrl: process.env.IBEF_INDUSTRY_LIST_URL || 'https://www.ibef.org/industry',
  ibefIndustryFeedUrl: process.env.IBEF_INDUSTRY_FEED_URL || 'https://www.ibef.org/industry/feed',
  scrapingDelay: Number(process.env.SCRAPING_DELAY || '2000') || 2000,
  requestTimeout: Number(process.env.REQUEST_TIMEOUT || '30000') || 30000,
  userAgent:
    process.env.USER_AGENT ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};
