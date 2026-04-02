import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = process.env.REDIS_URL 
  ? createClient({ url: process.env.REDIS_URL }) 
  : null;

if (redisClient) {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.connect().catch(console.error);
}

export default redisClient;
