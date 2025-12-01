import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootTabs from './RootTabs';
import DetailStationScreen from '../screens/DetailStationScreen';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator>
      {/* Màn hình chính chứa Bottom Tabs */}
      <Stack.Screen
        name="MainTabs"
        component={RootTabs}
        options={{ headerShown: false }}
      />

      {/* Màn hình chi tiết trạm */}
      <Stack.Screen
        name="DetailStation"
        component={DetailStationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}



