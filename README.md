# KhojAI — AI Career Copilot & Job Discovery Platform

> **KhojAI** is an intelligent, full-stack AI career copilot and automated job discovery platform designed for students, freshers, and software engineers. It automates resume parsing, multi-dimensional job matching, background job scraping, zero-click application tracking, and AI-powered recruiter communication analysis.

---

## 🏛️ System Architecture

KhojAI is engineered as a resilient, multi-tiered microservices architecture:

```mermaid
flowchart TD
    subgraph ClientLayer["Layer 1: Frontend Client (React 18 + Vite + Tailwind CSS)"]
        UI["Modern Responsive UI / SPA"]
        AuthStore["Zustand State (Auth & Session)"]
        QueryCache["TanStack Query (Cache & Sync)"]
        UI --> AuthStore
        UI --> QueryCache
    end

    subgraph APILayer["Layer 2: Application API (Node.js + Express)"]
        Router["Versioned REST Router (/api/v1)"]
        AuthMid["JWT Auth & Security Middleware"]
        JoiVal["Joi Request Validation"]
        AppController["Application Controller (Auto-Track & Sync)"]
        ResumeController["Resume & Profile Controller"]
        JobService["Real-Time Job Sync & Scraper Engine"]
        
        Router --> AuthMid --> JoiVal
        JoiVal --> AppController
        JoiVal --> ResumeController
        JoiVal --> JobService
    end

    subgraph AILayer["Layer 3: AI Orchestration (FastAPI + LangGraph + DeepSeek-R1)"]
        AIWorker["FastAPI Microservice (Port 8000)"]
        LGResume["LangGraph Resume Parsing Graph"]
        DeepSeek["DeepSeek-R1 / Gemini Inference Client"]
        ScoreEngine["Multi-Dimensional Match Engine"]
        
        AIWorker --> LGResume
        AIWorker --> DeepSeek
        AIWorker --> ScoreEngine
    end

    subgraph DataLayer["Layer 4: Persistence & Infrastructure"]
        Atlas["MongoDB Atlas / Local MongoDB"]
        RedisCache["Redis 7 & BullMQ Queue"]
        DiskUploads["Local Uploads Storage (/uploads)"]
    end

    ClientLayer -- "HTTPS / JSON API" --> APILayer
    APILayer -- "Internal HTTP / Service Key" --> AILayer
    APILayer -- "Mongoose ODM" --> Atlas
    APILayer -- "Asynchronous Jobs" --> RedisCache
    ResumeController -- "File System" --> DiskUploads
```

---

## ⚡ Core Workflows & Mermaid Flow Diagrams

### 1. Zero-Click Job Application Auto-Tracking & AI Message Sync

Unlike traditional job boards requiring manual entry, KhojAI tracks applications automatically upon applying, and utilizes NLP to update pipeline stages from recruiter emails:

```mermaid
flowchart LR
    A["User Clicks 'Apply on Source'"] --> B["Open External Listing in New Tab"]
    A --> C["Auto-Dispatch applicationsAPI.create()"]
    C --> D["Server Resolves Company & Job Meta"]
    D --> E["Persist into MongoDB as 'Applied'"]
    E --> F["Instant UI Badge: Tracked (Applied) ✓"]

    subgraph AIRecruiterSync["AI Recruiter Message Parser"]
        G["Recruiter Email / Interview Invite"] --> H["Paste into AI Message Parser"]
        H --> I["NLP Intent & Stage Classifier"]
        I --> J["Extract Status (Interview / Assessment / Offer / Reject)"]
        J --> K["Extract Scheduled Dates & Deadlines"]
        K --> L["Auto-Update Application & Timeline History"]
    end
```

---

### 2. Intelligent Resume Ingestion & LangGraph Pipeline

Resumes undergo multi-pass parsing with LangGraph state graphs and local NLP fallbacks to guarantee 100% extraction reliability without missing skills or achievements:

```mermaid
flowchart TD
    Upload["PDF Resume Upload"] --> ExtractText["Text Extraction (pdf-parse)"]
    ExtractText --> CheckAI{"AI Microservice Available?"}
    
    CheckAI -- "Yes" --> LangGraphNode["LangGraph Multi-Node State Machine"]
    CheckAI -- "Fallback" --> LocalNLP["Local Rule-Based NLP Engine"]
    
    subgraph LGGraph["LangGraph Workflow"]
        N1["extract_contact (Email, Phone, Name)"] --> N2["extract_skills (Full Tech Stack)"]
        N2 --> N3["extract_exp_edu (Tenures, Degrees, Projects)"]
        N3 --> N4["extract_achievements (Hackathons, Awards)"]
        N4 --> N5["synthesize_profile (Unified Profile Object)"]
    end
    
    LangGraphNode --> LGGraph
    LGGraph --> SaveProfile["Persist Resume & Sync Primary Profile"]
    LocalNLP --> SaveProfile
    SaveProfile --> Notify["Dispatch Real-Time Notification"]
```

---

### 3. Multi-Dimensional Job Matching & Proactive Alerts

Jobs discovered from Amazon, Internshala, and global feeds are scored against user profiles:

