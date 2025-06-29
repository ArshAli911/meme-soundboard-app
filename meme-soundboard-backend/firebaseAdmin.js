const admin = require('firebase-admin');
// IMPORTANT: Do NOT commit your service account key to public repositories!
const serviceAccount = require('../meme-app-eabc1-firebase-adminsdk-fbsvc-5e9420564d.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'meme-app-eabc1',
  storageBucket: 'meme-app-eabc1.appspot.com'
});

module.exports = { admin, serviceAccount }; 