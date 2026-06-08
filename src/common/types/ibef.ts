export interface IBEFIndustryData {
  _id?: string;
  industryName: string;
  industrySlug: string;
  url: string;
  lastUpdated: Date;
  scrapedAt: Date;

  overview: {
    title: string;
    description: string;
    advantageIndia: {
      title: string;
      sections: AdvantageIndiaSection[];
    };
  };

  introduction: {
    keyPoints: string[];
  };

  marketSize: {
    statistics: MarketStatistic[];
  };

  investments: {
    majorInvestments: string[];
  };

  governmentInitiatives: {
    initiatives: string[];
  };

  roadAhead: {
    goals: string[];
  };
}

export interface AdvantageIndiaSection {
  title: string;
  content: string;
}

export interface MarketStatistic {
  value: string;
}

export interface ScrapingResult {
  success: boolean;
  industryName: string;
  url: string;
  data?: IBEFIndustryData;
  error?: string;
  scrapedAt: Date;
  processingTime: number;
}

export interface IndustryListResponse {
  industries: string[];
  totalCount: number;
  scrapedAt: Date;
}
