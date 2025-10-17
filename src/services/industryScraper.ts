import * as cheerio from 'cheerio';
import { IBEFIndustryData, KeyStat, AdvantageIndia, Scheme, Policy, NewsItem, Contact, MSMEData } from '../types/ibef';
import { DataProcessor } from '../utils/dataProcessor';
import { logger } from '../utils/logger';

export class IndustryScraper {
  private $: cheerio.CheerioAPI;

  constructor(html: string) {
    this.$ = cheerio.load(html);
  }

  extractIndustryData(url: string): IBEFIndustryData | null {
    try {
      const industryName = this.extractIndustryName();
      const industrySlug = this.extractSlugFromUrl(url);

      const rawData: Partial<IBEFIndustryData> = {
        industryName,
        industrySlug,
        url,
        lastUpdated: new Date(),
        scrapedAt: new Date(),
        overview: this.extractOverview(),
        sectorOverview: this.extractSectorOverview(),
        statutoryBodies: this.extractStatutoryBodies(),
        governmentSchemes: this.extractGovernmentSchemes(),
        policySupport: this.extractPolicySupport(),
        achievements: this.extractAchievements(),
        roadAhead: this.extractRoadAhead(),
        relatedNews: this.extractRelatedNews(),
        industryContacts: this.extractIndustryContacts(),
        msmeData: this.extractMSMEData(),
        metadata: this.extractMetadata()
      };

      // Validate and clean the data
      const validatedData = DataProcessor.validateIndustryData(rawData);
      if (!validatedData) {
        logger.warn(`Failed to validate data for ${industryName}`);
        return null;
      }

      logger.info(`Successfully extracted data for ${industryName}`);
      return validatedData;
    } catch (error) {
      logger.error('Error extracting industry data:', error);
      return null;
    }
  }

  private extractIndustryName(): string {
    // Try multiple selectors for industry name
    const selectors = [
      'h1',
      '.page-title',
      '.industry-title',
      'title'
    ];

    for (const selector of selectors) {
      const element = this.$(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text !== 'IBEF') {
          return text.replace(' - IBEF', '').replace(' | IBEF', '');
        }
      }
    }

