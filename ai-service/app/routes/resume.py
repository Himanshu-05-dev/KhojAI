from fastapi import APIRouter, HTTPException
from app.schemas.resume import ParseResumeRequest, ParseResumeResponse, ParsedProfile
from app.workflows.resume_parser import parse_resume_workflow

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/parse", response_model=ParseResumeResponse)
async def parse_resume_endpoint(payload: ParseResumeRequest):
    try:
        profile_data = parse_resume_workflow(payload.text, payload.filename or "resume.pdf")
        return ParseResumeResponse(success=True, parsedProfile=ParsedProfile(**profile_data))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing error: {str(e)}")
