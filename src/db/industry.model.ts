import mongoose, { Document, Model } from 'mongoose';
import { IBEFIndustryData } from '../common/types/ibef';

export type IndustryDocument = IBEFIndustryData & Document;

const industrySchema = new mongoose.Schema(
  {
    industryName: { type: String, required: true, index: true },
    industrySlug: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, unique: true },
    lastUpdated: { type: Date, default: Date.now },
    scrapedAt: { type: Date, default: Date.now, index: true },
    overview: {
      title: String,
      description: String,
      advantageIndia: {
        title: String,
        sections: [{ title: String, content: String }],
      },
    },
    introduction: { keyPoints: [String] },
    marketSize: { statistics: [{ value: String }] },
    investments: { majorInvestments: [String] },
    governmentInitiatives: { initiatives: [String] },
    roadAhead: { goals: [String] },
  },
  { timestamps: true, collection: 'ibefscraper' },
);

export const IndustryModel: Model<IndustryDocument> =
  mongoose.models.IBEFIndustry ||
  mongoose.model<IndustryDocument>('IBEFIndustry', industrySchema);