    return 'Unknown Industry';
  }

  private extractSlugFromUrl(url: string): string {
    return DataProcessor.extractSlugFromUrl(url);
  }

  private extractOverview(): { title: string; description: string; keyStats: KeyStat[]; advantageIndia: AdvantageIndia } {
    const title = this.$('h1').first().text().trim();
    
    // Extract description from the first paragraph or intro section
    let description = '';
    const introSelectors = ['.sector-overview', '.introduction', '.overview', '.description'];
    
    for (const selector of introSelectors) {
      const section = this.$(selector).first();
      if (section.length) {
        description = section.find('p').first().text().trim();
        if (description) break;
      }
    }
    
    if (!description) {
      description = this.$('p').first().text().trim();
    }

    // Extract key statistics
    const keyStats = this.extractKeyStats();

    // Extract Advantage India section
    const advantageIndia = this.extractAdvantageIndia();

    return { title, description, keyStats, advantageIndia };
  }

  private extractKeyStats(): KeyStat[] {
    const keyStats: KeyStat[] = [];
    
    // Look for various stat containers
    const statSelectors = [
      '.key-stats .stat',
      '.statistics .stat',
      '.numbers .stat',
      '.metric',
      '.stat-item',
      '.key-metric'
    ];

    statSelectors.forEach(selector => {
      this.$(selector).each((_, element) => {
        const $el = this.$(element);
        const label = $el.find('.label, .title, .name').text().trim() || 
                     $el.find('strong, b').text().trim() ||
                     $el.attr('data-label') || '';
        const value = $el.find('.value, .number, .amount').text().trim() || 
                     $el.text().replace(label, '').trim();
        
        if (label && value && !label.includes(value)) {
          keyStats.push({
            label: DataProcessor.cleanText(label),
            value: DataProcessor.cleanText(value),
            description: $el.find('.description').text().trim() || undefined
          });
        }
      });
    });

    // Also look for table-based stats
    this.$('table tr').each((_, row) => {
      const $row = this.$(row);
      const cells = $row.find('td');
      if (cells.length >= 2) {
        const label = cells.first().text().trim();
        const value = cells.eq(1).text().trim();
        
        if (label && value && !label.includes(value)) {
          keyStats.push({
            label: DataProcessor.cleanText(label),
            value: DataProcessor.cleanText(value)
          });
        }
      }
    });

    return keyStats;
  }

  private extractAdvantageIndia(): AdvantageIndia {
    const title = 'Advantage India';
    const sections: { title: string; content: string; keyPoints: string[] }[] = [];

    // Look for Advantage India section
    const advantageSection = this.$('*:contains("Advantage India")').closest('div, section').first();
    
    if (advantageSection.length) {
      advantageSection.find('h3, h4, .subtitle, .section-title').each((_, element) => {
        const $el = this.$(element);
        const sectionTitle = $el.text().trim();
        const content = $el.nextUntil('h3, h4, .subtitle, .section-title').text().trim();
        const keyPoints: string[] = [];
        
        $el.nextUntil('h3, h4, .subtitle, .section-title').find('li, .bullet-point, .point').each((_, li) => {
          const point = this.$(li).text().trim();
          if (point) keyPoints.push(DataProcessor.cleanText(point));
        });

        if (sectionTitle && (content || keyPoints.length > 0)) {
          sections.push({ 
            title: DataProcessor.cleanText(sectionTitle), 
            content: DataProcessor.cleanText(content), 
            keyPoints 
          });
        }
      });
    }

    return { title, sections };
  }

  private extractSectorOverview(): { title: string; content: string; keyPoints: string[] } {
    const title = 'Sector Overview';
    let content = '';
    const keyPoints: string[] = [];

    // Look for sector overview content
    const overviewSelectors = ['.sector-overview', '.overview', '.introduction', '.description'];
    
    for (const selector of overviewSelectors) {
      const section = this.$(selector).first();
      if (section.length) {
        content = section.text().trim();
        section.find('li, .bullet-point, .point').each((_, element) => {
          const point = this.$(element).text().trim();
          if (point) keyPoints.push(DataProcessor.cleanText(point));
        });
        if (content) break;
      }
    }

    return { title, content: DataProcessor.cleanText(content), keyPoints };
  }

  private extractStatutoryBodies(): { title: string; description: string; bodies: string[] } {
    const title = 'Statutory Bodies';
    let description = '';
    const bodies: string[] = [];

    // Look for statutory bodies section
    const bodiesSection = this.$('*:contains("Statutory Bodies")').closest('div, section').first();
    if (bodiesSection.length) {
      description = bodiesSection.text().trim();
      bodiesSection.find('li, .body-item, .organization').each((_, element) => {
        const body = this.$(element).text().trim();
        if (body) bodies.push(DataProcessor.cleanText(body));
      });
    }

    return { 
      title, 
      description: DataProcessor.cleanText(description), 
      bodies 
    };
  }

  private extractGovernmentSchemes(): { title: string; description: string; schemes: Scheme[] } {
    const title = 'Government Schemes';
    let description = '';
    const schemes: Scheme[] = [];

    // Look for government schemes section
    const schemesSection = this.$('*:contains("Government Schemes")').closest('div, section').first();
    if (schemesSection.length) {
      description = schemesSection.text().trim();
      
      schemesSection.find('li, .scheme-item, .program-item').each((_, element) => {
        const $el = this.$(element);
        const name = $el.find('.name, .title, .scheme-name').text().trim() || $el.text().trim();
        const description = $el.find('.description, .details').text().trim();
        const amount = $el.find('.amount, .value, .budget').text().trim();
        const beneficiaries = $el.find('.beneficiaries, .target').text().trim();
        
        if (name) {
          schemes.push({
            name: DataProcessor.cleanText(name),
            description: DataProcessor.cleanText(description),
            amount: amount ? DataProcessor.cleanText(amount) : undefined,
            beneficiaries: beneficiaries ? DataProcessor.cleanText(beneficiaries) : undefined,
            status: 'active' as const
          });
        }
      });
    }

    return { 
      title, 
      description: DataProcessor.cleanText(description), 
      schemes 
    };
  }

  private extractPolicySupport(): { title: string; description: string; policies: Policy[] } {
    const title = 'Policy Support';
    let description = '';
    const policies: Policy[] = [];

    // Look for policy support section
    const policySection = this.$('*:contains("Policy Support")').closest('div, section').first();
    if (policySection.length) {
      description = policySection.text().trim();
      
      policySection.find('li, .policy-item, .initiative-item').each((_, element) => {
        const $el = this.$(element);
        const policyTitle = $el.find('.title, .name, .policy-name').text().trim() || $el.text().trim();
        const policyDescription = $el.find('.description, .details').text().trim();
        const effectiveDate = $el.find('.date, .effective-date, .launch-date').text().trim();
        
        if (policyTitle) {
          policies.push({
            title: DataProcessor.cleanText(policyTitle),
            description: DataProcessor.cleanText(policyDescription),
            effectiveDate: effectiveDate ? DataProcessor.cleanText(effectiveDate) : undefined,
            status: 'active' as const
          });
        }
      });
    }

    return { 
      title, 
      description: DataProcessor.cleanText(description), 
      policies 
    };
  }

  private extractAchievements(): { title: string; description: string; achievements: string[] } {
    const title = 'Achievements';
    let description = '';
    const achievements: string[] = [];

    // Look for achievements section
    const achievementsSection = this.$('*:contains("Achievements")').closest('div, section').first();
    if (achievementsSection.length) {
      description = achievementsSection.text().trim();
      achievementsSection.find('li, .achievement-item, .milestone').each((_, element) => {
        const achievement = this.$(element).text().trim();
        if (achievement) achievements.push(DataProcessor.cleanText(achievement));
      });
    }

    return { 
      title, 
      description: DataProcessor.cleanText(description), 
      achievements 
    };
  }

  private extractRoadAhead(): { title: string; description: string; goals: string[] } {
    const title = 'Road Ahead';
    let description = '';
    const goals: string[] = [];

    // Look for road ahead section
    const roadAheadSection = this.$('*:contains("Road Ahead")').closest('div, section').first();
    if (roadAheadSection.length) {
      description = roadAheadSection.text().trim();
      roadAheadSection.find('li, .goal-item, .objective').each((_, element) => {
        const goal = this.$(element).text().trim();
        if (goal) goals.push(DataProcessor.cleanText(goal));
      });
    }

    return { 
      title, 
      description: DataProcessor.cleanText(description), 
      goals 
    };
  }

  private extractRelatedNews(): NewsItem[] {
    const news: NewsItem[] = [];

    // Look for related news section
    const newsSection = this.$('*:contains("Related News")').closest('div, section').first();
    if (newsSection.length) {
      newsSection.find('.news-item, .article-item, li, .news-entry').each((_, element) => {
        const $el = this.$(element);
        const title = $el.find('.title, .headline, .news-title').text().trim() || $el.text().trim();
        const date = $el.find('.date, .published-date, .news-date').text().trim();
        const summary = $el.find('.summary, .excerpt, .description').text().trim();
        const url = $el.find('a').attr('href') || '';
        const source = $el.find('.source, .publication').text().trim();

        if (title) {
          news.push({
            title: DataProcessor.cleanText(title),
            date: DataProcessor.cleanText(date),
            summary: DataProcessor.cleanText(summary),
            url: url.startsWith('http') ? url : `https://ibef.org${url}`,
            source: source ? DataProcessor.cleanText(source) : undefined
          });
        }
      });
    }

    return news;
  }

  private extractIndustryContacts(): Contact[] {
    const contacts: Contact[] = [];

    // Look for industry contacts section
    const contactsSection = this.$('*:contains("Industry Contacts")').closest('div, section').first();
    if (contactsSection.length) {
      contactsSection.find('.contact-item, li, .contact').each((_, element) => {
        const $el = this.$(element);
        const name = $el.find('.name, .contact-name, .person').text().trim();
        const organization = $el.find('.organization, .company, .institution').text().trim();
        const role = $el.find('.role, .position, .title').text().trim();
        const contactInfo = $el.find('.contact-info, .details, .contact-details').text().trim();

        if (name || organization) {
          contacts.push({
            name: DataProcessor.cleanText(name),
            organization: DataProcessor.cleanText(organization),
            role: role ? DataProcessor.cleanText(role) : undefined,
            contactInfo: contactInfo ? DataProcessor.cleanText(contactInfo) : undefined
          });
        }
      });
    }

    return contacts;
  }

  private extractMSMEData(): MSMEData | undefined {
    // Check if this is MSME industry
    const isMSME = this.$('*:contains("MSME")').length > 0 || 
                   this.$('title').text().toLowerCase().includes('msme') ||
                   this.$('h1').text().toLowerCase().includes('msme');

    if (!isMSME) return undefined;

    const classification = {
      micro: {
        investmentLimit: '',
        turnoverLimit: '',
        description: ''
      },
      small: {
        investmentLimit: '',
        turnoverLimit: '',
        description: ''
      },
      medium: {
        investmentLimit: '',
        turnoverLimit: '',
        description: ''
      }
    };

    // Extract MSME classification data
    this.$('*:contains("Micro")').each((_, element) => {
      const $el = this.$(element);
      const text = $el.text();
      const investmentMatch = text.match(/Rs\.?\s*([0-9,\.]+)\s*crore/i);
      const turnoverMatch = text.match(/Rs\.?\s*([0-9,\.]+)\s*crore/i);
      
      if (investmentMatch) classification.micro.investmentLimit = investmentMatch[1];
      if (turnoverMatch) classification.micro.turnoverLimit = turnoverMatch[1];
    });

    const clusters: string[] = [];
    this.$('*:contains("Clusters")').next().find('li').each((_, element) => {
      const cluster = this.$(element).text().trim();
      if (cluster) clusters.push(DataProcessor.cleanText(cluster));
    });

    return {
      classification,
      clusters,
      contribution: {
        manufacturingGDP: '',
        serviceGDP: '',
        totalGDP: ''
      }
    };
  }

  private extractMetadata(): { totalSections: number; hasImages: boolean; hasVideos: boolean; hasDownloads: boolean; wordCount: number } {
    const totalSections = this.$('h1, h2, h3, h4').length;
    const hasImages = this.$('img').length > 0;
    const hasVideos = this.$('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
    const hasDownloads = this.$('a[href*=".pdf"], a[href*=".doc"], a[href*=".xlsx"]').length > 0;
    const wordCount = DataProcessor.calculateWordCount(this.$('body').text());

    return {
      totalSections,
      hasImages,
      hasVideos,
      hasDownloads,
      wordCount
    };
  }
}
