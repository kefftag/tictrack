import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHomeScreen } from '../screens/ScanHomeScreen';
import { QuickMessageScreen } from '../screens/QuickMessageScreen';
import { ContactsListScreen } from '../screens/ContactsListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../utils/colors';

const Tab = createBottomTabNavigator();

const API_KEY_STORAGE_KEY = '@tictrack_api_key';

interface TabNavigatorProps {
  onStartScan: () => void;
  onGenerateMessage: (context: string) => Promise<string>;
  onSendMessage: (phoneNumber: string, message: string) => Promise<void>;
}

export const TabNavigator: React.FC<TabNavigatorProps> = ({
  onStartScan,
  onGenerateMessage,
  onSendMessage,
}) => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const savedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      setHasApiKey(!!savedKey);
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  const handleApiKeySaved = (apiKey: string) => {
    setHasApiKey(true);
  };

  const handleStartScanFromHome = () => {
    if (hasApiKey) {
      onStartScan();
    } else {
      // Will be handled by the ScanHomeScreen showing warning
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Scan"
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📸</Text>,
        }}
      >
        {() => <ScanHomeScreen onStartScan={handleStartScanFromHome} hasApiKey={hasApiKey} />}
      </Tab.Screen>

      <Tab.Screen
        name="Quick Message"
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>💬</Text>,
        }}
      >
        {() => (
          <QuickMessageScreen
            onGenerateMessage={onGenerateMessage}
            onSendMessage={onSendMessage}
            onBack={() => {}}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Contacts"
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>📋</Text>,
        }}
      >
        {() => <ContactsListScreen onBack={() => {}} />}
      </Tab.Screen>

      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size, color }}>⚙️</Text>,
        }}
      >
        {() => <SettingsScreen onApiKeySaved={handleApiKeySaved} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};