```mermaid
flowchart TD
    JobScraper["Periodic Job Discovery Engine (Every 30 Mins)"] --> ScrapeSources["Amazon India, Internshala Tech, Global Feeds"]
    ScrapeSources --> UpsertJobs["Deduplicate & Upsert Jobs into Database"]
    
    UpsertJobs --> MatchEvaluation["Match Evaluation Against Active Profiles"]
    
    subgraph ScoringWeights["Composite Scoring Engine (0-100%)"]
        W1["Technical Skills Match (50%)"]
        W2["Experience Tenure Match (25%)"]
        W3["Location & Work Mode (15%)"]
        W4["Education & Degree Match (10%)"]
    end
    
    MatchEvaluation --> ScoringWeights
    ScoringWeights --> TotalScore["Calculate Composite Match Score"]
    
    TotalScore --> ThresholdCheck{"Score >= Min User Threshold (e.g. 70%)?"}
    ThresholdCheck -- "Yes" --> QuietHours{"Is Quiet Hours Active?"}
    ThresholdCheck -- "No" --> Discard["Store Match Record for Feed Search"]
    
    QuietHours -- "No" --> SendAlert["Send Real-Time Notification & Copilot Pitch"]
    QuietHours -- "Yes" --> QueueAlert["Schedule Notification after Quiet Hours"]
```

---

### 4. Application Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Interested: Bookmarked / Saved
    Interested --> Applied: Click 'Apply on Source' (Auto-Track)
    Applied --> Screening: Resume In-Review (Auto-Sync)
    Screening --> Assessment: Coding Test Assigned (AI Parser)
    Assessment --> Interview: Technical / HR Round (AI Parser)
    Interview --> Offer: Formal Offer Extended 🎉
    Interview --> Rejected: Candidate Not Selected
    Assessment --> Rejected: Assessment Failed
    Screening --> Rejected: Screen Out
    Offer --> [*]
    Rejected --> [*]
```

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Zero-Click Auto-Tracking** | Clicking *"Apply on [source]"* automatically registers the application in MongoDB under `Applied` with zero manual form filling. |
| **AI Message / Email Parser** | Paste recruiter emails, interview invites, or test links; the system identifies the company, stage, dates, and auto-progresses the status. |
| **Comprehensive Resume Parser** | Extracts all tech stack skills, hackathon achievements, certifications, projects, education, and career experience. |
| **DeepSeek-R1 / LangGraph Engine** | High-performance reasoning for deep profile synthesis and tailored AI Copilot application pitches. |
| **Live Job Discovery** | Background scraping synchronizes fresh opportunities from live tech boards every 30 minutes. |
| **Interactive Pipeline Tracker** | 1-click status advancement pills (`→ Screening`, `→ Assessment`, `→ Interview`, `🎉 Offer`) directly on cards. |
| **Built-in Account Recovery** | Quick password reset and 1-click credential switcher built into authentication. |

---

## 📂 Project Structure

```
KhojAI/
├── client/                     # Layer 1: React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                # API client with JWT interceptors
│   │   ├── components/         # Reusable UI cards, badges, modals
│   │   ├── pages/              # Applications, Jobs, Resume, Dashboard, Auth
│   │   ├── store/              # Zustand Auth Store
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Layer 2: Node.js + Express API
│   ├── src/
│   │   ├── config/             # Database (MongoDB Atlas), DNS, JWT settings
│   │   ├── controllers/        # Application, Auth, Resume, Job controllers
│   │   ├── models/             # Application, User, Job, Resume, Match
│   │   ├── routes/             # REST endpoints (/api/v1/applications, /auth, etc.)
│   │   ├── services/           # RealJobFetcher, JobService, ResumeService
│   │   ├── validators/         # Joi validation schemas
│   │   └── server.js           # Server entrypoint
│   └── package.json
│
├── ai-service/                 # Layer 3: Python + FastAPI + LangGraph
│   ├── app/
│   │   ├── workflows/          # StateGraph pipelines (resume_parser, job_matcher)
│   │   ├── schemas/            # Pydantic data models
│   │   ├── routes/             # Resume, Match, Roadmap endpoints
│   │   └── main.py             # FastAPI entrypoint
│   └── requirements.txt
│
├── docker-compose.yml          # Container orchestration
└── README.md
```

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- **Node.js** >= 18 LTS
- **Python** >= 3.10
- **MongoDB** (Atlas connection or local MongoDB instance)

---

### Running Locally

#### 1. Start the AI Microservice (FastAPI + LangGraph)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Start the Backend API (Node.js + Express)
```bash
cd server
npm install
npm run dev
```

#### 3. Start the Frontend Client (React + Vite)
```bash
cd client
npm install
npm run dev
```

Visit **http://localhost:5173** to use the application.

---

### Default Development Credentials

For quick local testing and evaluation:
- **Email:** `himanshu@gmail.com` *(or `himanshu@khojai.dev`)*
- **Password:** `Password@123`

---

## 🧪 Verification & Testing

```bash
# Verify client build
npm --prefix client run build

# Verify server syntax & health
node server/src/server.js
curl http://localhost:5000/api/v1/health

# Run AI service tests
cd ai-service && pytest
```

---

## 📄 License

ISC © 2026 KhojAI Team. Built for engineers, students, and ambitious job seekers.
