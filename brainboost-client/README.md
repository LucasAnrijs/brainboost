# BrainBoost Client

Frontend application for BrainBoost, an adaptive flashcard learning application with spaced repetition, AI-powered content generation, gamification, and real-time collaboration features.

## Features

- User authentication and profile management
- Deck and flashcard management
- Adaptive spaced repetition study interface
- AI-powered flashcard generation
- Gamification system with achievements and streaks
- Real-time collaborative editing
- Analytics and learning insights

## Technologies

- React 18
- TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Formik & Yup for form handling and validation
- Axios for API requests
- SCSS for styling
- Chart.js for data visualization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Eject from Create React App
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier

## Folder Structure

- `src/app` - Application core (store, router, services)
- `src/components` - Reusable UI components
- `src/pages` - Page components
- `src/hooks` - Custom React hooks
- `src/utils` - Utility functions
- `src/styles` - Global styles
- `src/assets` - Static assets

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## License

This project is licensed under the MIT License.
