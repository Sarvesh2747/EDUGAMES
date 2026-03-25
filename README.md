# EduGames - Gamified Learning Platform

**SIH-2025 Runner-Up Project by Government of Odisha**

A comprehensive educational platform designed for rural communities, featuring interactive lessons, educational games, quizzes, 3D science simulations, and multi-role dashboards for students, teachers, admins, and institutes.

---

## 🎯 Project Overview

EduGames is a full-stack React Native (Expo) + Node.js application that provides:
- **Student Learning**: Interactive lessons, quizzes, educational games, and 3D science models
- **Teacher Management**: Student analytics, content creation, quiz builder, approval workflows
- **Admin Dashboard**: System-wide analytics, user management, content moderation
- **Institute Portal**: Multi-teacher management, student oversight, institutional analytics
- **Offline-First**: Full offline support with background sync
- **Gamification**: XP system, levels, streaks, leaderboards, and rewards

---

## 📁 Project Structure

```
/EDUGAMESAPP-main
├── /frontend          # React Native (Expo) - Mobile & Web App
│   ├── /src
│   │   ├── /screens      # All application screens (Student, Teacher, Admin, Institute)
│   │   ├── /components   # Reusable UI components (UnifiedHeader, CustomTabBar, etc.)
│   │   ├── /navigation   # React Navigation setup (MainNavigator, TeacherNavigator, etc.)
│   │   ├── /services     # API services, offline sync, auth
│   │   ├── /context      # React Context (Auth, Theme, Language)
│   │   ├── /data         # Static content (lessons, quiz data)
│   │   └── /assets       # Images, sounds, 3D models
│   └── package.json
├── /backend           # Node.js + Express + MongoDB API
│   ├── /models           # Mongoose schemas
│   ├── /routes           # API route handlers
│   ├── /controllers      # Business logic
│   ├── /middleware       # Auth, validation, rate limiting
│   ├── /scripts          # Maintenance and seeding scripts
│   └── server.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** (local or cloud instance)
- **Expo Go** app (for mobile testing)
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/edugames
   JWT_SECRET=your_secure_jwt_secret_key
   PORT=5000
   GEMINI_API_KEY=your_google_gemini_api_key  # Optional: for AI features
   ```

5. **Seed the database:**
   ```bash
   npm run seed
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   The API will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL for mobile testing:**
   - Open `src/services/api.ts`
   - Find your local IP address (e.g., `192.168.1.5`)
   - Update `API_BASE_URL` to `http://YOUR_IP:5000/api`

4. **Start Expo development server:**
   ```bash
   npx expo start
   ```

5. **Run the app:**
   - **Mobile**: Scan QR code with Expo Go app (iOS/Android)
   - **Web**: Press `w` in terminal
   - **Android Emulator**: Press `a`
   - **iOS Simulator**: Press `i` (macOS only)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React Native (Expo SDK 54)** | Cross-platform mobile & web framework |
| **TypeScript** | Type-safe development |
| **React Navigation 7** | Navigation (Bottom Tabs, Stack) |
| **React Native Paper 5** | Material Design UI components |
| **React Native Reanimated 4** | High-performance animations (ScaleButton, transitions) |
| **Expo Linear Gradient** | Gradient backgrounds |
| **Expo Blur** | Glassmorphic UI effects |
| **React Three Fiber** | 3D model rendering (anatomy, science) |
| **i18next** | Multi-language support (English, Hindi, Odia) |
| **AsyncStorage** | Offline data persistence |
| **Axios** | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | NoSQL database & ODM |
| **JWT** | Stateless authentication |
| **Bcrypt** | Password hashing |
| **Joi** | Request validation |
| **Helmet + CORS** | Security middleware |
| **Morgan** | HTTP request logging |
| **Google Gemini AI** | AI-powered content generation (optional) |
| **Express Rate Limit** | API rate limiting |

---

## ✨ Key Features

### 🎓 Student Features
- **Interactive Learning Dashboard**: Bento grid layout with lessons, quizzes, games, and science modules
- **Educational Games** (14+ games):
  - Odd One Out, Memory Match, Label Organ, Cell Structure Quiz
  - Quick Math, Chemistry Balance, Force Play, Digestive Dash
  - Time Travel Debug, Genetics Lab, Concept Chain, and more
- **3D Science Viewer**: Interactive anatomy models (heart, brain, lungs, etc.)
- **Quiz System**: Subject-based quizzes with instant feedback
- **Progress Tracking**: XP, levels, streaks, course completion
- **Leaderboards**: Global and friend rankings
- **Offline Mode**: Full offline support with background sync
- **Dark Mode**: System-wide theme support
- **Multi-language**: English, Hindi, Odia

