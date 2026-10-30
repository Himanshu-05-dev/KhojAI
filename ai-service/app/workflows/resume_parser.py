import re
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
from app.schemas.resume import ParsedProfile, EducationItem, ExperienceItem, ProjectItem

COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R',
    'React', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Zustand', 'Bootstrap',
    'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails', 'MERN',
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'Qdrant', 'Pinecone', 'ChromaDB', 'FAISS',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux',
    'Git', 'GitHub', 'Postman', 'GraphQL', 'REST API', 'REST APIs', 'Microservices', 'WebSockets', 'OAuth', 'JWT',
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'LangChain', 'LangGraph',
    'Scikit-learn', 'Generative AI', 'Google Gemini API', 'Gemini', 'OpenAI', 'RAG', 'Hyperledger Fabric',
    'Data Structures & Algorithms', 'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks',
    'Agile', 'Scrum', 'Jira', 'TDD', 'Unit Testing', 'Jest', 'Cypress', 'Playwright',
]

class ParserState(TypedDict):
    raw_text: str
    filename: str
    contact: Dict[str, str]
    skills: List[str]
    experience_years: int
    education: List[Dict[str, Any]]
    work_experience: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    achievements: List[Dict[str, Any]]
    certifications: List[str]
    summary: str
    profile: Dict[str, Any]

def segment_sections(raw_text: str) -> Dict[str, List[str]]:
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    section_map = {
        'contact': [],
        'summary': [],
        'skills': [],
        'projects': [],
        'experience': [],
        'education': [],
        'certifications': [],
        'achievements': [],
    }

    headers = [
        ('summary', re.compile(r'^(summary|professional\s*summary|profile|about\s*me)\b', re.I)),
        ('skills', re.compile(r'^(technical\s*skills|skills|core\s*competencies|tech\s*stack|skills\s*&\s*tools)\b', re.I)),
        ('projects', re.compile(r'^(projects|key\s*projects|academic\s*projects|technical\s*projects)\b', re.I)),
        ('experience', re.compile(r'^(work\s*experience|experience|employment|professional\s*experience|internships?)\b', re.I)),
        ('education', re.compile(r'^(education|academic\s*background|academics|qualifications?)\b', re.I)),
        ('certifications', re.compile(r'^(certifications?|certificates|licenses)\b', re.I)),
        ('achievements', re.compile(r'^(achievements?|awards?|honors?|accomplishments?|extracurricular)\b', re.I)),
    ]

    current_sec = 'contact'
    for line in lines:
        matched = False
        if len(line) < 45:
            for sec_name, sec_regex in headers:
                if sec_regex.match(line):
                    current_sec = sec_name
                    matched = True
                    break
        if not matched:
            section_map[current_sec].append(line)

    return section_map

def extract_contact(state: ParserState) -> Dict[str, Any]:
    text = state["raw_text"]
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)

    name = ""
    for l in lines[:5]:
        if (
            len(l) > 2 and len(l) < 45 and
            '@' not in l and 'http' not in l and 'www' not in l and
            'linkedin' not in l.lower() and 'github' not in l.lower() and 'leetcode' not in l.lower() and
            not re.match(r'^(resume|cv|curriculum|summary|contact|profile|technical)', l, re.I) and
            not re.search(r'\d{4}', l)
        ):
            name = l
            break

    li_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_\-\./]+', text, re.I)
    linkedin_url = li_match.group(0).rstrip('/') if li_match else ""
    if linkedin_url and not linkedin_url.startswith('http'):
        linkedin_url = f"https://{linkedin_url}"

    gh_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_\-\./]+', text, re.I)
    github_url = gh_match.group(0).rstrip('/') if gh_match else ""
    if github_url and not github_url.startswith('http'):
        github_url = f"https://{github_url}"

    port_match = re.search(r'(?:https?://)?(?:www\.)?(?:leetcode\.com/(?:u/)?[a-zA-Z0-9_\-]+|[a-zA-Z0-9_-]+\.(?:dev|me|io|tech|app|site|xyz)(?:/[^\s|]*)?)', text, re.I)
    portfolio_url = port_match.group(0).rstrip('/') if port_match else ""
    if portfolio_url and not portfolio_url.startswith('http'):
        portfolio_url = f"https://{portfolio_url}"

    location = ""
    for l in lines[:5]:
        parts = re.split(r'[|•·;]', l)
        for p in parts:
            trimmed = p.strip()
            if (
                trimmed and len(trimmed) < 50 and ',' in trimmed and
                '@' not in trimmed and 'linkedin' not in trimmed.lower() and 'github' not in trimmed.lower() and
                not re.match(r'^\+?\d', trimmed) and not trimmed.lower().startswith('http')
            ):
                location = trimmed
                break
        if location:
            break

    return {
        "contact": {
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "name": name or "Candidate",
            "linkedinUrl": linkedin_url,
            "githubUrl": github_url,
            "portfolioUrl": portfolio_url,
            "location": location,
        }
    }

