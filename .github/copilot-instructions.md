# Copilot Instructions for Align App

## Project Overview

Align is a React Native + Expo app for smart goal reminders and notifications. The app helps users stay aligned with their goals through two main functionalities:

1. **Smart Reminders**: Text-to-agent functionality for setting reminders with push notifications along with manual creation and edits/delete
2. **Daily Goals**: Goal setting with intelligent reminders and chat-based task management

## Architecture & Tech Stack

- **Framework**: React Native with Expo (~53.0.6)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **TypeScript**: Full TypeScript setup with strict configuration
- **Platform Focus**: Android-first development (first-class support)
- **LLM Integration:** Gemini API (via LangChainJS).
- **Database:** SQLite for local persistence.

---

## Core Functionality

### Daily Goals & Chat

- Current day goals → editable in chat.
- Previous days → view-only.
- Future days → inaccessible.
- Natural language → structured tasks (via **Gemini API + LangChainJS**).
- Edits allowed on structured list.
- User can update via chat (“done”, “add”, “remove”) and state adjusts.

### Notifications

- **Local + Firebase push notifications**.
- Scheduled dynamically depending on task state.
- Reschedules automatically if tasks are completed/updated.
- Avoid duplicate or irrelevant notifications.

### Reminders

- Users set custom reminders.
- Delivered as push notifications.
- Reminders history is lazily loaded.

---

## Task Planning Rules for Agent Mode

Before each coding task:

1. **Provide a full plan** of changes (files, functions, components, DB updates, API calls).
2. **List behaviors** that will be changed or added.
3. **List test cases** to be created (unit, integration, e2e as applicable).

Then:

- Always **check for reusable code** (components, hooks, utils, API wrappers) before adding new code.
- Prefer **configuration/extension** of existing functionality over duplication.

---

## Component Patterns

Components follow a consistent pattern with NativeWind styling:

### Styling Convention

Prefer tailwind css for using `className="text-2xl"` type styling and no independent styles files or code blocks.

### Component Structure

- Store components in `components/` directory
- Use named exports: `export const ComponentName = () => {}`
- TypeScript props with explicit typing
- Example: `ScreenContent`, `Container`, `EditScreenInfo`

## Key Files & Directories

- **`App.tsx`**: Entry point using ScreenContent component
- **`components/`**: Reusable UI components with NativeWind styling
- **`global.css`**: Global styles import
- **`app.json`**: Expo configuration (portrait orientation, Android adaptive icons)

## Copilot Development Guidance

### Code Style

- Use **functional components** with hooks.
- Follow **React/Expo best practices** for cross-platform parity.
- Write strongly typed code with TypeScript.
- Keep functions **small, composable, and testable**.

### Database

- Use SQLite for persistence.
- Wrap DB access in a **repository layer** (no direct queries in components).
- Ensure schema changes are **migratable**.

### Notifications

- Encapsulate notification logic in a **service module**.
- Ensure rescheduling and cancellation works reliably.
- Maintain consistency across Android + Web (fallbacks for unsupported platforms).

### LLM & LangChainJS

- Centralize API calls in a **provider module**.
- Keep **parsing and structuring logic** isolated from UI components.
- Make LLM calls cancellable (abort controller) for smoother UX.

## Development Guidelines

- **Incremental features**: Focus on adding features incrementally, avoid "hopscotch" development
- **Android-first**: Prioritize Android development and testing
- **Clean cache**: Use `-c` flag when encountering unexpected behavior
- **TypeScript strict**: Maintain type safety throughout the codebase
- **NativeWind consistency**: Follow established styling patterns for UI consistency

## Code Quality

- Use ESLint + Prettier configuration (`npm run lint`, `npm run format`)
- Follow TypeScript strict mode conventions
- Maintain component prop typing
- Use functional components with hooks pattern
