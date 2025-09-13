# Expo Notifications Setup

## Current Status (Development with Expo Go)

The app is configured to work with Expo Go for development, with warnings suppressed. Local notifications will work in a development build or production app.

## For Production: Creating a Development Build

When you're ready to test full notification functionality, you'll need to create a development build:

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Configure EAS
```bash
eas login
eas build:configure
```

### 3. Build for Android (recommended)
```bash
# For Android APK
eas build --platform android --profile development

# For Android AAB (if publishing to Play Store)
eas build --platform android --profile production
```

### 4. Install the development build
- Download the APK from the EAS build page
- Install it on your Android device
- Run `npx expo start --dev-client` instead of the tunnel command

## What Works in Each Environment

### Expo Go (Current)
- ✅ App functionality
- ✅ UI components
- ❌ Push notifications (suppressed warnings)
- ❌ Remote notifications

### Development Build
- ✅ App functionality
- ✅ UI components
- ✅ Local push notifications
- ✅ Remote notifications (with proper setup)

## Notes
- The current notification service gracefully handles Expo Go limitations
- All error messages are suppressed to avoid confusion during development
- The app will return mock notification IDs in Expo Go to keep functionality working