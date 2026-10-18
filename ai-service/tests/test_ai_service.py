import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "FastAPI" in data["framework"]

def test_resume_parsing():
    sample_text = """
    John Doe
    john.doe@example.com
    (555) 123-4567
    Software engineer with 3 years of experience in JavaScript, React, Node.js, and MongoDB.
    Education: B.Tech in Computer Science 2020-2024.
    """
    response = client.post("/api/v1/resume/parse", json={"text": sample_text})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    profile = data["parsedProfile"]
    assert profile["email"] == "john.doe@example.com"
    assert "React" in profile["skills"]

def test_job_matching():
    payload = {
        "resumeProfile": {
            "skills": ["JavaScript", "React", "Node.js", "Docker"],
            "experienceYears": 2,
        },
        "job": {
            "title": "Junior Full Stack Developer",
            "company": "Tech Corp",
            "workMode": "Remote",
            "experienceLevel": "Entry-level",
            "skills": ["JavaScript", "React", "Node.js"],
            "description": "Building modern web apps",
        }
    }
    response = client.post("/api/v1/jobs/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["matchScore"] >= 70
    assert "copilotPitch" in data