def extract_skills(state: ParserState) -> Dict[str, Any]:
    text = state.get("raw_text", "")
    sec_map = segment_sections(text)
    found = []
    seen = set()

    # 1. Section-based extraction (captures all skills in TECHNICAL SKILLS, SKILLS, etc.)
    for line in sec_map['skills']:
        content = line
        if ':' in content:
            content = content.split(':', 1)[1]
        tokens = re.split(r'[,|•·;]|\s+-\s+', content)
        for t in tokens:
            cleaned = re.sub(r'^[\s\*\-•·\(\)\[\]]+|[\s\*\-•·\(\)\[\]]+$', '', t).strip()
            if 1 <= len(cleaned) <= 45 and not re.match(r'^(etc\.?|and|including|tools?|languages?)$', cleaned, re.IGNORECASE):
                norm = cleaned.lower()
                if norm not in seen:
                    seen.add(norm)
                    found.append(cleaned)

    # 2. Dictionary-based scan across entire text
    for skill in COMMON_SKILLS:
        if skill.lower() in seen:
            continue
        if skill in ['C++', 'C#', '.NET']:
            pattern = rf'(?:\b|^){re.escape(skill)}(?!\w)'
        else:
            pattern = rf'\b{re.escape(skill)}\b'

        if re.search(pattern, text, re.IGNORECASE):
            seen.add(skill.lower())
            found.append(skill)

    return {"skills": found}

def extract_experience_education(state: ParserState) -> Dict[str, Any]:
    text = state["raw_text"]
    sec_map = segment_sections(text)

    # 1. Real Education Extraction
    edu = []
    for l in sec_map['education']:
        parts = [p.strip() for p in re.split(r'[|•]', l) if p.strip()]
        year_match = re.search(r'\b(19\d{2}|20\d{2})\b(?:\s*[-–to]+\s*(19\d{2}|20\d{2}|present))?', l, re.I)
        grade_match = re.search(r'(?:class\s*x(?:ii)?\s*[:=]?\s*[\d.]+%?|\b\d{1,2}(?:\.\d+)?%|cgpa\s*[:=]?\s*[\d.]+|\b\d{1,2}(?:\.\d+)?\s*percentile)', l, re.I)

        if len(parts) >= 2:
            inst = parts[0]
            deg = parts[1]
            extra = ' | '.join(parts[2:]) if len(parts) > 2 else ''
            field = ''
            if re.search(r'cse|computer|ai|ml|data|software|information', deg, re.I):
                field = 'Computer Science & Engineering'
            elif re.search(r'electrical|electronics', deg, re.I):
                field = 'Electronics & Communication'

            edu.append({
                'institution': inst,
                'degree': deg,
                'field': field,
                'startYear': year_match.group(1) if year_match else '',
                'endYear': year_match.group(2) if (year_match and year_match.group(2)) else (year_match.group(1) if year_match else ''),
                'grade': grade_match.group(0) if grade_match else (extra if '%' in extra else '')
            })
        elif len(l) > 8:
            edu.append({
                'institution': l,
                'degree': 'Degree / Qualification',
                'field': '',
                'startYear': year_match.group(1) if year_match else '',
                'endYear': year_match.group(2) if (year_match and year_match.group(2)) else (year_match.group(1) if year_match else ''),
                'grade': grade_match.group(0) if grade_match else ''
            })

    # 2. Real Work Experience Extraction
    work_exp = []
    current_job = None
    for line in sec_map['experience']:
        date_match = re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b.*?(?:[-–to]+\s*(\bjan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present\b))', line, re.I)
        if date_match and len(line) < 100:
            if current_job: work_exp.append(current_job)
            parts = [p.strip() for p in re.split(r'[|–\-•]', line) if p.strip()]
            current_job = {
                'role': parts[0] if parts else 'Software Engineer',
                'company': parts[1] if len(parts) > 1 else 'Company',
                'startDate': date_match.group(1),
                'endDate': date_match.group(2),
                'current': 'present' in date_match.group(2).lower(),
                'description': '',
                'highlights': []
            }
        elif current_job:
            clean = re.sub(r'^[•\-\*]\s*', '', line)
            if len(clean) > 10:
                current_job['highlights'].append(clean)
                if not current_job['description']:
                    current_job['description'] = clean
        elif len(line) < 70 and re.search(r'\b(intern|developer|engineer|analyst|associate|lead|trainee)\b', line, re.I):
            current_job = {
                'role': line,
                'company': '',
                'startDate': '',
                'endDate': '',
                'current': False,
                'description': '',
                'highlights': []
            }
    if current_job: work_exp.append(current_job)

    # 3. Real Projects Extraction
    projects = []
    cur_proj = None
    for l in sec_map['projects']:
        if ('|' in l or ' - ' in l) and len(l) < 130:
            if cur_proj: projects.append(cur_proj)
            parts = [p.strip() for p in re.split(r'[|]', l) if p.strip()]
            title_part = parts[0]
            tech_part = parts[1] if len(parts) > 1 else ''

            techs = [t.strip() for t in re.split(r'[,/]', tech_part) if t.strip()] if tech_part else []
            cur_proj = {
                'title': title_part,
                'description': '',
                'techStack': techs,
                'link': ''
            }
        elif cur_proj:
            cur_proj['description'] = (cur_proj['description'] + ' ' + l).strip()

    if cur_proj: projects.append(cur_proj)

    # 4. Real Achievements Extraction
    achievements = []
    for l in sec_map['achievements']:
        if re.search(r'\b\d+\s+of\s+\d+\b|page\s*\d+|^\s*[-•·*—\s]+\s*$', l, re.I):
            continue
        clean = re.sub(r'^[•\-\*·\s]+|^\d+[\.\)]\s+', '', l).strip()
        if len(clean) > 8:
            parts = [p.strip() for p in re.split(r'\s+[-–—]\s+', clean) if p.strip()]
            title = parts[0] if parts else clean[:60]
            desc = parts[1] if len(parts) > 1 else clean
            year = re.search(r'\b(20\d{2}|19\d{2})\b', clean)
            achievements.append({
                'title': title,
                'description': desc,
                'date': year.group(0) if year else '',
                'issuer': 'Hackathon / Competition / Academic'
            })

    # 5. Real Certifications Extraction
    certs = []
    for l in sec_map['certifications']:
        clean = re.sub(r'^[•\-\*·\s]+|^\d+[\.\)]\s+', '', l).strip()
        if len(clean) > 5:
            certs.append(clean)

    # Experience Years
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience', text, re.I)
    exp_years = int(exp_match.group(1)) if exp_match else len(work_exp)

    # Summary
    summary = " ".join(sec_map['summary']).strip()
    if not summary:
        skills = state.get("skills", [])
        skills_preview = ", ".join(skills[:5]) if skills else "modern technologies"
        summary = f"Results-driven technology professional skilled in {skills_preview}."

    return {
        "experience_years": exp_years,
        "education": edu,
        "work_experience": work_exp,
        "projects": projects,
        "achievements": achievements,
        "certifications": certs,
        "summary": summary,
    }

