const express = require('express');
const cors = require('cors');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { audioTranscodeQueue } = require('./queue'); // Import the queue
const logger = require('./logger'); // Import the logger
const admin = require('./firebaseAdmin'); // Import firebase-admin

// Assuming you would fetch this from an environment variable or a config file
const SENTRY_DSN_BACKEND = 'https://examplePublicKey@o0.ingest.sentry.io/1';

Sentry.init({
  dsn: SENTRY_DSN_BACKEND,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app: express() }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Apply Helmet for security headers
app.use(helmet());

// Apply rate limiting to all requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  statusCode: 429, // Too Many Requests
});
app.use(apiLimiter);

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.use(express.json());

// Endpoint to register Expo Push Tokens
app.post('/api/register-push-token', authenticateToken, async (req, res) => {
  const { expoPushToken } = req.body;
  const userId = req.user.uid;

  if (!expoPushToken) {
    logger.warn('[/api/register-push-token] Missing expoPushToken in request body');
    return res.status(400).json({ error: 'expoPushToken is required' });
  }

  try {
    const firestore = admin.firestore();
    await firestore.collection('pushTokens').doc(userId).set({
      token: expoPushToken,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`[/api/register-push-token] Push token registered for user: ${userId}`);
    res.status(200).json({ message: 'Push token registered successfully' });
  } catch (error) {
    logger.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// Placeholder for your CDN base URL
const CDN_BASE_URL = 'https://your-cdn-domain.com/sounds/';

const MOCK_SOUNDS = [
  { id: '1', name: 'Funny Laugh', category: 'Funny', url: `${CDN_BASE_URL}augh-sound-effect.mp3` },
  { id: '2', name: 'Sad Trombone', category: 'Instruments', url: `${CDN_BASE_URL}sad-trombone.mp3` },
  { id: '3', name: 'Womp Womp', category: 'Funny', url: `${CDN_BASE_URL}womp-womp.mp3` },
  { id: '4', name: 'Air Horn', category: 'Memes', url: `${CDN_BASE_URL}air-horn.mp3` },
  { id: '5', name: 'Record Scratch', category: 'Sound Effects', url: `${CDN_BASE_URL}record-scratch.mp3` },
  { id: '6', name: 'Nope', category: 'Funny', url: `${CDN_BASE_URL}nope.mp3` },
];

// Middleware to verify Firebase ID tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing from Authorization header' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach user data to request
    next();
  } catch (error) {
    logger.error('Error verifying Firebase ID token:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Public endpoint to get all sounds
app.get('/api/sounds', (req, res) => {
  logger.info('[/api/sounds] Fetched all sounds');
  res.json(MOCK_SOUNDS);
});

// Protected endpoint for search (example)
app.get('/api/sounds/search', authenticateToken, (req, res) => {
  const query = req.query.q ? req.query.q.toString().toLowerCase() : '';
  logger.info(`[/api/sounds/search] Search query: ${query}, by user: ${req.user.uid}`);

  const filteredSounds = MOCK_SOUNDS.filter(sound =>
    sound.name.toLowerCase().includes(query) ||
    sound.category.toLowerCase().includes(query)
  );
  res.json(filteredSounds);
});

// Protected endpoint to enqueue an audio transcoding job (example)
app.post('/api/transcode-audio', authenticateToken, async (req, res) => {
  const { fileName, originalUrl } = req.body;

  if (!fileName || !originalUrl) {
    logger.warn('[/api/transcode-audio] Missing fileName or originalUrl in request body');
    return res.status(400).json({ error: 'fileName and originalUrl are required' });
  }

  try {
    const job = await audioTranscodeQueue.add(
      'transcode', // Job name
      { fileName, originalUrl, userId: req.user.uid }, // Add userId to job data
      { removeOnComplete: true, removeOnFail: false }
    );
    logger.info(`Job ${job.id} added to queue: ${fileName} by user: ${req.user.uid}`);
    res.status(202).json({ message: 'Audio transcoding job enqueued', jobId: job.id });
  } catch (error) {
    logger.error('Error enqueuing job:', error);
    res.status(500).json({ error: 'Failed to enqueue job' });
  }
});

// Example of a truly protected endpoint
app.get('/api/protected-data', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, authenticated user ${req.user.email}! This is protected data.` });
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned to the client for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  // Example of capturing a test error in the backend
  try {
    throw new Error("This is a test error from the backend!");
  } catch (error) {
    Sentry.captureException(error);
    logger.error('Caught test error:', error);
  }
}); 