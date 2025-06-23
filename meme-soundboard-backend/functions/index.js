const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
// This is often done in your main firebaseAdmin.js, but included here for standalone function deployment
try {
  admin.initializeApp();
} catch (e) {
  // Firebase app already initialized
}

/**
 * Simple HTTP-triggered function example.
 * Responds with a greeting message.
 */
exports.helloWorld = functions.https.onRequest((req, res) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  res.send("Hello from Firebase Functions!");
});

/**
 * Example of an authenticated HTTP-triggered function.
 * Requires a Firebase ID token in the Authorization header.
 * Usage: Call with Bearer <ID_TOKEN> in Authorization header.
 */
exports.protectedFunction = functions.https.onRequest(async (req, res) => {
  // Check for Authorization header
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    functions.logger.error('No Firebase ID token was passed as a Bearer token in the Authorization header.');
    res.status(403).send('Unauthorized');
    return;
  }

  const idToken = req.headers.authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach user data

    functions.logger.info('Protected function accessed by user:', decodedToken.uid);
    res.status(200).json({ message: `Welcome, ${decodedToken.email}! You accessed protected data.` });
  } catch (error) {
    functions.logger.error('Error verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  }
}); 