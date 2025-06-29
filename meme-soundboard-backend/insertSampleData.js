const { admin } = require('./firebaseAdmin');
const logger = require('./logger');

const db = admin.firestore();

const sampleSounds = [
  {
    name: "Sad Violin",
    category: "Memes",
    tags: ["sad", "violin", "classic", "meme"],
    fileName: "sad_violin.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_1",
    downloadUrl: "https://example.com/sounds/sad_violin.mp3"
  },
  {
    name: "Wilhelm Scream",
    category: "Movies & TV",
    tags: ["scream", "classic", "movie", "sound effect"],
    fileName: "wilhelm_scream.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_1",
    downloadUrl: "https://example.com/sounds/wilhelm_scream.mp3"
  },
  {
    name: "Dramatic Chipmunk",
    category: "Animals",
    tags: ["chipmunk", "dramatic", "funny", "animal"],
    fileName: "dramatic_chipmunk.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_1",
    downloadUrl: "https://example.com/sounds/dramatic_chipmunk.mp3"
  },
  {
    name: "Epic Sax Guy",
    category: "Music",
    tags: ["saxophone", "epic", "meme", "music"],
    fileName: "epic_sax_guy.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_2",
    downloadUrl: "https://example.com/sounds/epic_sax_guy.mp3"
  },
  {
    name: "MLG Airhorn",
    category: "Gaming",
    tags: ["airhorn", "mlg", "gaming", "meme"],
    fileName: "mlg_airhorn.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_2",
    downloadUrl: "https://example.com/sounds/mlg_airhorn.mp3"
  },
  {
    name: "Cricket Chirps",
    category: "Animals",
    tags: ["cricket", "silence", "awkward", "animal"],
    fileName: "cricket_chirps.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_1",
    downloadUrl: "https://example.com/sounds/cricket_chirps.mp3"
  },
  {
    name: "Dramatic Reverb",
    category: "Reactions",
    tags: ["dramatic", "reverb", "reaction", "funny"],
    fileName: "dramatic_reverb.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_3",
    downloadUrl: "https://example.com/sounds/dramatic_reverb.mp3"
  },
  {
    name: "Bass Boost",
    category: "Music",
    tags: ["bass", "boost", "music", "meme"],
    fileName: "bass_boost.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_3",
    downloadUrl: "https://example.com/sounds/bass_boost.mp3"
  },
  {
    name: "Windows Error",
    category: "Misc",
    tags: ["windows", "error", "system", "classic"],
    fileName: "windows_error.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_1",
    downloadUrl: "https://example.com/sounds/windows_error.mp3"
  },
  {
    name: "Laugh Track",
    category: "Funny",
    tags: ["laugh", "track", "funny", "sitcom"],
    fileName: "laugh_track.mp3",
    contentType: "audio/mpeg",
    userId: "sample_user_2",
    downloadUrl: "https://example.com/sounds/laugh_track.mp3"
  }
];

const insertSampleData = async () => {
  try {
    logger.info('Starting to insert sample sound data...');
    
    const batch = db.batch();
    let insertedCount = 0;

    for (const soundData of sampleSounds) {
      const soundRef = db.collection('sounds').doc();
      
      const soundDoc = {
        ...soundData,
        uploadDate: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(soundRef, soundDoc);
      insertedCount++;
    }

    await batch.commit();
    
    logger.info(`Successfully inserted ${insertedCount} sample sounds into the database!`);
    
    // Also create some sample user favorites
    await createSampleFavorites();
    
  } catch (error) {
    logger.error('Error inserting sample data:', error);
    throw error;
  }
};

const createSampleFavorites = async () => {
  try {
    logger.info('Creating sample user favorites...');
    
    // Get the first few sounds we just inserted
    const soundsSnapshot = await db.collection('sounds')
      .orderBy('uploadDate', 'desc')
      .limit(5)
      .get();
    
    const soundIds = soundsSnapshot.docs.map(doc => doc.id);
    
    // Create favorites for a sample user
    const sampleUserId = 'sample_user_1';
    const batch = db.batch();
    
    for (const soundId of soundIds.slice(0, 3)) { // Favorite first 3 sounds
      const favoriteRef = db.collection('users').doc(sampleUserId)
        .collection('favorites').doc(soundId);
      
      batch.set(favoriteRef, {
        favoritedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    logger.info(`Created ${soundIds.slice(0, 3).length} sample favorites for user ${sampleUserId}`);
    
  } catch (error) {
    logger.error('Error creating sample favorites:', error);
  }
};

// Execute the function
insertSampleData()
  .then(() => {
    logger.info('Sample data insertion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to insert sample data:', error);
    process.exit(1);
  }); 