from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class JobInput(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    workMode: Optional[str] = "Remote"
    jobType: Optional[str] = "Full-time"
    experienceLevel: Optional[str] = "Fresher"
    skills: List[str] = Field(default_factory=list)
    description: Optional[str] = ""

class MatchJobRequest(BaseModel):
    resumeProfile: Dict
    job: JobInput

class CategoryScores(BaseModel):
    skillsMatch: int = 0
    experienceMatch: int = 0
    educationMatch: int = 0
    locationRoleMatch: int = 0

class MatchJobResponse(BaseModel):
    success: bool = True
    matchScore: int
    categoryScores: CategoryScores
    matchingSkills: List[str] = Field(default_factory=list)
    missingSkills: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    copilotPitch: str
