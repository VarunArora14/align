import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedReminderData } from '../types/reminder';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey?: string) {
        // For development, we'll use a placeholder key
        // In production, this should come from environment variables
        const key = apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyClZsDlFy7I_3vgu9f6pjEV5skYpu2e24Y';
        this.genAI = new GoogleGenerativeAI(key);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Parses natural language text into structured reminder data
     * @param userInput - Natural language text describing the reminder
     * @returns Promise<ParsedReminderData> - Structured reminder data
     */
    async parseReminderText(userInput: string): Promise<ParsedReminderData> {
        try {
            const prompt = this.createParsingPrompt(userInput);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            // console.log("model response: ", response)
            const text = response.text();

            // Parse the JSON response
            const parsedData = this.parseGeminiResponse(text);
            console.log("Gemini parsed data: ", parsedData)
            return parsedData;
        } catch (error) {
            console.error('Error parsing reminder with Gemini:', error);

            // Fallback to basic parsing if Gemini fails
            const fallbackResult = this.fallbackParsing(userInput);
            return fallbackResult;
        }
    }

    private createParsingPrompt(userInput: string): string {
        const currentDate = new Date();
        const currentDateStr = currentDate.toISOString().split('T')[0];
        const currentTimeStr = currentDate.toTimeString().split(' ')[0].slice(0, 5);

        return `
You are a reminder parsing assistant. Parse the following natural language text into a structured reminder format.

Current date: ${currentDateStr}
Current time: ${currentTimeStr}

User input: "${userInput}"

Parse this into a JSON object with the following structure:
{
  "title": "Brief, clear title for the reminder",
  "description": "Optional detailed description (null if none)",
  "date": "YYYY-MM-DD format (null if not specified or unclear)",
  "time": "HH:MM format in 24-hour (null if not specified)",
  "isRelativeTime": boolean (true if time is relative like 'in 30 minutes'),
  "relativeMinutes": number (minutes from now if isRelativeTime is true, null otherwise),
  "usedFallback": boolean (true if user input has no meaning to create reminder for or has bad language)
}

Rules:
1. Extract a concise, actionable title (max 50 characters)
2. Include description only if there are specific details beyond the title
3. For dates: interpret "today", "tomorrow", relative dates, and specific dates
4. For times: interpret "morning" as 09:00, "afternoon" as 14:00, "evening" as 18:00
5. Handle relative times like "in 30 minutes", "in 2 hours"
6. If date/time is ambiguous or missing, set to null
7. Return ONLY the JSON object, no additional text
8. Set "usedFallback" to true if user input has bad language/intent against others

Examples:
- "Call mom tomorrow at 2pm" → {"title": "Call mom", "description": null, "date": "tomorrow's date", "time": "14:00", "isRelativeTime": false, "relativeMinutes": null, "usedFallback": false}
- "Meeting in 30 minutes" → {"title": "Meeting", "description": null, "date": null, "time": null, "isRelativeTime": true, "relativeMinutes": 30, "usedFallback": false}
- "Buy groceries milk eggs bread" → {"title": "Buy groceries", "description": "milk, eggs, bread", "date": null, "time": null, "isRelativeTime": false, "relativeMinutes": null, "usedFallback": false}

Response (JSON only):`;
    }

    private parseGeminiResponse(response: string): ParsedReminderData {
        try {
            // Extract JSON from response (remove any extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            // Process relative dates
            if (parsed.date === 'today') {
                parsed.date = new Date().toISOString().split('T')[0];
            } else if (parsed.date === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                parsed.date = tomorrow.toISOString().split('T')[0];
            }

            // Validate and clean the parsed data
            return {
                title: parsed.title || 'Reminder',
                description: parsed.description || undefined,
                date: parsed.date || undefined,
                time: parsed.time || undefined,
                isRelativeTime: parsed.isRelativeTime || false,
                relativeMinutes: parsed.relativeMinutes || undefined,
                usedFallback: false,
            } as ParsedReminderData;
        } catch (error) {
            console.error('Error parsing Gemini JSON response:', error);
            throw new Error('Failed to parse Gemini response');
        }
    }

    private fallbackParsing(userInput: string): ParsedReminderData {
        // Basic fallback parsing when Gemini fails
        const input = userInput.trim();

        // Extract potential time patterns
        const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(am|pm)/i,
            /(\d{1,2})\s*(am|pm)/i,
            /at\s*(\d{1,2}):(\d{2})/i,
            /at\s*(\d{1,2})\s*(am|pm)/i,
        ];

        let extractedTime: string | undefined;
        let cleanedInput = input;

        for (const pattern of timePatterns) {
            const match = input.match(pattern);
            if (match) {
                if (match[3]) { // am/pm format
                    let hour = parseInt(match[1]);
                    const minute = match[2] ? parseInt(match[2]) : 0;
                    const period = match[3].toLowerCase();

                    if (period === 'pm' && hour !== 12) hour += 12;
                    if (period === 'am' && hour === 12) hour = 0;

                    extractedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                } else {
                    extractedTime = `${match[1].padStart(2, '0')}:${match[2] || '00'}`;
                }
                cleanedInput = input.replace(match[0], '').trim();
                break;
            }
        }

        // Extract date patterns
        const datePatterns = [
            /\b(today|tomorrow)\b/i,
            /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
            /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
        ];

        let extractedDate: string | undefined;

        for (const pattern of datePatterns) {
            const match = input.match(pattern);
            if (match) {
                if (match[1] && match[1].toLowerCase() === 'today') {
                    extractedDate = new Date().toISOString().split('T')[0];
                } else if (match[1] && match[1].toLowerCase() === 'tomorrow') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    extractedDate = tomorrow.toISOString().split('T')[0];
                } else if (match[2] && match[3] && match[4]) {
                    // MM/DD/YYYY format
                    const month = match[2].padStart(2, '0');
                    const day = match[3].padStart(2, '0');
                    extractedDate = `${match[4]}-${month}-${day}`;
                } else if (match[1] && match[2] && match[3]) {
                    // YYYY-MM-DD format
                    extractedDate = match[0];
                }
                cleanedInput = cleanedInput.replace(match[0], '').trim();
                break;
            }
        }

        // Check for relative time
        const relativeTimeMatch = input.match(/in\s*(\d+)\s*(minute|hour)s?/i);
        let isRelativeTime = false;
        let relativeMinutes: number | undefined;

        if (relativeTimeMatch) {
            isRelativeTime = true;
            const amount = parseInt(relativeTimeMatch[1]);
            const unit = relativeTimeMatch[2].toLowerCase();
            relativeMinutes = unit.startsWith('hour') ? amount * 60 : amount;
            cleanedInput = cleanedInput.replace(relativeTimeMatch[0], '').trim();
        }

        // Clean up the title
        const title = cleanedInput
            .replace(/\b(at|on|in|for|to)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim() || 'Reminder';

        return {
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description: undefined,
            date: extractedDate,
            time: extractedTime,
            isRelativeTime,
            relativeMinutes,
            usedFallback: true,
        } as ParsedReminderData;
    }

    /**
     * Converts parsed reminder data to a Date object for scheduling
     * @param parsedData - The parsed reminder data
     * @returns Date object for the scheduled time
     */
    static createScheduledDate(parsedData: ParsedReminderData): Date {
        const now = new Date();

        if (parsedData.isRelativeTime && parsedData.relativeMinutes) {
            // Relative time scheduling
            const scheduledTime = new Date(now.getTime() + parsedData.relativeMinutes * 60 * 1000);
            return scheduledTime;
        }

        // Absolute time scheduling
        let targetDate = now;

        if (parsedData.date) {
            targetDate = new Date(parsedData.date);
        }

        if (parsedData.time) {
            const [hours, minutes] = parsedData.time.split(':').map(Number);
            targetDate.setHours(hours, minutes, 0, 0);
        } else {
            // Default to next hour if no time specified
            targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
        }

        // If the scheduled time is in the past, move it to tomorrow
        if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        return targetDate;
    }
}

// Export a singleton instance
export const geminiService = new GeminiService();