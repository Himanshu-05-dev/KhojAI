from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END

ROLE_SKILL_MAP = {
    'Frontend Engineer': ['TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Testing / Jest', 'Performance Optimization'],
    'Backend Engineer': ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Microservices'],
    'Full Stack Engineer': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD'],
    'AI / ML Engineer': ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Vector Databases', 'Model Fine-tuning'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Prometheus', 'CI/CD Pipelines'],
}

class RoadmapState(TypedDict):
    user_profile: Dict[str, Any]
    target_role: str
    skill_gaps: List[Dict[str, Any]]
    milestones: List[Dict[str, Any]]
    overall_progress: int

def analyze_skill_gaps(state: RoadmapState) -> Dict[str, Any]:
    role = state["target_role"] or "Full Stack Engineer"
    skills_needed = ROLE_SKILL_MAP.get(role, ROLE_SKILL_MAP['Full Stack Engineer'])

    user_skills = [s.lower() for s in state["user_profile"].get("skills", [])]

    gaps = []
    for skill in skills_needed:
        has_skill = any(skill.lower() in us for us in user_skills)
        gaps.append({
            "skill": skill,
            "importance": "medium" if has_skill else "high",
            "currentLevel": "intermediate" if has_skill else "beginner",
            "targetLevel": "proficient",
        })

    return {"skill_gaps": gaps}

def structure_milestones(state: RoadmapState) -> Dict[str, Any]:
    role = state["target_role"]
    gaps = state.get("skill_gaps", [])
    primary_skill = gaps[0]["skill"] if gaps else "Core Technologies"
    secondary_skill = gaps[1]["skill"] if len(gaps) > 1 else "Modern Frameworks"

    milestones = [
        {
            "id": "ms-1",
            "title": f"Deep Dive into Advanced {primary_skill}",
            "description": f"Master modern idioms, asynchronous patterns, and testing principles in {primary_skill}.",
            "category": "course",
            "status": "in_progress",
            "estimatedHours": 14,
            "resources": [
                {"title": f"{primary_skill} Documentation & Advanced Guides", "url": "https://developer.mozilla.org", "type": "link"},
            ],
        },
        {
            "id": "ms-2",
            "title": f"Build Full-Featured Project using {secondary_skill}",
            "description": f"Architect and deploy a production application utilizing {secondary_skill} with state persistence.",
            "category": "project",
            "status": "not_started",
            "estimatedHours": 24,
            "resources": [
                {"title": "Open Source Reference Repositories", "url": "https://github.com", "type": "repo"},
            ],
        },
        {
            "id": "ms-3",
            "title": f"System Design & Scalability Preparation for {role}",
            "description": "Practice distributed system architectures, caching strategies, and database indexing.",
            "category": "practice",
            "status": "not_started",
            "estimatedHours": 16,
            "resources": [
                {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "link"},
            ],
        },
        {
            "id": "ms-4",
            "title": "Technical Interview Drills & Mock Behavioral Questions",
            "description": "Simulate technical interviews, refine elevator pitch, and prepare STAR method responses.",
            "category": "practice",
            "status": "not_started",
            "estimatedHours": 10,
            "resources": [
                {"title": "Tech Interview Handbook", "url": "https://www.techinterviewhandbook.org", "type": "link"},
            ],
        },
    ]

    return {"milestones": milestones, "overall_progress": 25}

# Build LangGraph workflow
workflow = StateGraph(RoadmapState)
workflow.add_node("analyze_gaps", analyze_skill_gaps)
workflow.add_node("structure_milestones", structure_milestones)

workflow.set_entry_point("analyze_gaps")
workflow.add_edge("analyze_gaps", "structure_milestones")
workflow.add_edge("structure_milestones", END)

roadmap_graph = workflow.compile()

def run_roadmap_workflow(user_profile: Dict[str, Any], target_role: str) -> Dict[str, Any]:
    initial_state: RoadmapState = {
        "user_profile": user_profile,
        "target_role": target_role,
        "skill_gaps": [],
        "milestones": [],
        "overall_progress": 0,
    }
    res = roadmap_graph.invoke(initial_state)

    return {
        "targetRole": target_role,
        "overallProgress": res["overall_progress"],
        "skillGaps": res["skill_gaps"],
        "milestones": res["milestones"],
    }
