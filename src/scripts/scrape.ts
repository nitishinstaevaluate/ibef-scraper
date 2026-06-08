import { connectDb, disconnectDb } from '../db/connection';
import { ScrapeOrchestrator } from '../scraper/scrape-orchestrator';

async function main() {
  await connectDb();

  try {
    const orchestrator = new ScrapeOrchestrator();
    const { successCount, failCount } = await orchestrator.scrapeAllIndustries();
    console.log(`Scraping completed! Success: ${successCount}, Failed: ${failCount}`);
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  console.error('Scraping failed:', error);
  process.exit(1);
});
