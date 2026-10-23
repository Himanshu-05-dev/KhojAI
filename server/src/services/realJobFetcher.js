const axios   = require('axios')
const Job     = require('../models/Job')
const logger  = require('../utils/logger')

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift', 'Next.js', 'Vue', 'Angular', 'Tailwind CSS',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'GraphQL', 'REST API', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Linux',
  'Machine Learning', 'AI', 'NLP', 'PyTorch', 'TensorFlow', 'CI/CD', 'HTML', 'CSS'
]

function cleanHtml(html = '') {
  if (!html) return ''
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()
}

function extractSkills(text = '', existingTags = []) {
  const set = new Set()
  const lowerText = text.toLowerCase()

  for (const tag of existingTags) {
    if (tag && typeof tag === 'string') {
      const match = KNOWN_SKILLS.find(k => k.toLowerCase() === tag.trim().toLowerCase())
      if (match) set.add(match)
      else if (tag.length < 25) set.add(tag.trim())
    }
  }

  for (const skill of KNOWN_SKILLS) {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (pattern.test(lowerText)) {
      set.add(skill)
    }
  }

  if (set.size === 0) {
    set.add('Software Engineering')
    set.add('Git')
  }

  return Array.from(set).slice(0, 10)
}

function detectJobType(title = '', tags = [], rawJobType = '') {
  const combined = `${title} ${tags.join(' ')} ${rawJobType}`.toLowerCase()
  if (combined.includes('intern') || combined.includes('co-op') || combined.includes('praktik') || combined.includes('trainee') || combined.includes('working student')) {
    return 'Internship'
  }
  if (combined.includes('contract') || combined.includes('freelance')) {
    return 'Contract'
  }
  if (combined.includes('part-time') || combined.includes('part time')) {
    return 'Part-time'
  }
  return 'Full-time'
}

function detectExperienceLevel(title = '', jobType = '') {
  const lower = title.toLowerCase()
  if (jobType === 'Internship' || lower.includes('intern') || lower.includes('fresher') || lower.includes('graduate')) {
    return 'Fresher'
  }
  if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate') || lower.includes('early career')) {
    return 'Entry-level'
  }
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal') || lower.includes('staff') || lower.includes('architect') || lower.includes('director')) {
    return 'Senior'
  }
  return 'Mid-level'
}

function extractBulletPoints(text = '', count = 4) {
  const lines = text.split('\n')
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
    .filter(l => l.length > 20 && l.length < 250)
  return lines.slice(0, count)
}

