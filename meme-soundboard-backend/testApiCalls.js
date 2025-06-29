const { admin } = require('./firebaseAdmin');
const logger = require('./logger');

const db = admin.firestore();

// Test functions
const testGetAllSounds = async () => {
  try {
    logger.info('Testing: Get all sounds');
    const snapshot = await db.collection('sounds').get();
    const sounds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`✅ Successfully retrieved ${sounds.length} sounds`);
    logger.info('Sample sounds:', sounds.slice(0, 3).map(s => ({ id: s.id, name: s.name, category: s.category })));
    return sounds;
  } catch (error) {
    logger.error('❌ Error getting all sounds:', error);
    throw error;
  }
};

const testGetSoundsByCategory = async (category) => {
  try {
    logger.info(`Testing: Get sounds by category "${category}"`);
    const snapshot = await db.collection('sounds')
      .where('category', '==', category)
      .get();
    
    const sounds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`✅ Found ${sounds.length} sounds in category "${category}"`);
    logger.info('Sounds:', sounds.map(s => ({ id: s.id, name: s.name })));
    return sounds;
  } catch (error) {
    logger.error(`❌ Error getting sounds by category "${category}":`, error);
    throw error;
  }
};

const testSearchSounds = async (searchTerm) => {
  try {
    logger.info(`Testing: Search sounds with term "${searchTerm}"`);
    const searchLower = searchTerm.toLowerCase();
    const snapshot = await db.collection('sounds')
      .where('name', '>=', searchLower)
      .where('name', '<=', searchLower + '\uf8ff')
      .get();
    
    const sounds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`✅ Found ${sounds.length} sounds matching "${searchTerm}"`);
    logger.info('Matching sounds:', sounds.map(s => ({ id: s.id, name: s.name })));
    return sounds;
  } catch (error) {
    logger.error(`❌ Error searching sounds with term "${searchTerm}":`, error);
    throw error;
  }
};

const testGetUserFavorites = async (userId) => {
  try {
    logger.info(`Testing: Get favorites for user "${userId}"`);
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('favorites')
      .get();
    
    const favoriteIds = snapshot.docs.map(doc => doc.id);
    logger.info(`✅ User "${userId}" has ${favoriteIds.length} favorites`);
    logger.info('Favorite IDs:', favoriteIds);
    
    // Get the actual sound data for favorites
    if (favoriteIds.length > 0) {
      const sounds = [];
      const chunkSize = 10; // Firestore 'in' query limit
      
      for (let i = 0; i < favoriteIds.length; i += chunkSize) {
        const chunk = favoriteIds.slice(i, i + chunkSize);
        const soundSnapshot = await db.collection('sounds')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        soundSnapshot.docs.forEach(doc => {
          sounds.push({ id: doc.id, ...doc.data() });
        });
      }
      
      logger.info('Favorite sounds:', sounds.map(s => ({ id: s.id, name: s.name, category: s.category })));
      return sounds;
    }
    
    return [];
  } catch (error) {
    logger.error(`❌ Error getting favorites for user "${userId}":`, error);
    throw error;
  }
};

const testGetSoundsByIds = async (soundIds) => {
  try {
    logger.info(`Testing: Get sounds by IDs (${soundIds.length} IDs)`);
    
    if (soundIds.length === 0) {
      logger.info('✅ No sound IDs provided, returning empty array');
      return [];
    }
    
    const sounds = [];
    const chunkSize = 10; // Firestore 'in' query limit
    
    for (let i = 0; i < soundIds.length; i += chunkSize) {
      const chunk = soundIds.slice(i, i + chunkSize);
      const snapshot = await db.collection('sounds')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();
      
      snapshot.docs.forEach(doc => {
        sounds.push({ id: doc.id, ...doc.data() });
      });
    }
    
    logger.info(`✅ Successfully retrieved ${sounds.length} sounds by IDs`);
    logger.info('Retrieved sounds:', sounds.map(s => ({ id: s.id, name: s.name, category: s.category })));
    return sounds;
  } catch (error) {
    logger.error('❌ Error getting sounds by IDs:', error);
    throw error;
  }
};

const testGetCategories = async () => {
  try {
    logger.info('Testing: Get all unique categories');
    const snapshot = await db.collection('sounds').get();
    const categories = [...new Set(snapshot.docs.map(doc => doc.data().category))];
    
    logger.info(`✅ Found ${categories.length} unique categories`);
    logger.info('Categories:', categories);
    return categories;
  } catch (error) {
    logger.error('❌ Error getting categories:', error);
    throw error;
  }
};

const testGetRecentSounds = async (limit = 5) => {
  try {
    logger.info(`Testing: Get ${limit} most recent sounds`);
    const snapshot = await db.collection('sounds')
      .orderBy('uploadDate', 'desc')
      .limit(limit)
      .get();
    
    const sounds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`✅ Retrieved ${sounds.length} most recent sounds`);
    logger.info('Recent sounds:', sounds.map(s => ({ 
      id: s.id, 
      name: s.name, 
      category: s.category,
      uploadDate: s.uploadDate?.toDate?.() || s.uploadDate
    })));
    return sounds;
  } catch (error) {
    logger.error('❌ Error getting recent sounds:', error);
    throw error;
  }
};

// Main test function
const runAllTests = async () => {
  try {
    logger.info('🚀 Starting API call tests...');
    
    // Test 1: Get all sounds
    const allSounds = await testGetAllSounds();
    
    // Test 2: Get sounds by category
    await testGetSoundsByCategory('Memes');
    await testGetSoundsByCategory('Animals');
    
    // Test 3: Search sounds
    await testSearchSounds('sad');
    await testSearchSounds('dramatic');
    
    // Test 4: Get user favorites
    const userFavorites = await testGetUserFavorites('sample_user_1');
    
    // Test 5: Get sounds by IDs (using some favorite IDs)
    if (userFavorites.length > 0) {
      const favoriteIds = userFavorites.map(s => s.id);
      await testGetSoundsByIds(favoriteIds);
    }
    
    // Test 6: Get all categories
    await testGetCategories();
    
    // Test 7: Get recent sounds
    await testGetRecentSounds(3);
    
    logger.info('🎉 All API tests completed successfully!');
    
  } catch (error) {
    logger.error('💥 Some tests failed:', error);
  }
};

// Run the tests
runAllTests()
  .then(() => {
    logger.info('✅ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Test suite failed:', error);
    process.exit(1);
  }); 