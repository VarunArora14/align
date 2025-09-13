# Environment Configuration

## Gemini API Key
To use the natural language reminder parsing feature, you'll need a Gemini API key from Google AI Studio.

1. Get your API key from: https://aistudio.google.com/app/apikey
2. Create a `.env` file in your project root
3. Add your API key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

## Note
The app will work without the API key, but natural language parsing will fall back to basic pattern matching.