def synthesize_profile(state: ParserState) -> Dict[str, Any]:
    from app.clients.llm import llm_client

    skills = state.get("skills", [])
    summary = state.get("summary", "")

    # DeepSeek-R1 intelligent summary enhancement
    if (llm_client.nvidia_key or llm_client.openai_key or llm_client.openrouter_key) and not summary and skills:
        raw_snippet = state.get("raw_text", "")[:1000]
        prompt = (
            f"Candidate skills: {', '.join(skills[:8])}.\n"
            f"Resume excerpt:\n{raw_snippet}\n"
            f"Write a sharp 2-sentence executive career summary for their profile. Return only the summary text without think tags."
        )
        try:
            enhanced = llm_client.invoke(prompt)
            if enhanced and len(enhanced.strip()) > 30:
                summary = enhanced.strip()
        except Exception:
            pass

    profile = {
        "name": state["contact"]["name"] if state["contact"]["name"] != "Candidate" else "",
        "email": state["contact"]["email"],
        "phone": state["contact"]["phone"],
        "location": state["contact"].get("location", ""),
        "linkedinUrl": state["contact"].get("linkedinUrl", ""),
        "githubUrl": state["contact"].get("githubUrl", ""),
        "portfolioUrl": state["contact"].get("portfolioUrl", ""),
        "summary": summary,
        "skills": skills,
        "experienceYears": state.get("experience_years", 0),
        "education": state.get("education", []),
        "workExperience": state.get("work_experience", []),
        "projects": state.get("projects", []),
        "achievements": state.get("achievements", []),
        "certifications": state.get("certifications", []),
        "languages": ["English"] if skills else [],
    }
    return {"summary": summary, "profile": profile}

# Build LangGraph workflow
workflow = StateGraph(ParserState)
workflow.add_node("extract_contact", extract_contact)
workflow.add_node("extract_skills", extract_skills)
workflow.add_node("extract_exp_edu", extract_experience_education)
workflow.add_node("synthesize", synthesize_profile)

workflow.set_entry_point("extract_contact")
workflow.add_edge("extract_contact", "extract_skills")
workflow.add_edge("extract_skills", "extract_exp_edu")
workflow.add_edge("extract_exp_edu", "synthesize")
workflow.add_edge("synthesize", END)

resume_graph = workflow.compile()

def parse_resume_workflow(raw_text: str, filename: str = "resume.pdf") -> Dict[str, Any]:
    initial_state: ParserState = {
        "raw_text": raw_text,
        "filename": filename,
        "contact": {},
        "skills": [],
        "experience_years": 0,
        "education": [],
        "work_experience": [],
        "projects": [],
        "achievements": [],
        "certifications": [],
        "summary": "",
        "profile": {},
    }
    result = resume_graph.invoke(initial_state)
    return result["profile"]
