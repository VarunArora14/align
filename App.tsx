import { ScreenContent } from 'components/ScreenContent';
import { RemindersPage } from 'components/RemindersPage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <ScreenContent title="Align - Goal Reminders" path="App.tsx">
        <RemindersPage />
      </ScreenContent>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
