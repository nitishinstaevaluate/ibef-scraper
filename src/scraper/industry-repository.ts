import { IBEFIndustryData } from '../common/types/ibef';
import { IndustryDocument, IndustryModel } from '../db/industry.model';

export async function saveIndustryData(data: IBEFIndustryData): Promise<IndustryDocument> {
  return IndustryModel.findOneAndUpdate(
    { industrySlug: data.industrySlug },
    {
      ...data,
      lastUpdated: new Date(),
      scrapedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );
}
