from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END

class MatchState(TypedDict):
    resume_profile: Dict[str, Any]
    job: Dict[str, Any]
    matching_skills: List[str]
    missing_skills: List[str]
    skills_score: int
    exp_score: int
    loc_score: int
    edu_score: int
    final_score: int
    strengths: List[str]
    weaknesses: List[str]
    copilot_pitch: str

def compare_skills(state: MatchState) -> Dict[str, Any]:
    resume_skills = [s.lower() for s in state["resume_profile"].get("skills", [])]
    job_skills = [s.lower() for s in state["job"].get("skills", [])]

    matching = [js for js in job_skills if any(js in us or us in js for us in resume_skills)]
    missing = [js for js in job_skills if js not in matching]

    ratio = (len(matching) / len(job_skills)) if job_skills else (0.75 if matching else 0.25)
    score = min(100, int(ratio * 100))

    return {
        "matching_skills": matching,
        "missing_skills": missing,
        "skills_score": score,
    }

def evaluate_experience(state: MatchState) -> Dict[str, Any]:
    user_exp = state["resume_profile"].get("experienceYears", 1)
    req_level = state["job"].get("experienceLevel", "Fresher")

    if req_level in ["Fresher", "Entry-level"]:
        score = 95
    elif req_level == "Mid-level":
        score = 90 if user_exp >= 2 else 65
    elif req_level == "Senior":
        score = 90 if user_exp >= 5 else 50
    else:
        score = 80

    return {"exp_score": score, "edu_score": 85}

def assess_location_role(state: MatchState) -> Dict[str, Any]:
    work_mode = state["job"].get("workMode", "Remote")
    loc_score = 95 if work_mode == "Remote" else 80
    return {"loc_score": loc_score}

def compute_composite_score(state: MatchState) -> Dict[str, Any]:
    s = state["skills_score"]
    e = state["exp_score"]
    l = state["loc_score"]
    ed = state["edu_score"]

    # If candidate matches 0 required skills, do not falsely inflate score into 60-80%
    if s == 0 and state.get("missing_skills"):
        final_score = max(15, min(32, int(e * 0.15 + l * 0.10 + ed * 0.05)))
    else:
        composite = int(s * 0.55 + e * 0.20 + l * 0.15 + ed * 0.10)
        final_score = max(20, min(98, composite))

    strengths = []
    if state["matching_skills"]:
        strengths.append(f"Strong overlap in core requirements: {', '.join(state['matching_skills'][:3])}")
    if e >= 80:
        strengths.append(f"Experience level aligns well with {state['job'].get('experienceLevel', 'this position')}")
    if state['job'].get('workMode') == 'Remote':
        strengths.append("Matches remote work compatibility")

    weaknesses = []
    if state["missing_skills"]:
        weaknesses.append(f"Key requested skills to brush up on: {', '.join(state['missing_skills'][:3])}")
    if e < 70:
        weaknesses.append("Position may require deeper domain tenure than listed on current resume")

    return {
        "final_score": final_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
    }

from app.clients.llm import llm_client
import logging

logger = logging.getLogger(__name__)

