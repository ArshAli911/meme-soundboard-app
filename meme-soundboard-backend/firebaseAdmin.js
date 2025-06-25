const admin = require('firebase-admin');
// TODO: Replace with the actual path to your service account key file
// IMPORTANT: Do NOT commit your service account key to public repositories!
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // ...other config
});

module.exports = admin; 