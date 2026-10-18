from fastapi import APIRouter, HTTPException
from app.schemas.roadmap import RoadmapRequest, RoadmapResponse
from app.workflows.roadmap_generator import run_roadmap_workflow

router = APIRouter(prefix="/career", tags=["Career"])

@router.post("/roadmap", response_model=RoadmapResponse)
async def generate_roadmap_endpoint(payload: RoadmapRequest):
    try:
        result = run_roadmap_workflow(payload.userProfile, payload.targetRole or "Full Stack Engineer")
        return RoadmapResponse(success=True, **result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation error: {str(e)}")
