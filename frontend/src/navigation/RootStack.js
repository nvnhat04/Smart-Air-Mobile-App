import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailStationScreen from '../screens/DetailStationScreen';
import IntroScreen from '../screens/IntroScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RootTabs from './RootTabs';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator>
      {/* Intro screen - first time users */}
      <Stack.Screen
        name="Intro"
        component={IntroScreen}
        options={{ headerShown: false }}
      />
      {/* Auth screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
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



