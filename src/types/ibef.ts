export interface IBEFIndustryData {
  _id?: string;
  industryName: string;
  industrySlug: string;
  url: string;
  lastUpdated: Date;
  scrapedAt: Date;

  // Overview section
  overview: {
    title: string;
    description: string;
    keyStats: KeyStat[];
    advantageIndia: AdvantageIndia;
  };

  // Introduction section
  introduction: {
    title: string;
    content: string;
    keyPoints: string[];
  };

  // Market Size section
  marketSize: {
    title: string;
    content: string;
    statistics: KeyStat[];
  };

  // Investments section
  investments: {
    title: string;
    content: string;
    majorInvestments: string[];
  };

  // Sector overview
  sectorOverview: {
    title: string;
    content: string;
    keyPoints: string[];
  };

  // Statutory bodies
  statutoryBodies: {
    title: string;
    description: string;
    bodies: string[];
  };

  // Government schemes
  governmentSchemes: {
    title: string;
    description: string;
    schemes: Scheme[];
  };

  // Government initiatives
  governmentInitiatives: {
    title: string;
    description: string;
    initiatives: string[];
  };

  // Policy support
  policySupport: {
    title: string;
    description: string;
    policies: Policy[];
  };

  // Achievements
  achievements: {
    title: string;
    description: string;
    achievements: string[];
  };

  // Road ahead
  roadAhead: {
    title: string;
    description: string;
    goals: string[];
  };

  // Related news
  relatedNews: NewsItem[];

  // Industry contacts
  industryContacts: Contact[];

  // MSME specific data (for MSME industry)
  msmeData?: MSMEData;

  // Additional metadata
  metadata: {
    totalSections: number;
    hasImages: boolean;
    hasVideos: boolean;
    hasDownloads: boolean;
    wordCount: number;
  };
}

export interface KeyStat {
  label: string;
  value: string;
  description?: string;
}

export interface AdvantageIndia {
  title: string;
  sections: {
    title: string;
    content: string;
    keyPoints: string[];
  }[];
}

export interface Scheme {
  name: string;
  description: string;
  amount?: string;
  beneficiaries?: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface Policy {
  title: string;
  description: string;
  effectiveDate?: string;
  status: 'active' | 'draft' | 'expired';
}

export interface NewsItem {
  title: string;
  date: string;
  summary: string;
  url?: string;
  source?: string;
}

export interface Contact {
  name: string;
  organization: string;
  role?: string;
  contactInfo?: string;
}

export interface MSMEData {
  classification: {
    micro: ClassificationCriteria;
    small: ClassificationCriteria;
    medium: ClassificationCriteria;
  };
  clusters: string[];
  contribution: {
    manufacturingGDP: string;
    serviceGDP: string;
    totalGDP: string;
  };
}

export interface ClassificationCriteria {
  investmentLimit: string;
  turnoverLimit: string;
  description: string;
}

export interface ScrapingConfig {
  baseUrl: string;
  industryListUrl: string;
  delayBetweenRequests: number;
  maxRetries: number;
  timeout: number;
  userAgent: string;
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

export interface ScrapingStatus {
  totalIndustries: number;
  completed: number;
  failed: number;
  inProgress: number;
  results: ScrapingResult[];
  startTime: Date;
  endTime?: Date;
  isComplete: boolean;
}

export interface IndustryListResponse {
  industries: string[];
  totalCount: number;
  scrapedAt: Date;
}

export interface ScrapingProgress {
  current: number;
  total: number;
  percentage: number;
  currentIndustry: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}
