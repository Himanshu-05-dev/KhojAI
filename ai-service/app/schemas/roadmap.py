from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class ResourceItem(BaseModel):
    title: str
    url: str
    type: str = "link"

class MilestoneItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    category: str = "project"
    status: str = "not_started"
    estimatedHours: int = 10
    resources: List[ResourceItem] = Field(default_factory=list)

class SkillGapItem(BaseModel):
    skill: str
    importance: str = "high"
    currentLevel: str = "beginner"
    targetLevel: str = "proficient"

class RoadmapRequest(BaseModel):
    userProfile: Dict = Field(default_factory=dict)
    targetRole: Optional[str] = "Full Stack Engineer"

class RoadmapResponse(BaseModel):
    success: bool = True
    targetRole: str
    overallProgress: int = 0
    skillGaps: List[SkillGapItem] = Field(default_factory=list)
    milestones: List[MilestoneItem] = Field(default_factory=list)
