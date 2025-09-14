import { ScreenContent } from 'components/ScreenContent';
import { RemindersPage } from 'components/RemindersPage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <ScreenContent title="Align" path="App.tsx">
          <RemindersPage />
        </ScreenContent>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}