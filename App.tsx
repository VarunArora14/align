import { ScreenContent } from 'components/ScreenContent';
import { RemindersPage } from 'components/RemindersPage';
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
  return (
    <>
      <ScreenContent title="Align - Goal Reminders" path="App.tsx">
        <RemindersPage />
      </ScreenContent>
      <StatusBar style="auto" />
    </>
  );
}
