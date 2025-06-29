import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 AuthProvider: Starting auth state listener");
    logger.info("AuthProvider: Setting up auth state listener");
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("⚠️ AuthProvider: Timeout reached, setting isLoading to false");
      logger.warn("AuthProvider: Timeout reached, forcing isLoading to false");
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log("🔄 AuthProvider: Auth state changed", { 
        hasUser: !!firebaseUser, 
        email: firebaseUser?.email,
        uid: firebaseUser?.uid 
      });
      
      logger.info("AuthProvider: Auth state changed", { 
        hasUser: !!firebaseUser, 
        email: firebaseUser?.email 
      });
      
      clearTimeout(timeoutId); // Clear timeout since we got a response
      setUser(firebaseUser);
      setIsLoading(false);
      
      if (firebaseUser) {
        console.log("✅ User logged in:", firebaseUser.email);
        logger.info("User logged in:", firebaseUser.email);
      } else {
        console.log("❌ User logged out or not authenticated");
        logger.info("User logged out or not authenticated.");
      }
    }, (error) => {
      console.error("💥 AuthProvider: Auth state listener error:", error);
      logger.error("AuthProvider: Auth state listener error:", error);
      clearTimeout(timeoutId);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("🔐 Attempting login for:", email);
      logger.info("Attempting login for:", email);
      await auth.signInWithEmailAndPassword(email, password);
      console.log("✅ Successfully logged in user:", email);
      logger.info("Successfully logged in user:", email);
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      logger.error("Login failed:", error);
      throw error; // Re-throw to be handled by UI
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await auth.signOut();
      console.log("🚪 User logged out");
      logger.info("User logged out.");
    } catch (error: any) {
      console.error("❌ Logout failed:", error);
      logger.error("Logout failed:", error);
      throw error; // Re-throw to be handled by UI
    } finally {
      setIsLoading(false);
    }
  };

  console.log("🎨 AuthProvider: Rendering with state", { 
    isLoading, 
    hasUser: !!user, 
    userEmail: user?.email 
  });

  logger.info("AuthProvider: Rendering with state", { 
    isLoading, 
    hasUser: !!user, 
    userEmail: user?.email 
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
