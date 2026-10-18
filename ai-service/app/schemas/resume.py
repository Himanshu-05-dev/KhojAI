from typing import List, Optional
from pydantic import BaseModel, Field

class EducationItem(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    startYear: Optional[str] = None
    endYear: Optional[str] = None
    grade: Optional[str] = None

class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    current: Optional[bool] = False
    description: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)

class ProjectItem(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    techStack: List[str] = Field(default_factory=list)
    link: Optional[str] = None

class ParsedProfile(BaseModel):
    name: Optional[str] = "Candidate"
    email: Optional[str] = ""
    phone: Optional[str] = ""
    summary: Optional[str] = ""
    skills: List[str] = Field(default_factory=list)
    experienceYears: int = 1
    education: List[EducationItem] = Field(default_factory=list)
    workExperience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)

class ParseResumeRequest(BaseModel):
    text: str
    filename: Optional[str] = "resume.pdf"

class ParseResumeResponse(BaseModel):
    success: bool = True
    parsedProfile: ParsedProfile
