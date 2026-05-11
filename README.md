# ⚡ TeamFlow — Team Task Manager

> Full-Stack Web App | Node.js + MongoDB + React | Role-Based Access Control

![Tech Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Deploy](https://img.shields.io/badge/Deploy-Railway-purple)

---

## 🎯 Features

### Authentication
- JWT-based Signup / Login
- Password hashing with bcryptjs
- Protected routes (frontend + backend)

### Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | ❌ (own only) |
| Manage team members | ✅ | ❌ |
| Change user roles | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ |
| Delete any task | ✅ | ❌ (own only) |

### Project Management
- Create / Edit / Delete projects
- Color coding, priority, status, due dates
- Progress bar (done tasks / total tasks)
- Member management (add/remove)

### Task Management
- Kanban board (To Do → In Progress → Review → Done)
- Task assignment to team members
- Priority levels: Low / Medium / High / Critical
- Overdue detection with visual alerts
- Estimated hours tracking

### Dashboard
- Stats: Projects, Done tasks, In Progress, Overdue
- Task breakdown bar chart
- Recent activity feed
- My pending tasks list

---

## 🏗️ Project Structure

```
enthra.ai/
├── backend/
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/          # REST API routes
│   │   ├── auth.js      # /api/auth/*
│   │   ├── projects.js  # /api/projects/*
│   │   ├── tasks.js     # /api/tasks/*
│   │   └── users.js     # /api/users/*
│   ├── middleware/
│   │   ├── auth.js      # JWT protect + restrictTo
│   │   └── validators.js # express-validator rules
│   ├── seed.js          # Demo data seeder
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Dashboard, Projects, Tasks, Team
│   │   ├── components/  # Layout, Sidebar
│   │   ├── services/    # Axios API client
│   │   ├── App.jsx      # Router
│   │   └── index.css    # Full design system
│   └── index.html
├── railway.json         # Railway deployment config
├── Procfile
└── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free)

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env:
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=your_random_secret
```

### 3. Seed Demo Data
```bash
node backend/seed.js
```

### 4. Run Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

App runs at: http://localhost:3000

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@teamflow.com | admin123 | Admin |
| member@teamflow.com | member123 | Member |
| jordan@teamflow.com | member123 | Member |

---

## 🌐 Railway Deployment

### Step 1: MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Add a database user + password
3. Whitelist IP: `0.0.0.0/0` (allow all for Railway)
4. Copy the connection string

### Step 2: Build Frontend
```bash
cd frontend && npm run build
```

### Step 3: Deploy to Railway
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables in Railway dashboard:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = production
   - `FRONTEND_URL` = your Railway app URL

4. Railway auto-detects `railway.json` and deploys!

---

## 📡 REST API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:uid` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filtered) |
| GET | `/api/tasks/dashboard` | Dashboard stats |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | All authenticated |
| PUT | `/api/users/:id/role` | Admin only |
| PUT | `/api/users/:id/status` | Admin only |

---

## 🔒 Security
- Passwords hashed with bcryptjs (12 rounds)
- JWT tokens expire in 7 days
- Role checks on every protected route
- Input validation with express-validator
- CORS configured for production

---

*Built for the Full-Stack Assessment — TeamFlow by enthra.ai*
