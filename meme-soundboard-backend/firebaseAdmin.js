const admin = require('firebase-admin');
// TODO: Replace with the actual path to your service account key file
// IMPORTANT: Do NOT commit your service account key to public repositories!
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin; 