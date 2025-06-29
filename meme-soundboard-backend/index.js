const express = require('express');
const cors = require('cors');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer'); // Import multer
const { Storage } = require('@google-cloud/storage'); // Import Google Cloud Storage
const { audioTranscodeQueue } = require('./queue'); // Import the queue
const logger = require('./logger'); // Import the logger
const { admin, serviceAccount } = require('./firebaseAdmin'); // Import firebase-admin and serviceAccount

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

// Configure Multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Storage with the admin SDK
const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});
const bucket = storage.bucket(`${serviceAccount.project_id}.appspot.com`); // Default bucket name

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

// Protected endpoint to upload a sound
app.post('/api/sounds/upload', authenticateToken, upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      // logger.warn('[/api/sounds/upload] No file uploaded');
      // return res.status(400).json({ error: 'No audio file provided.' });
    }

    const { name, category, imageUrl } = req.body;

    if (!name || !category) {
      logger.warn('[/api/sounds/upload] Missing name or category in request body');
      return res.status(400).json({ error: 'Sound name and category are required.' });
    }

    // Create a new blob in the bucket and upload the file data
    const uniqueFileName = `${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(`sounds/${uniqueFileName}`);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false, // For smaller files, resumable uploads might not be necessary
    });

    stream.on('error', (err) => {
      logger.error('Error uploading to Firebase Storage:', err);
      return res.status(500).json({ error: 'Failed to upload audio file.' });
    });

    stream.on('finish', async () => {
      // Make the file public (optional, depends on your bucket's security rules)
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      const firestore = admin.firestore();
      const newSoundRef = firestore.collection('sounds').doc();

      const newSound = {
        id: newSoundRef.id,
        name,
        category,
        url: publicUrl,
        imageUrl: imageUrl || null,
        uploadedBy: req.user.uid, // Assuming req.user.uid is available from authentication
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      await newSoundRef.set(newSound);

      logger.info(`[/api/sounds/upload] Sound uploaded and metadata saved: ${newSound.name} (${newSound.id})`);
      res.status(201).json({ message: 'Sound uploaded successfully', sound: newSound });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    logger.error('Error handling sound upload:', error);
    res.status(500).json({ error: 'Failed to upload sound.' });
  }
});

// Public endpoint to get all sounds
app.get('/api/sounds', async (req, res) => {
  try {
    const firestore = admin.firestore();
    const snapshot = await firestore.collection('sounds').get();
    const sounds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    logger.info('[/api/sounds] Fetched all sounds from Firestore');
    res.json(sounds);
  } catch (error) {
    logger.error('Error fetching sounds from Firestore:', error);
    res.status(500).json({ error: 'Failed to fetch sounds.' });
  }
});

// Protected endpoint for search (example)
app.get('/api/sounds/search', authenticateToken, async (req, res) => {
  const query = req.query.q ? req.query.q.toString().toLowerCase() : '';
  logger.info(`[/api/sounds/search] Search query: ${query}, by user: ${req.user.uid}`);

  try {
    const firestore = admin.firestore();
    // This is a basic search. For more advanced full-text search, consider dedicated solutions.
    const snapshot = await firestore.collection('sounds')
                                     .where('name', '>=', query)
                                     .where('name', '<=', query + '\uf8ff')
                                     .get();
    const filteredSounds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(filteredSounds);
  } catch (error) {
    logger.error('Error during sound search:', error);
    res.status(500).json({ error: 'Failed to perform search.' });
  }
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
}); 