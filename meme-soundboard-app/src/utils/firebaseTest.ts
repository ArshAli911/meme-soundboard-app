import { auth } from '../config/firebase';
import { logger } from './logger';

export const testFirebaseConnection = async () => {
  try {
    console.log("🔧 Testing Firebase connection...");
    logger.info("Testing Firebase connection...");
    
    // Test if auth is properly initialized
    if (!auth) {
      console.error("❌ Firebase auth is not initialized");
      return false;
    }
    
    console.log("✅ Firebase auth is initialized");
    
    // Test auth state listener
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log("✅ Firebase auth state listener working", { hasUser: !!user });
        unsubscribe();
        resolve(true);
      }, (error) => {
        console.error("❌ Firebase auth state listener error:", error);
        resolve(false);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.error("❌ Firebase auth state listener timeout");
        unsubscribe();
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    return false;
  }
}; 