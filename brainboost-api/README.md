# BrainBoost API

Backend API for BrainBoost, an adaptive flashcard learning application with spaced repetition, AI-powered content generation, gamification, and real-time collaboration features.

## Features

- User authentication and profile management
- Deck and flashcard management
- Adaptive spaced repetition algorithm
- AI-powered flashcard generation
- Gamification system with achievements and streaks
- Real-time collaborative editing
- Analytics and learning insights

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

### Endpoints

- `/api/v1/auth` - Authentication endpoints
- `/api/v1/users` - User management endpoints
- `/api/v1/decks` - Deck management endpoints
- `/api/v1/cards` - Card management endpoints
- `/api/v1/reviews` - Review and study session endpoints

## Development

### Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

## License

This project is licensed under the MIT License.
