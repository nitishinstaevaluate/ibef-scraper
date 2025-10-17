import mongoose, { Connection, Model, Document } from 'mongoose';
import { IBEFIndustryData } from '../types/ibef';
import { logger } from '../utils/logger';

// MongoDB Schema
const IBEFIndustrySchema = new mongoose.Schema({
  industryName: { type: String, required: true },
  industrySlug: { type: String, required: true, unique: true },
  url: { type: String, required: true, unique: true },
  lastUpdated: { type: Date, default: Date.now },
  scrapedAt: { type: Date, default: Date.now },
  
  overview: {
    title: String,
    description: String,
    keyStats: [{
      label: String,
      value: String,
      description: String
    }],
    advantageIndia: {
      title: String,
      sections: [{
        title: String,
        content: String,
        keyPoints: [String]
      }]
    }
  },
  
  sectorOverview: {
    title: String,
    content: String,
    keyPoints: [String]
  },
  
  statutoryBodies: {
    title: String,
    description: String,
    bodies: [String]
  },
  
  governmentSchemes: {
    title: String,
    description: String,
    schemes: [{
      name: String,
      description: String,
      amount: String,
      beneficiaries: String,
      status: { type: String, enum: ['active', 'completed', 'upcoming'], default: 'active' }
    }]
  },
  
  policySupport: {
    title: String,
    description: String,
    policies: [{
      title: String,
      description: String,
      effectiveDate: String,
      status: { type: String, enum: ['active', 'draft', 'expired'], default: 'active' }
    }]
  },
  
  achievements: {
    title: String,
    description: String,
    achievements: [String]
  },
  
  roadAhead: {
    title: String,
    description: String,
    goals: [String]
  },
  
  relatedNews: [{
    title: String,
    date: String,
    summary: String,
    url: String,
    source: String
  }],
  
  industryContacts: [{
    name: String,
    organization: String,
    role: String,
    contactInfo: String
  }],
  
  msmeData: {
    classification: {
      micro: {
        investmentLimit: String,
        turnoverLimit: String,
        description: String
      },
      small: {
        investmentLimit: String,
        turnoverLimit: String,
        description: String
      },
      medium: {
        investmentLimit: String,
        turnoverLimit: String,
        description: String
      }
    },
    clusters: [String],
    contribution: {
      manufacturingGDP: String,
      serviceGDP: String,
      totalGDP: String
    }
  },
  
  metadata: {
    totalSections: { type: Number, default: 0 },
    hasImages: { type: Boolean, default: false },
    hasVideos: { type: Boolean, default: false },
    hasDownloads: { type: Boolean, default: false },
    wordCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'ibef_scraper'
});

// Create indexes for better performance
IBEFIndustrySchema.index({ industryName: 1 });
// industrySlug already has unique: true which creates an index
IBEFIndustrySchema.index({ scrapedAt: -1 });
IBEFIndustrySchema.index({ 'overview.keyStats.label': 1 });
IBEFIndustrySchema.index({ createdAt: -1 });
IBEFIndustrySchema.index({ updatedAt: -1 });

export interface IBEFIndustryDocument extends Omit<IBEFIndustryData, '_id'>, Document {}

export class MongoService {
  private connection: Connection | null = null;
  private IndustryModel: Model<IBEFIndustryDocument> | null = null;

  async connect(connectionString: string): Promise<void> {
    try {
      logger.info('Connecting to MongoDB...');
      
      // Add connection event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
      
      await mongoose.connect(connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      
      this.connection = mongoose.connection;
      this.IndustryModel = mongoose.model<IBEFIndustryDocument>('IBEFIndustry', IBEFIndustrySchema);
      
      logger.info('Connected to MongoDB successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.IndustryModel = null;
      logger.info('Disconnected from MongoDB');
    }
  }

  async saveIndustryData(data: IBEFIndustryData): Promise<IBEFIndustryDocument> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    try {
      // Use upsert to update existing or create new
      const result = await this.IndustryModel.findOneAndUpdate(
        { industrySlug: data.industrySlug },
        { 
          ...data,
          lastUpdated: new Date(),
          scrapedAt: new Date()
        },
        { 
          upsert: true, 
          new: true, 
          runValidators: true 
        }
      );
      
      logger.info(`Saved industry data for: ${data.industryName}`);
      return result;
    } catch (error) {
      logger.error('Error saving industry data:', error);
      throw error;
    }
  }

  async getIndustryData(slug: string): Promise<IBEFIndustryDocument | null> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    return await this.IndustryModel.findOne({ industrySlug: slug });
  }

  async getAllIndustries(): Promise<IBEFIndustryDocument[]> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    return await this.IndustryModel.find().sort({ scrapedAt: -1 });
  }

  async searchIndustries(query: string): Promise<IBEFIndustryDocument[]> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    const searchRegex = new RegExp(query, 'i');
    return await this.IndustryModel.find({
      $or: [
        { industryName: searchRegex },
        { 'overview.description': searchRegex },
        { 'sectorOverview.content': searchRegex }
      ]
    }).sort({ scrapedAt: -1 });
  }

  async getIndustriesByCategory(category: string): Promise<IBEFIndustryDocument[]> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    return await this.IndustryModel.find({
      'overview.keyStats.label': new RegExp(category, 'i')
    }).sort({ scrapedAt: -1 });
  }

  async deleteIndustryData(slug: string): Promise<boolean> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    const result = await this.IndustryModel.deleteOne({ industrySlug: slug });
    logger.info(`Deleted industry data for slug: ${slug}`);
    return result.deletedCount > 0;
  }

  async getScrapingStats(): Promise<{
    totalIndustries: number;
    lastScraped: Date | null;
    industriesByMonth: { month: string; count: number }[];
  }> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    const totalIndustries = await this.IndustryModel.countDocuments();
    const lastScraped = await this.IndustryModel.findOne().sort({ scrapedAt: -1 }).select('scrapedAt');
    
    // Get industries by month for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const industriesByMonth = await this.IndustryModel.aggregate([
      {
        $match: {
          scrapedAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$scrapedAt' },
            month: { $month: '$scrapedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: 1
                }
              }
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    return {
      totalIndustries,
      lastScraped: lastScraped?.scrapedAt || null,
      industriesByMonth
    };
  }

  async isConnected(): Promise<boolean> {
    return this.connection?.readyState === 1;
  }

  async getRecentIndustries(limit: number = 10): Promise<IBEFIndustryDocument[]> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    return await this.IndustryModel.find()
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .select('industryName industrySlug url scrapedAt');
  }

  async getIndustryCount(): Promise<number> {
    if (!this.IndustryModel) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }

    return await this.IndustryModel.countDocuments();
  }
}
