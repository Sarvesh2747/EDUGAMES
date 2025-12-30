# Gamefied Learning App For Rular Areas

SIH-2025 Runner UP PROJECT BY GOV OF ODISA

A comprehensive educational platform for rural communities, featuring lessons, quizzes, games, and interactive science modules.

## Project Structure

```
/rural-learning-app
├── /frontend       # React Native (Expo) mobile application
├── /backend        # Node.js + Express + MongoDB API server
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and JWT secret.

5. Seed the database with sample data:
   ```bash
   npm run seed
   ```

6. Start the backend server:
   ```bash
   npm start
   ```

   The API will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For mobile testing, update the API URL in `src/services/api.ts`:
   - Find your local IP address (e.g., `192.168.1.5`)
   - Update `API_BASE_URL` to `http://YOUR_IP:5000/api`

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with Expo Go app (iOS/Android) or press `w` for web.

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- React Navigation
- React Native Paper
- React Native Reanimated
- Expo Linear Gradient

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt for password hashing
- Joi validation
- Helmet + CORS for security

## Features

- 📚 **Lessons**: Interactive learning modules
- 🎮 **Games**: Educational games (Odd One Out, Memory Match)
- 📝 **Quizzes**: Knowledge assessment with instant feedback
- 🔬 **Science**: Interactive anatomy explorer
- 👨‍🏫 **Teacher Dashboard**: Analytics and student progress tracking
- 🔄 **Offline Sync**: Work offline and sync when connected
- 🏆 **Gamification**: XP, levels, and streak tracking

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/lessons` - Get all lessons
- `GET /api/quizzes/random` - Get random quiz
- `POST /api/games/result` - Submit game score
- `GET /api/science/organs` - Get anatomy data
- `POST /api/sync` - Sync offline data

## License

MIT
