import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config';
import { IndustryListResponse } from '../common/types/ibef';

export class IbefFetch {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: config.requestTimeout,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 5,
    });
  }

  async fetchPage(url: string): Promise<{ html: string; title: string }> {
    console.log(`Fetching page: ${url}`);

    const response = await this.http.get<string>(url, {
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const title = $('title').first().text().trim() || url;

    console.log(`Successfully fetched: ${title}`);
    return { html, title };
  }

  async fetchIndustryList(): Promise<IndustryListResponse> {
    const feedUrls = await this.fetchIndustryUrlsFromFeed();

    if (feedUrls.length) {
      return {
        industries: feedUrls,
        totalCount: feedUrls.length,
        scrapedAt: new Date(),
      };
    }

    console.warn('RSS feed returned no industries, falling back to industry listing page');
    const htmlUrls = await this.fetchIndustryUrlsFromListingPage();

    return {
      industries: htmlUrls,
      totalCount: htmlUrls.length,
      scrapedAt: new Date(),
    };
  }

  private async fetchIndustryUrlsFromFeed(): Promise<string[]> {
    const response = await this.http.get<string>(config.ibefIndustryFeedUrl, {
      responseType: 'text',
      headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const industries: string[] = [];

    $('item guid, item link').each((_, element) => {
      const url = $(element).text().trim();
      if (this.isValidIndustryUrl(url)) {
        industries.push(this.normalizeUrl(url));
      }
    });

    return [...new Set(industries)];
  }

  private async fetchIndustryUrlsFromListingPage(): Promise<string[]> {
    const { html } = await this.fetchPage(config.ibefIndustryListUrl);
    const $ = cheerio.load(html);
    const industries: string[] = [];

    $('a[href*="/industry/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      const fullUrl = href.startsWith('http') ? href : `${config.ibefBaseUrl}${href}`;
      if (this.isValidIndustryUrl(fullUrl)) {
        industries.push(this.normalizeUrl(fullUrl));
      }
    });

    return [...new Set(industries)];
  }

  private isValidIndustryUrl(url: string): boolean {
    return (
      url.includes('/industry/') &&
      !url.endsWith('/industry') &&
      !url.endsWith('/industry/') &&
      !url.includes('/industry/feed')
    );
  }

  private normalizeUrl(url: string): string {
    return url
      .replace('http://ibef.org', 'https://www.ibef.org')
      .replace('https://ibef.org', 'https://www.ibef.org');
  }
}
