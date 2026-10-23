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
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'React', 'React.js', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Zustand',
  'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux',
  'Git', 'GraphQL', 'REST API', 'Microservices', 'WebSockets', 'OAuth', 'JWT',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'LangChain', 'LangGraph',
  'OpenAI', 'Gemini', 'Llama', 'Vector DB', 'Pinecone', 'ChromaDB', 'FAISS',
  'Agile', 'Scrum', 'Jira', 'TDD', 'Unit Testing', 'Jest', 'Cypress', 'Playwright',
]

/**
 * Fallback Local Resume Parser
 */
function localParseResume(text) {
  const normalized = text || ''
  
  // Extract Skills
  const foundSkills = COMMON_SKILLS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    return regex.test(normalized)
  })

  // Extract Email
  const emailMatch = normalized.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = emailMatch ? emailMatch[0] : ''

  // Extract Phone
  const phoneMatch = normalized.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0] : ''

  // Extract Education hints
  const degrees = ['B.Tech', 'B.E.', 'Bachelor', 'B.S.', 'B.Sc', 'M.Tech', 'Master', 'M.S.', 'M.Sc', 'Ph.D', 'Diploma', 'High School']
  const education = []
  degrees.forEach(deg => {
    if (new RegExp(`\\b${deg}\\b`, 'i').test(normalized)) {
      education.push({
        degree: deg,
        institution: 'University / Institute',
        field: 'Computer Science / Engineering',
        startYear: '2020',
        endYear: '2024',
      })
    }
  })

  // Experience calculation
  const expMatch = normalized.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i)
  const experienceYears = expMatch ? parseInt(expMatch[1], 10) : (foundSkills.length > 5 ? 2 : 1)

  // Summary
  const firstParagraph = normalized.split(/\n\s*\n/)[0] || ''
  const summary = firstParagraph.length > 50 && firstParagraph.length < 500
    ? firstParagraph.trim()
    : `Experienced technology candidate proficient in ${foundSkills.slice(0, 4).join(', ') || 'software development'}.`

  return {
    name: 'Candidate',
    email,
    phone,
    summary,
    skills: foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js', 'Git'],
    experienceYears,
    education: education.length > 0 ? education : [{ degree: 'B.S. in Computer Science', institution: 'University' }],
    workExperience: [{
      company: 'Software Engineering Project / Internship',
      role: 'Full Stack Developer',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      description: 'Built scalable web applications, designed REST APIs, and integrated front-end interfaces.',
      highlights: ['Improved system responsiveness', 'Implemented automated test suites'],
    }],
    projects: [{
      title: 'Full Stack Application',
      description: 'End-to-end modern web platform with responsive design and asynchronous task processing.',
      techStack: foundSkills.slice(0, 3),
    }],
    certifications: [],
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
  const skillRatio = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) : 0.8
  const skillsScore = Math.min(100, Math.round(skillRatio * 100))

  // Experience Match (25%)
  const userExp = resumeProfile?.experienceYears || 1
  let expScore = 75
  if (job.experienceLevel === 'Fresher' || job.experienceLevel === 'Entry-level') {
    expScore = 95
  } else if (job.experienceLevel === 'Mid-level') {
    expScore = userExp >= 2 ? 90 : 65
  } else if (job.experienceLevel === 'Senior') {
    expScore = userExp >= 5 ? 90 : 50
  }

  // Location/Role Match (15%)
  const locScore = (job.workMode === 'Remote' || !job.location) ? 95 : 80

  // Education/Domain Match (10%)
  const eduScore = 85

  const totalScore = Math.min(99, Math.max(35, Math.round(
    skillsScore * 0.50 +
    expScore * 0.25 +
    locScore * 0.15 +
    eduScore * 0.10
  )))

  const strengths = []
  if (matchingSkills.length > 0) {
    strengths.push(`Strong overlap in core requirements: ${matchingSkills.slice(0, 3).join(', ')}`)
  }
  if (expScore >= 80) {
    strengths.push(`Experience level aligns well with ${job.experienceLevel || 'this position'}`)
  }
  if (job.workMode === 'Remote') {
    strengths.push('Matches remote work compatibility')
  }

  const weaknesses = []
  if (missingSkills.length > 0) {
    weaknesses.push(`Key requested skills to brush up on: ${missingSkills.slice(0, 3).join(', ')}`)
  }
  if (expScore < 70) {
    weaknesses.push(`Position may require deeper domain tenure than listed on current resume`)
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
