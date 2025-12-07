import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import NewsScreen from '../screens/NewsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import MapScreen from '../screens/MapScreen';
import AnalyticExposureScreen from '../screens/AnalyticExposureScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function SimpleTabLabel({ label, focused }) {
  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: focused ? '700' : '500',
          color: focused ? '#2563eb' : '#6b7280',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 65,
          paddingBottom: 14,
          paddingTop: 8,
          bottom: 10,
        },
      }}
      initialRouteName="Map"
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Dự báo',
          tabBarIcon: ({ focused, color, size }) => (
            <Feather
              name="map"
              size={20}
              color={focused ? '#2563eb' : '#9ca3af'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <SimpleTabLabel label="Dự báo" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticExposureScreen}
        options={{
          title: 'Phơi nhiễm',
          tabBarIcon: ({ focused, color, size }) => (
            <Feather
              name="activity"
              size={20}
              color={focused ? '#2563eb' : '#9ca3af'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <SimpleTabLabel label="Phơi nhiễm" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          title: 'Tin tức',
          tabBarIcon: ({ focused, color, size }) => (
            <Feather
              name="book-open"
              size={20}
              color={focused ? '#2563eb' : '#9ca3af'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <SimpleTabLabel label="Tin tức" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ focused, color, size }) => (
            <Feather
              name="message-circle"
              size={20}
              color={focused ? '#2563eb' : '#9ca3af'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <SimpleTabLabel label="AI Chat" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Feather
              name="user"
              size={20}
              color={focused ? '#2563eb' : '#9ca3af'}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <SimpleTabLabel label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


