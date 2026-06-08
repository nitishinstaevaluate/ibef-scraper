import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDb(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
