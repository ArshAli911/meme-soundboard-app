const admin = require('./firebaseAdmin');
const logger = require('./logger');

// TODO: Replace with your Google Cloud Storage bucket name
const BUCKET_NAME = 'your-firestore-backup-bucket';

const performFirestoreBackup = async () => {
  try {
    const firestore = admin.firestore();
    const bucket = admin.storage().bucket(BUCKET_NAME);

    const collections = await firestore.listCollections();
    const collectionIds = collections.map(col => col.id);

    // Construct the output URI for the backup
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const outputUri = `gs://${BUCKET_NAME}/firestore-backups/${timestamp}`;

    logger.info(`Starting Firestore export to ${outputUri}...`);

    await firestore.exportDocuments({
      collectionIds: collectionIds,
      outputUri: outputUri,
    });

    logger.info('Firestore backup completed successfully!');
  } catch (error) {
    logger.error('Error during Firestore backup:', error);
  }
};

// Execute the backup function
performFirestoreBackup(); 