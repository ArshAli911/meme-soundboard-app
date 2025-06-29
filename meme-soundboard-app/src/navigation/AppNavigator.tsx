import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen/FavoritesScreen';
import PlayerScreen from '../screens/PlayerScreen/PlayerScreen';
import UploadScreen from '../screens/UploadScreen/UploadScreen';
import LoginScreen from '../screens/LoginScreen/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { Sound } from '../models/Sound';
import { trackEvent } from '../utils/analytics';

export type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  Player: { sound: Sound };
  Upload: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = React.useRef<string | undefined>(undefined);

  console.log("🧭 AppNavigator: Current state", { 
    isLoading, 
    hasUser: !!user, 
    userEmail: user?.email 
  });

  if (isLoading) {
    console.log("⏳ AppNavigator: Showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>
          Loading...
        </Text>
        <Text style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  console.log("🎯 AppNavigator: Loading complete, user state:", { 
    hasUser: !!user, 
    userEmail: user?.email 
  });

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;

        if (currentRouteName && previousRouteName !== currentRouteName) {
          trackEvent('screen_view', { screen_name: currentRouteName });
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Player" component={PlayerScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