def deep_llm_match_score(resume_profile: Dict[str, Any], job: Dict[str, Any], baseline: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not (llm_client.nvidia_key or llm_client.openai_key or llm_client.openrouter_key):
        return None

    candidate_skills = resume_profile.get("skills", [])
    candidate_exp = resume_profile.get("experienceYears", 0)
    candidate_summary = resume_profile.get("summary", "")

    job_title = job.get("title", "")
    company = job.get("company", "")
    job_skills = job.get("skills", [])
    job_exp = job.get("experienceLevel", "Entry-level")
    job_desc = (job.get("description") or "")[:700]

    prompt = (
        f"You are an expert technical talent evaluator. Evaluate this candidate's match for the role.\n\n"
        f"JOB POSTING:\n"
        f"- Role: {job_title} at {company}\n"
        f"- Required Skills: {', '.join(job_skills) if job_skills else 'General Software Engineering'}\n"
        f"- Required Level: {job_exp}\n"
        f"- Description: {job_desc}\n\n"
        f"CANDIDATE PROFILE:\n"
        f"- Skills: {', '.join(candidate_skills) if candidate_skills else 'Not specified'}\n"
        f"- Experience: {candidate_exp} years\n"
        f"- Summary: {candidate_summary}\n\n"
        f"Analyze their technical and domain fit. Return ONLY a single JSON object with these exact keys:\n"
        f"{{\n"
        f'  "skillsScore": <0-100 integer>,\n'
        f'  "experienceScore": <0-100 integer>,\n'
        f'  "educationScore": <0-100 integer>,\n'
        f'  "locationScore": <0-100 integer>,\n'
        f'  "overallScore": <0-100 integer>,\n'
        f'  "strengths": ["<concise strength 1>", "<concise strength 2>"],\n'
        f'  "missingSkills": ["<skill 1>", "<skill 2>"],\n'
        f'  "copilotPitch": "<A compelling 3-sentence application pitch for the hiring manager>"\n'
        f"}}"
    )

    try:
        data = llm_client.extract_json(prompt)
        if data and isinstance(data, dict) and "overallScore" in data:
            return data
    except Exception as e:
        logger.warning(f"LLM match scoring notice: {e}")
    return None

def generate_pitch(state: MatchState) -> Dict[str, Any]:
    matching = state.get("matching_skills", [])
    skills_text = ", ".join(matching[:3]) if matching else "modern software engineering"
    job_title = state["job"].get("title", "this position")
    company = state["job"].get("company", "your organization")
    desc = (state["job"].get("description") or "")[:800]

    if llm_client.nvidia_key or llm_client.openai_key:
        prompt = (
            f"Write a compelling 3-sentence application pitch for a candidate applying to {company} for the {job_title} role.\n"
            f"Key matching skills: {skills_text}.\n"
            f"Job summary: {desc}\n"
            f"Make it professional, confident, and focused on value delivery. Return only the pitch text."
        )
        try:
            pitch = llm_client.invoke(prompt)
            if pitch and len(pitch.strip()) > 30:
                return {"copilot_pitch": pitch.strip()}
        except Exception:
            pass

    pitch = (
        f"I am excited to apply for the {job_title} role at {company}. "
        f"With hands-on proficiency in {skills_text} and a consistent focus on delivering "
        f"high-quality, performant applications, I am well-positioned to contribute immediately to your product roadmap."
    )
    return {"copilot_pitch": pitch}

# Build LangGraph workflow
workflow = StateGraph(MatchState)
workflow.add_node("compare_skills", compare_skills)
workflow.add_node("evaluate_experience", evaluate_experience)
workflow.add_node("assess_location", assess_location_role)
workflow.add_node("compute_score", compute_composite_score)
workflow.add_node("generate_pitch", generate_pitch)

workflow.set_entry_point("compare_skills")
workflow.add_edge("compare_skills", "evaluate_experience")
workflow.add_edge("evaluate_experience", "assess_location")
workflow.add_edge("assess_location", "compute_score")
workflow.add_edge("compute_score", "generate_pitch")
workflow.add_edge("generate_pitch", END)

job_matching_graph = workflow.compile()

def run_match_workflow(resume_profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    initial_state: MatchState = {
        "resume_profile": resume_profile,
        "job": job,
        "matching_skills": [],
        "missing_skills": [],
        "skills_score": 0,
        "exp_score": 0,
        "loc_score": 0,
        "edu_score": 0,
        "final_score": 0,
        "strengths": [],
        "weaknesses": [],
        "copilot_pitch": "",
    }
    res = job_matching_graph.invoke(initial_state)

    # DeepSeek-R1 / High-Parameter Semantic Scoring Evaluation
    llm_eval = deep_llm_match_score(resume_profile, job, res)
    if llm_eval:
        overall = int(llm_eval.get("overallScore") or res["final_score"])
        s_score = int(llm_eval.get("skillsScore") or res["skills_score"])
        e_score = int(llm_eval.get("experienceScore") or res["exp_score"])
        ed_score = int(llm_eval.get("educationScore") or res["edu_score"])
        l_score = int(llm_eval.get("locationScore") or res["loc_score"])
        strengths = llm_eval.get("strengths") or res["strengths"]
        missing = llm_eval.get("missingSkills") or res["missing_skills"]
        pitch = llm_eval.get("copilotPitch") or res["copilot_pitch"]

        return {
            "matchScore": min(98, max(15, overall)),
            "categoryScores": {
                "skillsMatch": min(100, max(10, s_score)),
                "experienceMatch": min(100, max(10, e_score)),
                "educationMatch": min(100, max(10, ed_score)),
                "locationRoleMatch": min(100, max(10, l_score)),
            },
            "matchingSkills": res["matching_skills"],
            "missingSkills": missing if isinstance(missing, list) else res["missing_skills"],
            "strengths": strengths if isinstance(strengths, list) else [str(strengths)],
            "weaknesses": res["weaknesses"],
            "copilotPitch": pitch,
        }

    return {
        "matchScore": res["final_score"],
        "categoryScores": {
            "skillsMatch": res["skills_score"],
            "experienceMatch": res["exp_score"],
            "educationMatch": res["edu_score"],
            "locationRoleMatch": res["loc_score"],
        },
        "matchingSkills": res["matching_skills"],
        "missingSkills": res["missing_skills"],
        "strengths": res["strengths"],
        "weaknesses": res["weaknesses"],
        "copilotPitch": res["copilot_pitch"],
    }
