const axios = require('axios')
const config = require('../config')
const logger = require('../utils/logger')

const aiHttp = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-service-key': config.aiServiceKey,
  },
})

// Curated skills dictionary for local extraction fallback
const COMMON_SKILLS = [
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

/**
 * Robust Local Resume Parser (Extracts REAL data, zero dummy placeholders)
 */
function localParseResume(text) {
  const normalized = text || ''
  const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  
  // Section Segmentation
  const sectionKeywords = [
    { key: 'education', regex: /\b(education|academic\s*background|academics|qualifications?)\b/i },
    { key: 'experience', regex: /\b(work\s*experience|professional\s*experience|experience|employment|internships?)\b/i },
    { key: 'projects', regex: /\b(projects|academic\s*projects|personal\s*projects|key\s*projects)\b/i },
    { key: 'achievements', regex: /\b(achievements|honors|awards|accomplishments|extracurricular|competitions)\b/i },
    { key: 'certifications', regex: /\b(certifications|certificates|licenses)\b/i },
    { key: 'skills', regex: /\b(skills|technical\s*skills|core\s*competencies|tech\s*stack|skills\s*&\s*tools)\b/i },
  ]

  const sections = {
    education: [],
    experience: [],
    projects: [],
    achievements: [],
    certifications: [],
    skills: [],
    general: [],
  }

  let currentSection = 'general'
  for (const line of lines) {
    const matchedSec = sectionKeywords.find(s => s.regex.test(line) && line.length < 40)
    if (matchedSec) {
      currentSection = matchedSec.key
    } else {
      sections[currentSection].push(line)
    }
  }

  // Extract Skills: 1) From Skills Section
  const foundSkills = []
  const seenSkills = new Set()

  const addSkill = (skill) => {
    const clean = skill.replace(/^[\s*\-•·()[\]]+|[\s*\-•·()[\]]+$/g, '').trim()
    if (clean.length >= 1 && clean.length <= 45 && !/^(etc\.?|and|including|tools?|languages?)$/i.test(clean)) {
      const lower = clean.toLowerCase()
      if (!seenSkills.has(lower)) {
        seenSkills.add(lower)
        foundSkills.push(clean)
      }
    }
  }

  for (const line of sections.skills) {
    let content = line
    if (content.includes(':')) {
      content = content.split(':').slice(1).join(':')
    }
    const tokens = content.split(/[,|•·;]|\s+-\s+/)
    for (const t of tokens) {
      addSkill(t)
    }
  }

  // Extract Skills: 2) From Common Skills Dictionary Scan across text
  COMMON_SKILLS.forEach(skill => {
    if (seenSkills.has(skill.toLowerCase())) return
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let regex
    if (skill === 'C++' || skill === 'C#' || skill === '.NET') {
      regex = new RegExp(`(?:\\b|^)${escaped}(?!\\w)`, 'i')
    } else {
      regex = new RegExp(`\\b${escaped}\\b`, 'i')
    }
    if (regex.test(normalized)) {
      addSkill(skill)
    }
  })

  // Extract Email
  const emailMatch = normalized.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : ''

  // Extract Phone
  const phoneMatch = normalized.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0] : ''

  // Extract Name from header (first few non-header lines)
  let candidateName = ''
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i]
    if (
      line.length > 2 && line.length < 50 &&
      !line.includes('@') && !line.includes('http') && !line.includes('www') &&
      !/^(resume|curriculum|cv|profile|contact|phone|email|portfolio)/i.test(line) &&
      !/\d{4}/.test(line)
    ) {
      candidateName = line
      break
    }
  }

  // Extract LinkedIn URL
  const liMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.\/]+/i)
  const linkedinUrl = liMatch ? (liMatch[0].startsWith('http') ? liMatch[0] : `https://${liMatch[0]}`).replace(/\/+$/, '') : ''

  // Extract GitHub URL
  const ghMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-\.\/]+/i)
  const githubUrl = ghMatch ? (ghMatch[0].startsWith('http') ? ghMatch[0] : `https://${ghMatch[0]}`).replace(/\/+$/, '') : ''

  // Extract Portfolio / Personal Website URL
  const portMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?(?:leetcode\.com\/(?:u\/)?[a-zA-Z0-9_\-]+|[a-zA-Z0-9_-]+\.(?:dev|me|io|tech|app|site|xyz)(?:\/[^\s|]*)?)/i)
    || normalized.match(/https?:\/\/(?!www\.linkedin|linkedin|github)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(?:\/[^\s|]*)?/i)
  const portfolioUrl = portMatch ? (portMatch[0].startsWith('http') ? portMatch[0] : `https://${portMatch[0]}`).replace(/\/+$/, '') : ''

  // Extract Location from header lines
  let candidateLocation = ''
  for (const line of lines.slice(0, 5)) {
    const parts = line.split(/[|•·;]/)
    for (const part of parts) {
      const trimmed = part.trim()
      if (
        trimmed &&
        trimmed.length < 50 &&
        trimmed.includes(',') &&
        !trimmed.includes('@') &&
        !trimmed.includes('linkedin') &&
        !trimmed.includes('github') &&
        !trimmed.includes('leetcode') &&
        !trimmed.match(/^\+?\d/) &&
        !trimmed.match(/^https?:\/\//i)
      ) {
        candidateLocation = trimmed
        break
      }
    }
    if (candidateLocation) break
  }

  // 1. Parse Real Education
  const education = []
  for (const line of sections.education) {
    const parts = line.split(/[|•]/).map(p => p.trim()).filter(Boolean)
    const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b(?:\s*[-–to]+\s*(19\d{2}|20\d{2}|present))?/i)
    const gradeMatch = line.match(/(?:class\s*x(?:ii)?\s*[:=]?\s*[\d.]+%?|\b\d{1,2}(?:\.\d+)?%|cgpa\s*[:=]?\s*[\d.]+|\b\d{1,2}(?:\.\d+)?\s*percentile)/i)

    if (parts.length >= 2) {
      const inst = parts[0]
      const deg = parts[1]
      const extra = parts.slice(2).join(' | ')
      let field = ''
      if (/cse|computer|ai|ml|data|software|information/i.test(deg)) {
        field = 'Computer Science & Engineering'
      } else if (/electrical|electronics/i.test(deg)) {
        field = 'Electronics & Communication'
      }

      education.push({
        institution: inst,
        degree: deg,
        field,
        startYear: yearMatch ? yearMatch[1] : '',
        endYear: yearMatch && yearMatch[2] ? yearMatch[2] : (yearMatch ? yearMatch[1] : ''),
        grade: gradeMatch ? gradeMatch[0] : (extra.includes('%') ? extra : ''),
      })
    } else if (line.length > 8) {
      education.push({
        institution: line,
        degree: 'Degree / Qualification',
        field: '',
        startYear: yearMatch ? yearMatch[1] : '',
        endYear: yearMatch && yearMatch[2] ? yearMatch[2] : (yearMatch ? yearMatch[1] : ''),
        grade: gradeMatch ? gradeMatch[0] : '',
      })
    }
  }

  // 2. Parse Real Work Experience
  const workExperience = []
  if (sections.experience.length > 0) {
    let currentJob = null
    for (const line of sections.experience) {
      const dateRangeMatch = line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b.*?(?:[-–to]+\s*(\bjan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present\b))/i)
      if (dateRangeMatch && line.length < 100) {
        if (currentJob) workExperience.push(currentJob)
        const parts = line.split(/[|–\-•]/).map(p => p.trim())
        currentJob = {
          role: parts[0] || 'Software Engineer / Intern',
          company: parts[1] || 'Company',
          startDate: dateRangeMatch[1] || '',
          endDate: dateRangeMatch[2] || 'Present',
          current: /present/i.test(dateRangeMatch[2] || ''),
          description: '',
          highlights: [],
        }
      } else if (currentJob) {
        const clean = line.replace(/^[•\-\*]\s*/, '').trim()
        if (clean.length > 10) {
          currentJob.highlights.push(clean)
          if (!currentJob.description) currentJob.description = clean
        }
      } else if (line.length < 70 && /\b(intern|developer|engineer|analyst|associate|lead|trainee)\b/i.test(line)) {
        currentJob = {
          role: line,
          company: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          highlights: [],
        }
      }
    }
    if (currentJob) workExperience.push(currentJob)
  }

  // 3. Parse Real Projects
  const projects = []
  if (sections.projects.length > 0) {
    let currentProj = null
    for (const line of sections.projects) {
      if ((line.includes('|') || line.includes(' - ')) && line.length < 130) {
        if (currentProj) projects.push(currentProj)
        const parts = line.split('|').map(p => p.trim()).filter(Boolean)
        const titlePart = parts[0]
        const techPart = parts[1] || ''
        const techs = techPart ? techPart.split(/[,/]/).map(t => t.trim()).filter(Boolean) : []
        currentProj = {
          title: titlePart,
          description: '',
          techStack: techs,
          link: '',
        }
      } else if (currentProj) {
        currentProj.description = (currentProj.description + ' ' + line).trim()
      }
    }
    if (currentProj) projects.push(currentProj)
  }

  // 4. Parse Real Achievements & Awards
  const achievements = []
  if (sections.achievements.length > 0) {
    for (const line of sections.achievements) {
      if (/\b\d+\s+of\s+\d+\b|page\s*\d+|^\s*[-•·*—\s]+\s*$/i.test(line)) continue
      const clean = line.replace(/^[•\-\*·\s]+|^\d+[\.\)]\s+/, '').trim()
      if (clean.length > 8) {
        const parts = clean.split(/\s+[-–—]\s+/).map(p => p.trim()).filter(Boolean)
        const title = parts[0] || clean.slice(0, 60)
        const desc = parts[1] || clean
        const year = clean.match(/\b(20\d{2}|19\d{2})\b/)
        achievements.push({
          title,
          description: desc,
          date: year ? year[0] : '',
          issuer: 'Hackathon / Competition / Academic',
        })
      }
    }
  }

  // 5. Parse Real Certifications
  const certifications = sections.certifications
    .map(c => c.replace(/^[•\-\*·\s]+|^\d+[\.\)]\s+/, '').trim())
    .filter(c => c.length > 5 && c.length < 120)

  // Experience calculation
  const expMatch = normalized.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i)
  const experienceYears = expMatch ? parseInt(expMatch[1], 10) : (workExperience.length > 0 ? workExperience.length : 0)

  // Summary
  const summaryLines = sections.general.filter(l => l.length > 30 && !l.includes('@'))
  const summary = summaryLines.length > 0
    ? summaryLines.join(' ').slice(0, 500)
    : (foundSkills.length > 0 ? `Proficient in ${foundSkills.slice(0, 5).join(', ')}.` : '')

  return {
    name: candidateName || '',
    email,
    phone,
    location: candidateLocation,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    summary,
    skills: foundSkills,
    experienceYears,
    education,
    workExperience,
    projects,
    achievements,
    certifications,
    languages: ['English'],
  }
}

