import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LiveScreen } from '../screens/LiveScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TranscriptDetailScreen } from '../screens/TranscriptDetailScreen';
import { WhatsAppConnectScreen } from '../screens/WhatsAppConnectScreen';
import { GlassTabBar } from '../components/GlassTabBar';
import { MainTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Archive" component={ArchiveScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="TranscriptDetail"
        component={TranscriptDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WhatsAppConnect"
        component={WhatsAppConnectScreen}
        options={{
          animation: Platform.OS === 'web' ? 'default' : 'slide_from_bottom',
          presentation: Platform.OS === 'web' ? 'card' : 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
