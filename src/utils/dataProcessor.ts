import { IBEFIndustryData, KeyStat } from '../types/ibef';
import { logger } from './logger';

export class DataProcessor {
  /**
   * Clean and normalize text content
   */
  static cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Extract numeric values from text
   */
  static extractNumericValue(text: string): number | null {
    if (!text) return null;

    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Extract currency values from text
   */
  static extractCurrencyValue(text: string): { value: number; currency: string } | null {
    if (!text) return null;

    const currencyMatch = text.match(/(Rs\.?|USD|US\$|INR|₹)\s*([\d,]+\.?\d*)/i);
    if (currencyMatch) {
      const value = parseFloat(currencyMatch[2].replace(/,/g, ''));
      const currency = currencyMatch[1].toUpperCase();
      return { value, currency };
    }
    return null;
  }

  /**
   * Extract percentage values from text
   */
  static extractPercentage(text: string): number | null {
    if (!text) return null;

    const match = text.match(/([\d,]+\.?\d*)\s*%/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Clean and validate key statistics
   */
  static cleanKeyStats(keyStats: KeyStat[]): KeyStat[] {
    return keyStats
      .map(stat => ({
        ...stat,
        label: this.cleanText(stat.label),
        value: this.cleanText(stat.value),
        description: stat.description ? this.cleanText(stat.description) : undefined
      }))
      .filter(stat => stat.label && stat.value);
  }

  /**
   * Extract industry name from URL
   */
  static extractIndustryNameFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^\/\?]+)/);
    if (match) {
      return match[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Unknown Industry';
  }

  /**
   * Extract slug from URL
   */
  static extractSlugFromUrl(url: string): string {
    const match = url.match(/\/industry\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Validate and clean industry data
   */
  static validateIndustryData(data: Partial<IBEFIndustryData>): IBEFIndustryData | null {
    try {
      // Required fields validation
      if (!data.industryName || !data.industrySlug || !data.url) {
        logger.warn('Missing required fields in industry data');
        return null;
      }

      // Clean and validate the data
      const cleanedData: IBEFIndustryData = {
        industryName: this.cleanText(data.industryName),
        industrySlug: data.industrySlug,
        url: data.url,
        lastUpdated: data.lastUpdated || new Date(),
        scrapedAt: data.scrapedAt || new Date(),
        overview: {
          title: this.cleanText(data.overview?.title || ''),
          description: this.cleanText(data.overview?.description || ''),
          keyStats: this.cleanKeyStats(data.overview?.keyStats || []),
          advantageIndia: {
            title: this.cleanText(data.overview?.advantageIndia?.title || ''),
            sections: (data.overview?.advantageIndia?.sections || []).map(section => ({
              title: this.cleanText(section.title),
              content: this.cleanText(section.content),
              keyPoints: section.keyPoints.map(point => this.cleanText(point))
            }))
          }
        },
        introduction: {
          title: this.cleanText(data.introduction?.title || ''),
          content: this.cleanText(data.introduction?.content || ''),
          keyPoints: (data.introduction?.keyPoints || []).map(point => this.cleanText(point))
        },
        marketSize: {
          title: this.cleanText(data.marketSize?.title || ''),
          content: this.cleanText(data.marketSize?.content || ''),
          statistics: this.cleanKeyStats(data.marketSize?.statistics || [])
        },
        investments: {
          title: this.cleanText(data.investments?.title || ''),
          content: this.cleanText(data.investments?.content || ''),
          majorInvestments: (data.investments?.majorInvestments || []).map(investment => this.cleanText(investment))
        },
        sectorOverview: {
          title: this.cleanText(data.sectorOverview?.title || ''),
          content: this.cleanText(data.sectorOverview?.content || ''),
          keyPoints: (data.sectorOverview?.keyPoints || []).map(point => this.cleanText(point))
        },
        statutoryBodies: {
          title: this.cleanText(data.statutoryBodies?.title || ''),
          description: this.cleanText(data.statutoryBodies?.description || ''),
          bodies: (data.statutoryBodies?.bodies || []).map(body => this.cleanText(body))
        },
        governmentSchemes: {
          title: this.cleanText(data.governmentSchemes?.title || ''),
          description: this.cleanText(data.governmentSchemes?.description || ''),
          schemes: (data.governmentSchemes?.schemes || []).map(scheme => ({
            name: this.cleanText(scheme.name),
            description: this.cleanText(scheme.description),
            amount: scheme.amount ? this.cleanText(scheme.amount) : undefined,
            beneficiaries: scheme.beneficiaries ? this.cleanText(scheme.beneficiaries) : undefined,
            status: scheme.status || 'active'
          }))
        },
        governmentInitiatives: {
          title: this.cleanText(data.governmentInitiatives?.title || ''),
          description: this.cleanText(data.governmentInitiatives?.description || ''),
          initiatives: (data.governmentInitiatives?.initiatives || []).map(initiative => this.cleanText(initiative))
        },
        policySupport: {
          title: this.cleanText(data.policySupport?.title || ''),
          description: this.cleanText(data.policySupport?.description || ''),
          policies: (data.policySupport?.policies || []).map(policy => ({
            title: this.cleanText(policy.title),
            description: this.cleanText(policy.description),
            effectiveDate: policy.effectiveDate ? this.cleanText(policy.effectiveDate) : undefined,
            status: policy.status || 'active'
          }))
        },
        achievements: {
          title: this.cleanText(data.achievements?.title || ''),
          description: this.cleanText(data.achievements?.description || ''),
          achievements: (data.achievements?.achievements || []).map(achievement => this.cleanText(achievement))
        },
        roadAhead: {
          title: this.cleanText(data.roadAhead?.title || ''),
          description: this.cleanText(data.roadAhead?.description || ''),
          goals: (data.roadAhead?.goals || []).map(goal => this.cleanText(goal))
        },
        relatedNews: (data.relatedNews || []).map(news => ({
          title: this.cleanText(news.title),
          date: this.cleanText(news.date),
          summary: this.cleanText(news.summary),
          url: news.url,
          source: news.source ? this.cleanText(news.source) : undefined
        })),
        industryContacts: (data.industryContacts || []).map(contact => ({
          name: this.cleanText(contact.name),
          organization: this.cleanText(contact.organization),
          role: contact.role ? this.cleanText(contact.role) : undefined,
          contactInfo: contact.contactInfo ? this.cleanText(contact.contactInfo) : undefined
        })),
        msmeData: data.msmeData ? {
          classification: {
            micro: {
              investmentLimit: this.cleanText(data.msmeData.classification.micro.investmentLimit),
              turnoverLimit: this.cleanText(data.msmeData.classification.micro.turnoverLimit),
              description: this.cleanText(data.msmeData.classification.micro.description)
            },
            small: {
              investmentLimit: this.cleanText(data.msmeData.classification.small.investmentLimit),
              turnoverLimit: this.cleanText(data.msmeData.classification.small.turnoverLimit),
              description: this.cleanText(data.msmeData.classification.small.description)
            },
            medium: {
              investmentLimit: this.cleanText(data.msmeData.classification.medium.investmentLimit),
              turnoverLimit: this.cleanText(data.msmeData.classification.medium.turnoverLimit),
              description: this.cleanText(data.msmeData.classification.medium.description)
            }
          },
          clusters: (data.msmeData.clusters || []).map(cluster => this.cleanText(cluster)),
          contribution: {
            manufacturingGDP: this.cleanText(data.msmeData.contribution.manufacturingGDP),
            serviceGDP: this.cleanText(data.msmeData.contribution.serviceGDP),
            totalGDP: this.cleanText(data.msmeData.contribution.totalGDP)
          }
        } : undefined,
        metadata: {
          totalSections: data.metadata?.totalSections || 0,
          hasImages: data.metadata?.hasImages || false,
          hasVideos: data.metadata?.hasVideos || false,
          hasDownloads: data.metadata?.hasDownloads || false,
          wordCount: data.metadata?.wordCount || 0
        }
      };

      return cleanedData;
    } catch (error) {
      logger.error('Error validating industry data:', error);
      return null;
    }
  }

  /**
   * Calculate word count for text
   */
  static calculateWordCount(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract keywords from text
   */
  static extractKeywords(text: string, maxKeywords: number = 10): string[] {
    if (!text) return [];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate summary statistics for industry data
   */
  static generateSummaryStats(data: IBEFIndustryData): {
    totalSections: number;
    totalKeyStats: number;
    totalSchemes: number;
    totalPolicies: number;
    totalNews: number;
    totalContacts: number;
    wordCount: number;
  } {
    return {
      totalSections: data.metadata.totalSections,
      totalKeyStats: data.overview.keyStats.length,
      totalSchemes: data.governmentSchemes.schemes.length,
      totalPolicies: data.policySupport.policies.length,
      totalNews: data.relatedNews.length,
      totalContacts: data.industryContacts.length,
      wordCount: data.metadata.wordCount
    };
  }
}
