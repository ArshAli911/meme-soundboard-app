const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  // Optional: add more options if you have a specific need, but do not set maxRetriesPerRequest to anything else
});

// Test the connection
connection.on('connect', () => {
  console.log('Connected to Redis successfully');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

connection.on('ready', () => {
  console.log('Redis is ready to accept commands');
});

connection.on('close', () => {
  console.log('Redis connection closed');
});

connection.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Create a queue for audio transcoding jobs
const audioTranscodeQueue = new Queue('audioTranscode', { connection });

// Worker to process jobs from the queue
const audioTranscodeWorker = new Worker(
  'audioTranscode',
  async job => {
    console.log(`Processing job ${job.id}: ${job.data.fileName}`);
    // Simulate a long-running audio transcoding task
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    console.log(`Job ${job.id} finished: ${job.data.fileName} transcoded successfully.`);
    // In a real scenario, you would perform the actual transcoding here
    // and potentially update a database with the new URL or status
  },
  { connection }
);

audioTranscodeWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed.`);
});

audioTranscodeWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

// Export the queue so other parts of the application can add jobs
module.exports = { audioTranscodeQueue }; 