### 👨‍🏫 Teacher Features
- **Teacher Dashboard**: Student analytics, quiz attempts, weak topics
- **Student Management**: Create, edit, approve students
- **Content Manager**: Upload lessons, assign chapters
- **Quiz Creator**: Build custom quizzes
- **Analytics**: Student performance, game analytics, subject-wise stats
- **Notifications**: Send announcements to students
- **Approval Workflow**: Manage pending student registrations

### 🏫 Institute Features
- **Multi-Teacher Management**: Oversee multiple teachers
- **Institutional Analytics**: Aggregate student performance
- **Content Oversight**: Review and approve teacher-created content
- **Student Roster**: View all enrolled students
- **Notifications**: Institute-wide announcements

### 🔧 Admin Features
- **System Dashboard**: User statistics, content moderation
- **User Management**: Approve/reject teachers and institutes
- **Content Moderation**: Review flagged content
- **Analytics**: Platform-wide usage statistics
- **Support**: Manage support tickets

### 🎨 UI/UX Highlights
- **UnifiedHeader**: Consistent header across all student screens
- **ScaleButton**: Tactile press animations on all interactive elements
- **Watermark Icons**: Subtle depth effects on cards
- **Glassmorphic Nav Bar**: Floating bottom navigation with blur effect
- **Responsive Design**: Optimized for mobile, tablet, and web (max-width constraints)
- **Premium Gradients**: Vibrant color schemes across dashboards
- **Advanced Quiz UI**: Glassmorphic question cards with segmented progress bars
- **Smart Review System**: Color-coded "Review Mistakes" modal for instant feedback distinction
- **Organized Tasks**: Tabbed view for Pending vs Completed assignments

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (student/teacher/institute/admin)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Lessons & Content
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create lesson (teacher/admin)

### Quizzes
- `GET /api/quizzes/random` - Get random quiz
- `POST /api/quizzes/submit` - Submit quiz attempt
- `GET /api/quizzes/attempts` - Get user's quiz history

### Games
- `POST /api/games/result` - Submit game score
- `GET /api/games/leaderboard` - Get game leaderboard
- `GET /api/games/stats` - Get user game statistics

### Science & 3D Models
- `GET /api/science/organs` - Get anatomy data
- `GET /api/models` - Get 3D model list

### Teacher
- `GET /api/teacher/stats` - Get teacher analytics
- `POST /api/teacher/students` - Create student
- `GET /api/teacher/students` - Get teacher's students
- `POST /api/teacher/quiz` - Create custom quiz

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/approve/:userId` - Approve user
- `GET /api/admin/stats` - Get system statistics

### Sync
- `POST /api/sync` - Sync offline data

---

## 🎮 Available Games

1. **Odd One Out** - Pattern recognition
2. **Memory Match** - Memory card game
3. **Label Organ** - Anatomy labeling
4. **Cell Structure Quiz** - Biology quiz
5. **Quick Math** - Mental math challenges
6. **Chemistry Balance** - Chemical equation balancing
7. **Force Play** - Physics force simulation
8. **Digestive Dash** - Digestive system game
9. **Cell Command** - Cell biology strategy
10. **Time Travel Debug** - Historical debugging
11. **Genetics Lab** - Genetics simulation
12. **Concept Chain** - Concept linking game
13. **Photosynthesis Quest** - Plant biology
14. **Ecosystem Balance** - Ecology simulation

---

## 🧪 Testing

### Expo Doctor
Run health checks on the Expo project:
```bash
cd frontend
npx expo-doctor
```

### Manual Testing
1. **Student Flow**: Register → Login → Browse Lessons → Play Games → Take Quiz
2. **Teacher Flow**: Login → View Analytics → Create Student → Assign Content
3. **Admin Flow**: Login → Approve Users → View System Stats
4. **Offline Mode**: Disable network → Use app → Re-enable → Verify sync

---

## 📝 Recent Updates

- ✅ **Unified UI**: Consistent `UnifiedHeader` across all student screens
- ✅ **Tile Polish**: Added `ScaleButton` animations and watermark icons
- ✅ **Mobile Nav Optimization**: Compact, floating nav bar with no overlap
- ✅ **Codebase Cleanup**: Removed duplicate files, renamed for clarity
- ✅ **Teacher Dashboard Clarity**: Renamed files for better maintainability
- ✅ **Dark Mode**: Full dark theme support
- ✅ **Responsive Bento Grid**: 2-column mobile layout for Learn & Games
- ✅ **Logout Security**: Confirmation dialogs with modern square UI for all roles
- ✅ **Web Optimization**: Enhanced responsive layouts with proper constraints for large screens


---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Team

**SIH-2025 Runner-Up Project**  
Government of Odisha

---

## 📞 Support
contact- divyesh.ravane_comp23@pccoer.in
For issues or questions, please open an issue on GitHub or contact the development team.
