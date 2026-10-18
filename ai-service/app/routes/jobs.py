from fastapi import APIRouter, HTTPException
from app.schemas.job import MatchJobRequest, MatchJobResponse
from app.workflows.job_matcher import run_match_workflow

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/match", response_model=MatchJobResponse)
async def match_job_endpoint(payload: MatchJobRequest):
    try:
        job_dict = payload.job.model_dump()
        result = run_match_workflow(payload.resumeProfile, job_dict)
        return MatchJobResponse(success=True, **result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job matching error: {str(e)}")
