## Align – Smart Reminders & Daily Goals

Align is a React Native + Expo app that helps you stay on track with smart reminders and lightweight daily goals. You can type natural language like “Call mom tomorrow at 2pm” and the app structures it into a reminder, schedules a notification, and stores it locally.

Android is the primary target platform for development and testing.

### Why Align

- Zero-friction reminder creation: type what you mean, the app figures out the rest.
- Local, reliable delivery: reminders are stored locally and delivered as native notifications.
- Practical defaults: intelligent scheduling and a clean UI designed for everyday use.

## Screenshots

The repository contains screenshots in the `images/` folder. Below each filename is listed as the caption to make it easy to identify and select images for release.

- `images/home.png`

![images/home.png](images/home.png)

- `images/chat_based_reminder.png`

![images/chat_based_reminder.png](images/chat_based_reminder.png)

- `images/chat_based_reminder_populated.png`

![images/chat_based_reminder_populated.png](images/chat_based_reminder_populated.png)

- `images/edit_reminders.png`

![images/edit_reminders.png](images/edit_reminders.png)

- `images/home_inactive_reminders.png`

![images/home_inactive_reminders.png](images/home_inactive_reminders.png)

- `images/search_reminders.png`

![images/search_reminders.png](images/search_reminders.png)


## Features

- Natural-language reminder parsing powered by Google Generative AI (Gemini)
- Fallback parser for common date/time phrases when AI is unavailable
- Local persistence via SQLite (expo-sqlite)
- Push notifications with scheduling (expo-notifications)
- Daily repeating reminders support (reschedules to the next day at the same time)
- NativeWind (Tailwind CSS for RN) for styling
- TypeScript across the app with strict settings

### Engineering highlights

- Strongly typed service boundaries (AI, notifications, persistence)
- Repository pattern for SQLite access (no queries in components)
- Deterministic scheduling helpers and daily repeat semantics
- Testable, modular design with Jest and `jest-expo`
- NativeWind for consistent, maintainable styling

## Tech Stack

- Expo ~53 (React Native 0.79, React 19)
- TypeScript ~5.8
- NativeWind + TailwindCSS
- expo-notifications, expo-sqlite
- @google/generative-ai SDK

## Architecture Overview

- UI (components/)
	- `ScreenContent`, `RemindersPage` compose the experience using functional components and hooks
- Services (services/)
	- `geminiService.ts` – Natural-language parsing with Gemini + resilient fallback
	- `notificationService.ts` – Encapsulates permissioning, scheduling, rescheduling, and cancellation
	- `reminderRepository.ts` – SQLite CRUD via a simple repository layer
- Types (types/)
	- Shared domain types (e.g., `Reminder`)

Flow (high level):
1) User enters natural language → Gemini parses JSON (or fallback parser extracts time/date)
2) Parsed data → `createScheduledDate` determines a concrete Date
3) Reminder persisted via repository → Notification scheduled via service
4) Foreground/background interactions reconcile state and avoid duplicate notifications

## Getting Started

### 1) Prerequisites

- Node.js LTS and npm
- Android Studio (emulator) or a physical Android device
- Expo CLI (installed automatically by npx commands)

### 2) Install dependencies

```cmd
npm install
```

### 3) Set your Gemini API key

The app reads the key from the environment variable `EXPO_PUBLIC_GEMINI_API_KEY`.

On Windows Command Prompt (cmd.exe):