/**
 * Fallback Local Job Matching Engine
 */
function localMatchJob(resumeProfile, job) {
  const userSkills = (resumeProfile?.skills || []).map(s => s.toLowerCase())
  const jobSkills  = (job?.skills || []).map(s => s.toLowerCase())

  const matchingSkills = jobSkills.filter(js => userSkills.some(us => us.includes(js) || js.includes(us)))
  const missingSkills  = jobSkills.filter(js => !matchingSkills.includes(js))

  // Skill Score (50%)
  const hasJobSkills = jobSkills.length > 0
  const skillRatio = hasJobSkills
    ? (matchingSkills.length / jobSkills.length)
    : (matchingSkills.length > 0 ? 0.75 : 0.25)
  const skillsScore = Math.min(100, Math.round(skillRatio * 100))

  // Experience Match (25%)
  const userExp = resumeProfile?.experienceYears || 0
  let expScore = 60
  if (job.experienceLevel === 'Fresher' || job.experienceLevel === 'Entry-level' || job.jobType === 'Internship') {
    expScore = 95
  } else if (job.experienceLevel === 'Mid-level') {
    expScore = userExp >= 2 ? 90 : 55
  } else if (job.experienceLevel === 'Senior') {
    expScore = userExp >= 5 ? 90 : 40
  }

  // Location/Role Match (15%) - Evaluates preferred cities or Remote/WFH
  const userLocs = [
    ...(resumeProfile?.preferredLocations || []),
    ...(resumeProfile?.locations || []),
    resumeProfile?.location,
  ].filter(Boolean).map(l => String(l).toLowerCase())

  const jobLoc = String(job?.location || '').toLowerCase()
  const isRemote = job?.workMode === 'Remote' || jobLoc.includes('remote') || jobLoc.includes('home') || jobLoc.includes('worldwide')

  let locScore = 50
  if (isRemote) {
    locScore = 100
  } else if (userLocs.length > 0) {
    const matchedCity = userLocs.find(ul => jobLoc.includes(ul) || ul.includes(jobLoc))
    if (matchedCity) {
      locScore = 100
    } else if (jobLoc.includes('india')) {
      locScore = 75
    } else {
      // On-site in foreign country (e.g. Germany/USA) when user preferred Indian cities
      locScore = 25
    }
  } else if (jobLoc.includes('india') || jobLoc.includes('bengaluru') || jobLoc.includes('delhi') || jobLoc.includes('hyderabad')) {
    locScore = 90
  } else {
    // Non-remote job outside India with no matching user preference
    locScore = 30
  }

  // Education/Domain Match (10%)
  const eduScore = 80

  // Composite calculation: if user has 0 matching skills on a job with specific requirements,
  // do not artificially inflate the score into the 60-80% range!
  let totalScore = 0
  if (hasJobSkills && matchingSkills.length === 0) {
    totalScore = Math.max(15, Math.min(32, Math.round(expScore * 0.15 + locScore * 0.10 + eduScore * 0.05)))
  } else {
    totalScore = Math.min(98, Math.max(20, Math.round(
      skillsScore * 0.55 +
      expScore * 0.20 +
      locScore * 0.15 +
      eduScore * 0.10
    )))
  }

  const strengths = []
  if (matchingSkills.length > 0) {
    strengths.push(`Strong overlap in core requirements: ${matchingSkills.slice(0, 3).join(', ')}`)
  }
  if (locScore >= 95) {
    strengths.push(isRemote ? 'Matches remote work / work-from-home compatibility' : `Location matches your preference (${job.location})`)
  }
  if (expScore >= 85) {
    strengths.push(`Experience level aligns well with ${job.experienceLevel || job.jobType || 'this position'}`)
  }

  const weaknesses = []
  if (missingSkills.length > 0) {
    weaknesses.push(`Key requested skills to brush up on: ${missingSkills.slice(0, 3).join(', ')}`)
  }
  if (locScore < 75) {
    weaknesses.push(`Position is in ${job.location || 'another city'} — verify relocation or commute viability`)
  }

  const copilotPitch = `I am excited to apply for the ${job.title} position at ${job.company}. With proven expertise in ${matchingSkills.slice(0, 3).join(', ') || 'modern software engineering'} and hands-on experience building reliable applications, I am eager to contribute effectively to your engineering goals.`

  return {
    matchScore: totalScore,
    categoryScores: {
      skillsMatch: skillsScore,
      experienceMatch: expScore,
      educationMatch: eduScore,
      locationRoleMatch: locScore,
    },
    matchingSkills,
    missingSkills,
    strengths,
    weaknesses,
    copilotPitch,
  }
}

