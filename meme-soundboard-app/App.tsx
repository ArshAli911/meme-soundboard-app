import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { logger } from './src/utils/logger';

export default function App() {
  useEffect(() => {
    logger.info('App component initialized');
    console.log('🚀 App component initialized');
    
    // Test Firebase connection
    const testFirebase = async () => {
      try {
        const { auth } = await import('./src/config/firebase');
        console.log('✅ Firebase auth imported successfully');
        
        // Test auth state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
          console.log('✅ Firebase auth state listener working', { hasUser: !!user });
          unsubscribe();
        }, (error) => {
          console.error('❌ Firebase auth state listener error:', error);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          console.log('⏰ Firebase test timeout - this is normal if no user is logged in');
        }, 5000);
        
      } catch (error) {
        console.error('❌ Firebase import failed:', error);
      }
    };
    
    testFirebase();
  }, []);
  
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
} 