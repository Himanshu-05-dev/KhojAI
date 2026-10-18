# KhojAI — AI Career Copilot & Job Discovery Platform

> **KhojAI** is a production-grade, AI-powered career discovery and job management platform. Designed specifically for students, fresh graduates, and career switchers, KhojAI transforms job hunting into an intelligent, proactive experience.

---

## 🏛️ Four-Layer Architecture

KhojAI follows a strict **Four-Layer Architecture** with clear boundaries between UI, business logic, AI orchestration, and persistent storage:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Presentation (React 18 + Vite + Tailwind CSS)                │
│  Interactive UI, dark/light themes, drag-and-drop resume upload,        │
│  dynamic match breakdowns, interview tracking, and onboarding flow.    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│  LAYER 2: Application & API (Node.js + Express + Mongoose)             │
│  JWT Authentication, RBAC, CRUD APIs, business domain logic,            │
│  notification dispatch with quiet-hours logic, and fallback matching.  │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │ Internal HTTP                          │ Redis Queue
┌───────────────▼────────────────┐      ┌────────────────▼───────────────┐
│  LAYER 3: AI Orchestration     │      │  LAYER 4: Data & Infra         │
│  (Python + FastAPI + LangGraph)│      │  MongoDB 7, Redis 7, BullMQ,   │
│  State-machine workflows for:  │      │  Web Push, SMTP Email,         │
│  - Multi-stage resume parsing  │      │  and Docker Compose.           │
│  - Composite job matching      │      │                                │
│  - Career roadmap generation   │      │                                │
└────────────────────────────────┘      └────────────────────────────────┘
```

---

## 🚀 Key Features

1. **Intelligent Resume Parsing (LangGraph + NLP)**:
   - Extract contact information, structured skills, education, work tenure, and projects.
   - Built with LangGraph state graphs with automatic fallback to local high-accuracy rule engine.

2. **Multi-Dimensional Job Matching**:
   - Composite matching score (0–100%) weighted across **skills (50%)**, **experience (25%)**, **location/work mode (15%)**, and **domain/education (10%)**.
   - Detailed strengths, weaknesses, missing skills, and tailored **AI Copilot Pitch** for every application.

3. **Background Job Discovery & Proactive Alerts**:
   - Asynchronous BullMQ background worker automatically evaluates user profile against newly posted jobs.
   - Respects **Quiet Hours** and **Minimum Match Thresholds** before dispatching in-app, email, or push notifications.

4. **Visual Kanban & Timeline Application Tracker**:
   - Track applications across stages: *Bookmarked*, *Applied*, *Screening*, *Interviewing*, *Offered*, *Rejected*, *Withdrawn*.
   - Log interview rounds, dates, interviewer notes, and compensation details.

5. **Personalized Career Roadmap**:
   - Generates skill-gap analysis for targeted roles (*Frontend*, *Backend*, *Full Stack*, *AI/ML*, *DevOps*).
   - Interactive milestones categorized into courses, projects, system design, and mock interviews.

---

## 📂 Project Structure

```
KhojAI/
├── client/                     # Layer 1: React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                # Axios API client instances
│   │   ├── components/         # Modals, layout shell, job cards
│   │   ├── pages/              # Dashboard, Jobs, Resume, Roadmap, Applications, Inbox, Profile, Settings
│   │   ├── store/              # Zustand state (Auth, UI)
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Layer 2: Node.js + Express API
│   ├── src/
│   │   ├── config/             # Database, Redis, and env settings
│   │   ├── models/             # User, Job, Resume, Match, Application, Notification, Roadmap
│   │   ├── controllers/        # Express route handlers
│   │   ├── services/           # Job matching, discovery, resume parsing, notifications
│   │   ├── middleware/         # JWT auth, validation, upload, error handling
│   │   ├── queues/             # BullMQ queue & worker
│   │   ├── clients/            # AI service client with graceful fallback
│   │   ├── routes/             # Versioned REST API routes (/api/v1)
│   │   └── server.js           # Server entrypoint
│   └── package.json
│
├── ai-service/                 # Layer 3: Python + FastAPI + LangGraph
│   ├── app/
│   │   ├── workflows/          # StateGraph workflows (resume_parser, job_matcher, roadmap_generator)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── routes/             # FastAPI routers
│   │   └── main.py             # Uvicorn entrypoint
│   └── requirements.txt
│
├── docker-compose.yml          # Multi-container local orchestration
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** >= 18 LTS
- **Python** >= 3.10
- **MongoDB** and **Redis** (optional if running in Docker)

---

### Method 1: Using Docker Compose (Recommended)

Run all services (Frontend, Server, Background Worker, AI Service, MongoDB, and Redis) with a single command:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **AI Service Docs**: http://localhost:8000/docs

---

### Method 2: Running Locally

#### 1. Start the AI Microservice (FastAPI + LangGraph)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Start the Backend API (Express + MongoDB)
```bash
cd server
npm install
npm run dev
```

*Optional: In another terminal, run the BullMQ background worker:*
```bash
cd server
npm run worker
```

#### 3. Start the Frontend Client (React + Vite)
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🧪 Testing

### Server API Tests
```bash
cd server
npm test
```

### Client Production Build Check
```bash
cd client
npm run build
```

### AI Service Tests
```bash
cd ai-service
pytest
```

---

## 🔒 Security & Best Practices

- **Password Hashing**: Bcrypt with 12 rounds of salting.
- **Tokens**: Stateless JWT with configurable expiration.
- **Input Validation**: Strict Joi schemas for request bodies, query strings, and path parameters.
- **Headers & CORS**: Secure headers with `helmet`, granular CORS origin configuration.
- **Fail-Safe Design**: Server runs autonomously with local rule-based NLP fallbacks if external AI or Redis services are temporarily offline.

---

## 📄 License
ISC © 2026 KhojAI Team
