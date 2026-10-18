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

    ratio = (len(matching) / len(job_skills)) if job_skills else 0.8
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

    composite = int(s * 0.50 + e * 0.25 + l * 0.15 + ed * 0.10)
    final_score = max(35, min(99, composite))

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

def generate_pitch(state: MatchState) -> Dict[str, Any]:
    matching = state.get("matching_skills", [])
    skills_text = ", ".join(matching[:3]) if matching else "modern software engineering"
    job_title = state["job"].get("title", "this position")
    company = state["job"].get("company", "your organization")

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