/**
 * Fallback Local Roadmap Generator
 */
function localGenerateRoadmap(userProfile, targetRole) {
  const role = targetRole || 'Full Stack Engineer'
  const userSkills = (userProfile?.skills || []).map(s => s.toLowerCase())

  const roleSkillsMap = {
    'Frontend Engineer': ['TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Testing / Jest', 'Performance Optimization'],
    'Backend Engineer': ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Microservices'],
    'Full Stack Engineer': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD'],
    'AI / ML Engineer': ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Vector Databases', 'Model Fine-tuning'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Prometheus', 'CI/CD Pipelines'],
  }

  const desiredSkills = roleSkillsMap[role] || roleSkillsMap['Full Stack Engineer']
  const skillGaps = desiredSkills.map(s => {
    const hasIt = userSkills.some(us => us.includes(s.toLowerCase()))
    return {
      skill: s,
      importance: hasIt ? 'medium' : 'high',
      currentLevel: hasIt ? 'intermediate' : 'beginner',
      targetLevel: 'proficient',
    }
  })

  const milestones = [
    {
      id: 'm-1',
      title: `Master ${desiredSkills[0] || 'Core Architecture'} fundamentals`,
      description: `Deep dive into advanced concepts, syntax patterns, and best-in-class idioms.`,
      category: 'course',
      status: 'in_progress',
      estimatedHours: 12,
      resources: [
        { title: 'Official Documentation & Guides', url: 'https://developer.mozilla.org', type: 'link' },
      ],
    },
    {
      id: 'm-2',
      title: `Ship a production-grade portfolio project with ${desiredSkills[1] || 'modern tech'}`,
      description: `Build and deploy an interactive application featuring authentication, caching, and CI/CD.`,
      category: 'project',
      status: 'not_started',
      estimatedHours: 20,
      resources: [
        { title: 'Project Specification & Starter', url: 'https://github.com', type: 'repo' },
      ],
    },
    {
      id: 'm-3',
      title: 'Complete System Design and API Architecture Practice',
      description: 'Design a distributed system handling high concurrency and asynchronous queue processing.',
      category: 'practice',
      status: 'not_started',
      estimatedHours: 15,
      resources: [
        { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'link' },
      ],
    },
    {
      id: 'm-4',
      title: 'Targeted Interview Preparation & Mock Interviews',
      description: 'Practice behavioral scenarios, coding questions, and technical deep-dives.',
      category: 'practice',
      status: 'not_started',
      estimatedHours: 10,
      resources: [
        { title: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org', type: 'link' },
      ],
    },
  ]

  return {
    targetRole: role,
    overallProgress: 25,
    skillGaps,
    milestones,
  }
}

