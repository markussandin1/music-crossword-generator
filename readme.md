# Music Crossword Generator

A web application that creates music-themed crossword puzzles from your Spotify playlists using OpenAI and Spotify APIs.

## Features

- Connect to Spotify to load playlist data
- Generate music-themed crossword questions using OpenAI
- Create and arrange crossword puzzles automatically
- Play and solve crossword puzzles
- Save and share your created puzzles

## Tech Stack

### Backend
- **Node.js/Express**: REST API with MVC architecture
- **PostgreSQL**: Database for storing user data, quizzes, and questions
- **Knex.js**: SQL query builder and migrations
- **Spotify Web API**: Integration for playlist and track data
- **OpenAI API**: Question generation and crossword creation

### Frontend
- **React**: Component-based UI
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **Lucide React**: Icon library

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL
- Spotify Developer account
- OpenAI API key

### Environment Variables

Create a `.env` file in the `backend` directory based on `.env.example`:

```
# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=music_crossword
DB_USER=postgres
DB_PASSWORD=postgres

# Spotify API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo

# CORS
CORS_ORIGINS=http://localhost:5173
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/music-crossword.git
   cd music-crossword
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Create the database:
   ```bash
   createdb music_crossword
   ```

4. Run database migrations:
   ```bash
   cd backend
   npm run migrate
   ```

5. Start the development servers:
   ```bash
   # From the root directory
   npm start
   ```

## Development Workflow

- Backend server runs on `http://localhost:3000`
- Frontend development server runs on `http://localhost:5173`
- API endpoints are available at `http://localhost:3000/api/*`

### Database Migrations

```bash
# Create a new migration
cd backend
npx knex migrate:make migration_name

# Run migrations
npm run migrate

# Rollback the last migration
npx knex migrate:rollback
```

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Deployment

### Docker

Build and run the Docker containers:

```bash
docker-compose up --build
```

### Manual Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Spotify Integration
- `GET /api/auth/spotify`: Initiate Spotify OAuth flow
- `GET /api/auth/spotify/callback`: Handle Spotify OAuth callback
- `POST /api/playlist`: Get playlist data from Spotify

### Question Generation
- `POST /api/generate-questions`: Generate questions from track data

### Crossword Builder
- `POST /api/build-crossword`: Build a crossword from selected questions

### Quiz Management
- `POST /api/quiz`: Save a quiz
- `GET /api/quizzes`: Get user's quizzes
- `GET /api/quiz/:id`: Get a specific quiz

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [OpenAI API](https://platform.openai.com/docs/introduction)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [Knex.js](https://knexjs.org/)# music-crossword-generator
