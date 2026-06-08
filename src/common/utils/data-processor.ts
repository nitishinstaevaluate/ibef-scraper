import { IBEFIndustryData } from '../types/ibef';

export class DataProcessor {
  static cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .trim();
  }

  static cleanStringList(items: string[]): string[] {
    return items
      .map((item) => this.cleanText(item))
      .filter((item) => item.length > 0);
  }

  static extractSlugFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^/?]+)/);
    return match ? match[1] : 'unknown';
  }

  static validateIndustryData(data: Partial<IBEFIndustryData>): IBEFIndustryData | null {
    try {
      if (!data.industryName || !data.industrySlug || !data.url) {
        console.warn('Missing required fields in industry data');
        return null;
      }

      return {
        industryName: this.cleanText(data.industryName),
        industrySlug: data.industrySlug,
        url: data.url,
        lastUpdated: data.lastUpdated || new Date(),
        scrapedAt: data.scrapedAt || new Date(),
        overview: {
          title: this.cleanText(data.overview?.title || ''),
          description: this.cleanText(data.overview?.description || ''),
          advantageIndia: {
            title: this.cleanText(data.overview?.advantageIndia?.title || 'Advantage India'),
            sections: (data.overview?.advantageIndia?.sections || [])
              .map((section) => ({
                title: this.cleanText(section.title),
                content: this.cleanText(section.content),
              }))
              .filter((section) => section.title || section.content),
          },
        },
        introduction: {
          keyPoints: this.cleanStringList(data.introduction?.keyPoints || []),
        },
        marketSize: {
          statistics: (data.marketSize?.statistics || [])
            .map((stat) => ({ value: this.cleanText(stat.value) }))
            .filter((stat) => stat.value),
        },
        investments: {
          majorInvestments: this.cleanStringList(data.investments?.majorInvestments || []),
        },
        governmentInitiatives: {
          initiatives: this.cleanStringList(data.governmentInitiatives?.initiatives || []),
        },
        roadAhead: {
          goals: this.cleanStringList(data.roadAhead?.goals || []),
        },
      };
    } catch (error) {
      console.error('Error validating industry data', error);
      return null;
    }
  }
}