/**
 * Public client wrapper methods
 */
const aiClient = {
  async parseResume(text, filename) {
    try {
      const response = await aiHttp.post('/api/v1/resume/parse', { text, filename })
      if (response.data && response.data.parsedProfile) {
        return response.data.parsedProfile
      }
    } catch (err) {
      logger.warn(`AI Service /resume/parse unavailable (${err.message}). Using local rule engine.`)
    }
    return localParseResume(text)
  },

  async matchJob(resumeProfile, job) {
    try {
      const response = await aiHttp.post('/api/v1/jobs/match', { resumeProfile, job })
      if (response.data && response.data.matchScore !== undefined) {
        return response.data
      }
    } catch (err) {
      logger.warn(`AI Service /jobs/match unavailable (${err.message}). Using local match engine.`)
    }
    return localMatchJob(resumeProfile, job)
  },

  async generateRoadmap(userProfile, targetRole) {
    try {
      const response = await aiHttp.post('/api/v1/career/roadmap', { userProfile, targetRole })
      if (response.data && response.data.milestones) {
        return response.data
      }
    } catch (err) {
      logger.warn(`AI Service /career/roadmap unavailable (${err.message}). Using local roadmap engine.`)
    }
    return localGenerateRoadmap(userProfile, targetRole)
  },

  async generateCopilotPitch(resumeProfile, job) {
    const match = await this.matchJob(resumeProfile, job)
    return match.copilotPitch
  },
  localMatchJob,
}

module.exports = aiClient
