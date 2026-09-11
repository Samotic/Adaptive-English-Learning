import mongoose from 'mongoose';

export async function connectMongo(uri, dbName = process.env.MONGODB_DB || 'english') {
  if (!uri) throw new Error('MONGODB_URI not provided');
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
  return mongoose;
}

export function disconnectMongo() {
  return mongoose.disconnect();
}
