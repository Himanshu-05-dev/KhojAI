import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.resume import router as resume_router
from app.routes.jobs import router as jobs_router
from app.routes.career import router as career_router

load_dotenv()

app = FastAPI(
    title="KhojAI - AI Microservice",
    description="LangGraph-powered AI orchestration service for resume parsing, job matching, and career roadmaps",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "KhojAI AI Service",
        "framework": "FastAPI + LangGraph",
    }

# Mount v1 routes
app.include_router(resume_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(career_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
