import { createClient } from 'redis';
import { envVars } from './env';

const redisClient = createClient({
  username: envVars.REDIS_USERNAME,
  password: envVars.REDIS_PASSWORD,
  socket: {
    host: envVars.REDIS_HOST,
    port:   Number(envVars.REDIS_PORT),
  },
});

redisClient.on('error', err => console.log('Redis Client Error', err));


const connectRedis = async () => { 
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
}

export { connectRedis, redisClient };

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result); // >>> bar