const realJobFetcher = {
  async fetchArbeitnowJobs(limit = 40) {
    try {
      logger.info('Fetching live jobs & internships from Arbeitnow API...')
      const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', { timeout: 12000 })
      const items = res.data?.data || []

      const jobs = items.slice(0, limit).map((item) => {
        const cleanDesc = cleanHtml(item.description)
        const jobType = detectJobType(item.title, item.tags || [], (item.job_types || []).join(' '))
        const experienceLevel = detectExperienceLevel(item.title, jobType)
        const workMode = item.remote ? 'Remote' : (item.location?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site')
        const skills = extractSkills(`${item.title} ${cleanDesc}`, item.tags || [])
        const bullets = extractBulletPoints(cleanDesc, 4)

        return {
          title: item.title,
          company: item.company_name || 'Technology Company',
          location: item.location || (item.remote ? 'Remote' : 'Worldwide'),
          workMode,
          jobType,
          experienceLevel,
          skills,
          description: cleanDesc.slice(0, 3000),
          requirements: bullets.slice(0, 3).length ? bullets.slice(0, 3) : ['Strong problem-solving skills', 'Proficiency in modern programming', 'Team collaboration skills'],
          responsibilities: bullets.slice(2, 5).length ? bullets.slice(2, 5) : ['Develop and maintain software solutions', 'Collaborate across cross-functional teams', 'Participate in agile sprints'],
          applyUrl: item.url,
          source: 'Arbeitnow',
          sourceId: item.slug || `arbeitnow-${item.title}-${item.created_at}`,
          postedAt: item.created_at ? new Date(item.created_at * 1000) : new Date(),
          tags: (item.tags || []).slice(0, 6),
          isActive: true,
        }
      })

      return jobs
    } catch (err) {
      logger.error(`Arbeitnow API fetch failed: ${err.message}`)
      return []
    }
  },

  async fetchRemotiveJobs(limit = 40) {
    try {
      logger.info('Fetching live remote jobs & internships from Remotive API...')
      // Fetch software jobs and specific internships
      const [softwareRes, internRes] = await Promise.all([
        axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=25', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } })),
        axios.get('https://remotive.com/api/remote-jobs?search=intern&limit=20', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } }))
      ])

      const combined = [...(internRes.data?.jobs || []), ...(softwareRes.data?.jobs || [])]
      const seenIds = new Set()
      const deduped = []
      for (const j of combined) {
        if (!seenIds.has(j.id)) {
          seenIds.add(j.id)
          deduped.push(j)
        }
      }

      const jobs = deduped.slice(0, limit).map((item) => {
        const cleanDesc = cleanHtml(item.description)
        const jobType = detectJobType(item.title, item.tags || [], item.job_type)
        const experienceLevel = detectExperienceLevel(item.title, jobType)
        const skills = extractSkills(`${item.title} ${cleanDesc}`, item.tags || [])
        const bullets = extractBulletPoints(cleanDesc, 4)

        return {
          title: item.title,
          company: item.company_name || 'Tech Innovator',
          companyLogo: item.company_logo || item.company_logo_url || null,
          location: item.candidate_required_location || 'Remote (Worldwide)',
          workMode: 'Remote',
          jobType,
          experienceLevel,
          skills,
          description: cleanDesc.slice(0, 3000),
          requirements: bullets.slice(0, 3).length ? bullets.slice(0, 3) : ['Solid foundation in computer science and modern frameworks', 'Demonstrated personal or open-source projects', 'Good communication skills'],
          responsibilities: bullets.slice(2, 5).length ? bullets.slice(2, 5) : ['Build features and test code end-to-end', 'Participate in daily standups and code reviews'],
          applyUrl: item.url,
          source: 'Remotive',
          sourceId: String(item.id),
          postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
          tags: (item.tags || []).slice(0, 6),
          isActive: true,
        }
      })

      return jobs
    } catch (err) {
      logger.error(`Remotive API fetch failed: ${err.message}`)
      return []
    }
  },

  async fetchAmazonJobs(limit = 30) {
    try {
      logger.info('Fetching live software engineering & internship jobs from Amazon Careers...')
      const [indiaJobsRes, globalInternsRes] = await Promise.all([
        axios.get('https://www.amazon.jobs/en/search.json?base_query=India&category[]=software-development&result_limit=25', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } })),
        axios.get('https://www.amazon.jobs/en/search.json?category[]=software-development&type[]=internship&result_limit=20', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } }))
      ])

      const rawJobs = [...(indiaJobsRes.data?.jobs || []), ...(globalInternsRes.data?.jobs || [])]
      const seen = new Set()
      const deduped = []
      for (const j of rawJobs) {
        const id = j.id_icims || j.id
        if (id && !seen.has(id)) {
          seen.add(id)
          deduped.push(j)
        }
      }

      return deduped.slice(0, limit).map(item => {
        const cleanDesc = cleanHtml(item.description || item.description_short)
        const jobType = (item.title.toLowerCase().includes('intern') || item.job_path?.includes('intern') || cleanDesc.toLowerCase().includes('internship')) ? 'Internship' : 'Full-time'
        const experienceLevel = detectExperienceLevel(item.title, jobType)
        const city = item.city || 'Bengaluru'
        const country = item.country_code === 'IND' ? 'India' : (item.country_code || 'Global')
        const location = `${city}, ${country}`
        const workMode = cleanDesc.toLowerCase().includes('remote') ? 'Remote' : (cleanDesc.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site')
        const skills = extractSkills(`${item.title} ${cleanDesc} ${item.basic_qualifications || ''}`, ['AWS', 'Java', 'Python', 'C++'])
        const reqBullets = extractBulletPoints(cleanHtml(item.basic_qualifications || cleanDesc), 3)
        const respBullets = extractBulletPoints(cleanHtml(item.preferred_qualifications || cleanDesc), 3)

        return {
          title: item.title,
          company: 'Amazon',
          companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
          location,
          workMode,
          jobType,
          experienceLevel,
          skills,
          description: cleanDesc.slice(0, 3000),
          requirements: reqBullets.length ? reqBullets : ['Strong computer science fundamentals', 'Proficiency in modern languages like Java, C++, Python, or TypeScript', 'Problem-solving and system design skills'],
          responsibilities: respBullets.length ? respBullets : ['Design and implement scalable distributed services', 'Collaborate with cross-functional engineering teams', 'Participate in code reviews and operational excellence'],
          applyUrl: item.job_path ? `https://www.amazon.jobs${item.job_path}` : (item.url_next_step || 'https://www.amazon.jobs'),
          source: 'Amazon Careers',
          sourceId: String(item.id_icims || item.id),
          postedAt: item.posted_date ? new Date(item.posted_date) : new Date(),
          tags: ['Amazon', 'AWS', city, jobType],
          isActive: true,
        }
      })
    } catch (err) {
      logger.error(`Amazon Jobs fetch failed: ${err.message}`)
      return []
    }
  },

  async syncAllRealJobs({ maxJobs = 75 } = {}) {
    logger.info('🚀 Starting live job & internship sync...')
    const perSource = Math.ceil(maxJobs / 3)
    const [amazonJobs, arbeitnowJobs, remotiveJobs] = await Promise.all([
      this.fetchAmazonJobs(perSource),
      this.fetchArbeitnowJobs(perSource),
      this.fetchRemotiveJobs(perSource)
    ])

    const allReal = [...amazonJobs, ...remotiveJobs, ...arbeitnowJobs]
    logger.info(`Fetched ${allReal.length} real jobs and internships from external APIs (Amazon, Remotive, Arbeitnow). Upserting into MongoDB...`)

    let createdCount = 0
    let updatedCount = 0

    for (const jobData of allReal) {
      try {
        const res = await Job.findOneAndUpdate(
          { source: jobData.source, sourceId: jobData.sourceId },
          { $set: jobData },
          { upsert: true, returnDocument: 'before' }
        )
        if (res) {
          updatedCount++
        } else {
          createdCount++
        }
      } catch (err) {
        logger.warn(`Failed to upsert job ${jobData.title}: ${err.message}`)
      }
    }

    const totalInDb = await Job.countDocuments({ isActive: true })
    const internshipsInDb = await Job.countDocuments({ isActive: true, jobType: 'Internship' })

    logger.info(`Sync complete! Inserted: ${createdCount}, Updated: ${updatedCount}. Total Active in DB: ${totalInDb} (Internships: ${internshipsInDb})`)

    return {
      success: true,
      inserted: createdCount,
      updated: updatedCount,
      totalActive: totalInDb,
      totalInternships: internshipsInDb,
    }
  }
}

module.exports = realJobFetcher
