import * as cheerio from 'cheerio';
import { IBEFIndustryData } from '../common/types/ibef';
import { DataProcessor } from '../common/utils/data-processor';

export function parseIndustryPage(html: string, url: string): IBEFIndustryData | null {
  try {
    const $ = cheerio.load(html);
    const industryName = extractIndustryName($);
    const industrySlug = DataProcessor.extractSlugFromUrl(url);

    const rawData: Partial<IBEFIndustryData> = {
      industryName,
      industrySlug,
      url,
      lastUpdated: new Date(),
      scrapedAt: new Date(),
      overview: extractOverview($),
      introduction: extractIntroduction($),
      marketSize: extractMarketSize($),
      investments: extractInvestments($),
      governmentInitiatives: extractGovernmentInitiatives($),
      roadAhead: extractRoadAhead($),
    };

    const validatedData = DataProcessor.validateIndustryData(rawData);
    if (!validatedData) {
      console.warn(`Failed to validate data for ${industryName}`);
      return null;
    }

    console.log(`Successfully extracted data for ${industryName}`);
    return validatedData;
  } catch (error) {
    console.error('Error extracting industry data', error);
    return null;
  }
}

function extractIndustryName($: cheerio.CheerioAPI): string {
  const h1 = $('.innerbanner h1, h1').first().text().trim();
  if (h1 && h1 !== 'IBEF') {
    return h1.replace(' - IBEF', '').replace(' | IBEF', '');
  }

  const title = $('title').first().text().trim();
  if (title) {
    return title.split('|')[0].trim();
  }

  return 'Unknown Industry';
}

function extractOverview($: cheerio.CheerioAPI): IBEFIndustryData['overview'] {
  const title = $('.innerbanner h1, h1').first().text().trim();

  let description = $('.innerbanner p.text-white, .innerbanner p').first().text().trim();
  if (!description) {
    description = $('.common-section.introduction p').first().text().trim();
  }

  return {
    title: DataProcessor.cleanText(title),
    description: DataProcessor.cleanText(description),
    advantageIndia: extractAdvantageIndia($),
  };
}

function extractAdvantageIndia($: cheerio.CheerioAPI): IBEFIndustryData['overview']['advantageIndia'] {
  const sections: { title: string; content: string }[] = [];

  $('section.advantageIndia .item').each((_, element) => {
    const $item = $(element);
    const title = DataProcessor.cleanText(
      $item.find('h3').html()?.replace(/<br\s*\/?>/gi, ' ') || $item.find('h3').text(),
    );

    const points: string[] = [];
    $item.find('.box p').each((__, pElement) => {
      const text = $(pElement).text().replace(/^\s*\*\s*/, '').trim();
      if (text) {
        points.push(DataProcessor.cleanText(text));
      }
    });

    if (title || points.length) {
      sections.push({
        title,
        content: points.map((point) => `*${point}`).join(''),
      });
    }
  });

  return { title: 'Advantage India', sections };
}

function extractIntroduction($: cheerio.CheerioAPI): IBEFIndustryData['introduction'] {
  const keyPoints: string[] = [];

  $('.common-section.introduction p').each((_, element) => {
    const point = $(element).text().trim();
    if (point) {
      keyPoints.push(DataProcessor.cleanText(point));
    }
  });

  return { keyPoints };
}

function extractMarketSize($: cheerio.CheerioAPI): IBEFIndustryData['marketSize'] {
  const statistics: { value: string }[] = [];
  const marketSizeSection = $('.common-section.market-size');

  marketSizeSection.find('p').each((_, pElement) => {
    const $p = $(pElement);
    const liElements = $p.find('li');

    if (liElements.length > 0) {
      liElements.each((__, liElement) => {
        const text = $(liElement).text().trim();
        if (text) {
          statistics.push({ value: DataProcessor.cleanText(text) });
        }
      });
    } else {
      const text = $p.text().trim();
      if (text) {
        statistics.push({ value: DataProcessor.cleanText(text) });
      }
    }
  });

  if (!statistics.length) {
    marketSizeSection.find('li').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        statistics.push({ value: DataProcessor.cleanText(text) });
      }
    });
  }

  return { statistics };
}

function extractInvestments($: cheerio.CheerioAPI): IBEFIndustryData['investments'] {
  const majorInvestments: string[] = [];
  const investmentSelectors = [
    '.common-section.investments',
    '.common-section.investment',
    '.common-section.recent-development',
    '.common-section.key-investments-and-developments',
  ];

  let investmentSection = $('');
  for (const selector of investmentSelectors) {
    investmentSection = $(selector);
    if (investmentSection.length) break;
  }

  investmentSection.find('li').each((_, element) => {
    const investment = $(element).text().trim();
    if (investment) {
      majorInvestments.push(DataProcessor.cleanText(investment));
    }
  });

  return { majorInvestments };
}

function extractGovernmentInitiatives($: cheerio.CheerioAPI): IBEFIndustryData['governmentInitiatives'] {
  const initiatives: string[] = [];

  $('.common-section.government-initiatives li').each((_, element) => {
    const initiative = $(element).text().trim();
    if (initiative) {
      initiatives.push(DataProcessor.cleanText(initiative));
    }
  });

  return { initiatives };
}

function extractRoadAhead($: cheerio.CheerioAPI): IBEFIndustryData['roadAhead'] {
  const goals: string[] = [];

  $('.common-section.road-ahead p').each((_, element) => {
    const goal = $(element).text().trim();
    if (goal) {
      goals.push(DataProcessor.cleanText(goal));
    }
  });

  return { goals };
}
