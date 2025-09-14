# Test Runner Instructions

## Running Tests

To run the tests for the Align app services, follow these steps:

### 1. Install Dependencies

First, install the required testing dependencies:

```bash
npm install --save-dev @types/jest jest jest-expo @testing-library/react-native @testing-library/jest-native
```

### 2. Run Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### 3. Test Structure

The tests are organized as follows:

- `tests/setup.ts` - Test configuration and mocks
- `tests/reminderRepository.test.ts` - Unit tests for database operations
- `tests/notificationService.test.ts` - Unit tests for notification functionality  
- `tests/geminiService.test.ts` - Unit tests for AI parsing service
- `tests/integration.test.ts` - Integration tests for service interactions

### 4. Test Coverage

The tests cover:

#### ReminderRepository Service
- Database initialization and schema creation
- CRUD operations (Create, Read, Update, Delete)
- Data transformation between database and application models
- Error handling for database failures
- Notification ID updates

#### NotificationService 
- Notification scheduling for one-time and daily reminders
- Permission handling and requests
- Platform-specific behavior (Android vs iOS)
- Daily reminder rescheduling
- Notification cancellation
- Error scenarios (permissions denied, scheduling failures)

#### GeminiService
- Natural language parsing with AI
- Fallback parsing when AI fails
- Date and time extraction and processing
- Relative time handling ("in 30 minutes")
- Daily recurrence detection
- Date conversion (today/tomorrow)
- Error handling for API failures

#### Integration Tests
- Complete reminder creation flow from text to database
- Service interaction validation
- Error propagation across services
- Data consistency verification
- Real-world scenario testing

### 5. Mocking Strategy

The tests use comprehensive mocking for:
- **expo-notifications**: All notification APIs
- **expo-sqlite**: Database operations
- **@google/generative-ai**: AI service calls
- **react-native**: Platform detection

### 6. Running Individual Test Suites

Run specific test files:
```bash
npx jest tests/reminderRepository.test.ts
npx jest tests/notificationService.test.ts  
npx jest tests/geminiService.test.ts
npx jest tests/integration.test.ts
```

### 7. Debugging Tests

For debugging failed tests:
```bash
npx jest --verbose --no-coverage tests/[filename].test.ts
```

### 8. Test Configuration

The Jest configuration in `package.json` includes:
- Expo preset for React Native compatibility
- Transform ignore patterns for node_modules
- Coverage collection from service files
- Setup files for mocking and test utilities

## Expected Test Results

When running successfully, you should see:
- All unit tests passing for each service
- Integration tests validating service interactions
- Code coverage reports showing high coverage for service files
- No unhandled promise rejections or async warnings

The tests ensure the reliability and correctness of the core reminder functionality in the Align app.