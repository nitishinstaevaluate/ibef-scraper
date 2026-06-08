import { connectDb, disconnectDb } from '../db/connection';
import { ScrapeOrchestrator } from '../scraper/scrape-orchestrator';

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: npm run scrape:single <URL>');
    console.error('Example: npm run scrape:single https://www.ibef.org/industry/india-automobiles');
    process.exit(1);
  }

  await connectDb();

  try {
    const orchestrator = new ScrapeOrchestrator();
    const result = await orchestrator.scrapeSingleIndustry(url);

    if (result.success && result.data) {
      const data = result.data;
      console.log('\n=== SCRAPING SUMMARY ===');
      console.log(`Industry: ${data.industryName}`);
      console.log(`Slug: ${data.industrySlug}`);
      console.log(`URL: ${data.url}`);
      console.log(`Overview description: ${data.overview.description ? 'yes' : 'no'}`);
      console.log(`Advantage India cards: ${data.overview.advantageIndia.sections.length}`);
      console.log(`Introduction points: ${data.introduction.keyPoints.length}`);
      console.log(`Market size stats: ${data.marketSize.statistics.length}`);
      console.log(`Investments: ${data.investments.majorInvestments.length}`);
      console.log(`Government initiatives: ${data.governmentInitiatives.initiatives.length}`);
      console.log(`Road ahead goals: ${data.roadAhead.goals.length}`);
    } else {
      console.error('Failed to extract data from the page');
      process.exit(1);
    }
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  console.error('Scraping failed:', error);
  process.exit(1);
});
