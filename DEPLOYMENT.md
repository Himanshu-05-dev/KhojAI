# 🚀 KhojAI Production Deployment Guide

This guide walks you through deploying **KhojAI** to production:
- **Frontend (React + Vite SPA)**: Hosted on **Vercel**
- **Backend API (Node.js + Express)**: Hosted on **Render**
- **Database (MongoDB)**: Hosted on **MongoDB Atlas** (Free M0 Tier)

---

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────┐
│     Client (Vercel)             │
│  https://khojai.vercel.app      │
└──────────────┬──────────────────┘
               │ HTTPS API Requests (VITE_API_URL)
┌──────────────▼──────────────────┐
│     Backend (Render)            │
│  https://khojai-api.onrender.com│
└──────────────┬──────────────────┘
               │ Mongoose TLS
┌──────────────▼──────────────────┐
│   MongoDB Atlas (Cloud DB)      │
│  mongodb+srv://...              │
└─────────────────────────────────┘
```

---

## Step 1: Set up MongoDB Atlas (Free Database)

Render's free tier does not include a native MongoDB instance, so **MongoDB Atlas Free (M0)** is the standard and recommended choice.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or create an account.
2. Click **Create** to launch a new database cluster.
3. Choose the **M0 Free** shared tier (AWS, closest region to you).
4. Under **Security Quickstart**:
   - Create a database user (e.g., `khojai_user`) and a secure password. *(Save this password)*
   - Under **IP Access List**, add `0.0.0.0/0` (Allow Access from Anywhere) so Render can connect.
5. Click **Clusters** -> **Connect** -> **Drivers** (Node.js).
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://khojai_user:<password>@cluster0.xxxxx.mongodb.net/khojai?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password and ensure the database name `/khojai` is present).*

---

## Step 2: Deploy Backend to Render

You can deploy using either the automated Blueprint (`render.yaml`) or the Render UI.

### Option A: Using Render Blueprint (Fastest & 1-Click)

1. Commit and push all changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add Vercel and Render deployment configs"
   git push origin <your-branch>
   ```
2. Log in to [Render](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository (`Himanshu-05-dev/KhojAI`).
5. Render reads `render.yaml` automatically:
   - Service name: `khojai-api`
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/v1/health`
6. Fill in the prompted variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1.
   - `CLIENT_URL`: `https://khojai.vercel.app` (or leave blank and fill in after deploying Vercel).
7. Click **Apply**. Render will build and deploy your API.
8. Copy your Render backend URL:
   `https://<your-service-name>.onrender.com`

---

### Option B: Manual Web Service Setup on Render

1. Log in to [Render](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Select your repository: `Himanshu-05-dev/KhojAI`.
3. Configure the service settings:
   - **Name**: `khojai-api` (or your choice)
   - **Region**: Choose closest to your DB (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced** -> **Health Check Path**:
   - Set to `/api/v1/health`
5. Under **Environment Variables**, add:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render assigns this automatically |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | *(Random 32+ char string)* | Secret for auth tokens |
| `JWT_EXPIRY` | `7d` | Token validity |
| `CLIENT_URL` | `*` or `https://<your-app>.vercel.app` | Allowed CORS origin |
| `DEMO_MODE` | `false` | Production mode |

6. Click **Create Web Service**. Wait for the build to succeed.
7. Test the backend by visiting:
   - Root: `https://<your-service-name>.onrender.com/`
   - Health: `https://<your-service-name>.onrender.com/api/v1/health`

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Import your GitHub repository: `Himanshu-05-dev/KhojAI`.
3. In the project configuration screen:
   - **Project Name**: `khojai` (or your choice)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client` (Critical: Must be `client`).
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
4. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-backend-name>.onrender.com/api/v1` |

*(Note: Replace with your actual Render service URL from Step 2, and ensure it ends with `/api/v1`)*.

5. Click **Deploy**. Vercel will install dependencies, build the Vite app, and assign a production URL (e.g. `https://khojai.vercel.app`).

---

## Step 4: Connect & Verify

1. **Update Backend CORS (`CLIENT_URL`)**:
   - Go to Render -> your `khojai-api` Web Service -> **Environment**.
   - Update `CLIENT_URL` to your Vercel URL (e.g., `https://khojai.vercel.app`).
   - Save changes (Render will trigger a quick redeploy).

2. **Verify the Live Deployment**:
   - Visit your Vercel frontend URL.
   - Navigate to `/auth/register` and create a new account.
   - Navigate to `/jobs` — verify seeded jobs load from MongoDB.
   - Upload a test resume in `/resume` — verify parsing and skill extraction work.
   - Refresh the page on any internal route (e.g., `/dashboard`, `/applications`) — verify that `client/vercel.json` prevents 404 errors.

---

## 💡 Troubleshooting & Notes

- **Render Cold Starts (Free Tier)**:
  On Render's free tier, backend instances spin down after 15 minutes of inactivity. The first request after sleep may take ~30–50 seconds to respond. Subsequent requests are fast.
- **CORS Issues**:
  The backend CORS policy is preconfigured in [server/src/app.js](file:///d:/projects/KhojAI/server/src/app.js) to dynamically accept all `*.vercel.app` domains, `localhost`, and your configured `CLIENT_URL`.
- **AI Microservice Fallback**:
  The backend includes a built-in rule-based NLP extraction and matching engine. If you do not deploy `ai-service` separately on Render, resume parsing and job matching automatically and gracefully fall back to local parsing without crashing.