```cmd
set EXPO_PUBLIC_GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Tip: See `GEMINI_SETUP.md` for details on obtaining a key.

### 4) Start the app (use tunnel)

Different Wi-Fi/LAN names can cause connectivity issues; use the tunnel and clear cache on first run:

```cmd
npx expo start -c --tunnel
```

Then, from the Expo Dev Tools, launch on Android (recommended). You can also press `a` in the terminal to open the Android emulator if available.

Notes:
- The `-c` flag clears the Metro cache and often resolves odd bundling issues.
- Android is first-class; iOS may work but isn’t the focus.

## Scripts

Useful npm scripts defined in `package.json`:

- `npm start` – Start Expo bundler
- `npm run android` – Build and run a native Android project (dev build)
- `npm run web` – Run in a web browser (limited feature parity)
- `npm run lint` – Lint and check formatting
- `npm run format` – Fix lint issues and format code
- `npm test` – Run unit tests
- `npm run test:watch` – Run tests in watch mode
- `npm run test:coverage` – Run tests with coverage

## Core Flows

### Create a reminder via chat (AI)
1) Type: “Dentist appointment on 2025-10-02 at 4pm”
2) `geminiService.parseReminderText` returns structured data (title, date, time, repeat)
3) The app computes a scheduled Date, stores the reminder, and schedules a notification

### Create a manual reminder
1) Open the create modal, pick date/time
2) Persist via repository and schedule a one-off or daily notification

### Daily reminders
- For repeat=daily, the service schedules the next occurrence and relies on rescheduling after each fire to avoid platform quirks

## Testing

The project uses Jest with `jest-expo` preset. Tests live under `tests/`.

Run the full suite:

```cmd
npm test
```

Watch mode:

```cmd
npm run test:watch
```

Coverage:

```cmd
npm run test:coverage
```

Targets include:
- Unit tests for services (`geminiService`, `notificationService`, `reminderRepository`)
- Integration-style tests for flows
- Coverage thresholds enforced at 70%+ for branches/functions/lines/statements

## Notifications

We use `expo-notifications` for local and scheduled notifications.

- On Android, a channel named `reminders` is configured for high-priority alerts.
- For one-off reminders, we schedule a date trigger.
- For daily reminders, we schedule the next occurrence and rely on rescheduling after it fires.

See `NOTIFICATIONS.md` for additional details and best practices.

## Data & Persistence

Reminders are stored locally using `expo-sqlite` with a simple repository layer in `services/reminderRepository.ts`.

Reminder fields include:

- id, title, description
- scheduledTime (ms since epoch)
- isActive, notificationId
- createdAt, updatedAt
- repeat: 'none' | 'daily'

All DB access is centralized in the repository; UI components don’t query SQLite directly.

### Data model

`Reminder` fields (selected):
- `id: string`
- `title: string`
- `description?: string`
- `scheduledTime: Date`
- `isActive: boolean`
- `notificationId?: string`
- `repeat: 'none' | 'daily'`

Indexes and schema are minimal by design; migrations can be added as the model evolves.

## AI Parsing

`services/geminiService.ts` converts natural-language into structured reminder data. When the AI is unavailable or returns unparseable content, the app falls back to a regex-based parser that captures common dates/times and simple recurrence phrases.

Environment variable required:
- `EXPO_PUBLIC_GEMINI_API_KEY` – Your Gemini API key.

For setup notes, refer to `GEMINI_SETUP.md`.

### Fallback behavior

If AI fails or is unreachable, a regex-based parser extracts common time/date patterns and simple “daily” phrases. The UI allows review and manual correction before persistence.

## Styling

We use NativeWind (Tailwind CSS for React Native). Prefer className-based styling in components:

```tsx
<Text className="text-xl font-semibold">Hello</Text>
```

Avoid separate StyleSheet files unless truly necessary.

## Project Structure (high level)

- `App.tsx` – Entry point
- `components/` – UI components (e.g., `ScreenContent`, `RemindersPage`)
- `services/` – App services (`geminiService`, `notificationService`, `reminderRepository`)
- `types/` – Shared TypeScript types (e.g., `reminder.ts`)
- `tests/` – Jest tests and setup
- `android/` – Native Android project (generated/managed by Expo tooling)
- Config: `tailwind.config.js`, `eslint.config.js`, `tsconfig.json`, `metro.config.js`

## Security & Privacy

- Gemini API key is read from `EXPO_PUBLIC_GEMINI_API_KEY`; do not commit secrets
- Reminders are stored locally on device via SQLite
- No remote sync is implemented by default (can be added via an API layer)

## Troubleshooting

- Use the tunnel if your device/emulator can’t reach the local dev server:
	```cmd
	npx expo start -c --tunnel
	```
- If builds act flaky, clear cache (`-c`) and restart.
- Ensure the Android emulator has internet access and Google Play services when testing notifications.
- If the AI parsing fails, the fallback parser should still allow manual scheduling.


---

Happy building! If you have ideas or issues, open an issue or PR with clear steps and context.