const { admin } = require('./firebaseAdmin');
const logger = require('./logger');

const createTestUser = async () => {
  try {
    logger.info('Creating test user...');
    
    const testUser = {
      email: 'test@example.com',
      password: 'testpassword123',
      displayName: 'Test User'
    };

    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(testUser.email);
      logger.info(`User ${testUser.email} already exists with UID: ${existingUser.uid}`);
      return existingUser;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        const userRecord = await admin.auth().createUser({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName,
          emailVerified: true
        });
        
        logger.info(`Successfully created test user: ${userRecord.email} with UID: ${userRecord.uid}`);
        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Error creating test user:', error);
    throw error;
  }
};

// Run the function
createTestUser()
  .then((user) => {
    logger.info('Test user setup completed successfully!');
    logger.info('Login credentials:');
    logger.info(`Email: ${user.email}`);
    logger.info('Password: testpassword123');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to create test user:', error);
    process.exit(1);
  }); 