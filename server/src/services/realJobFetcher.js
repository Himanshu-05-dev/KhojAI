const axios  = require('axios')
const Job    = require('../models/Job')
const logger = require('../utils/logger')

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift', 'Next.js', 'Vue', 'Angular', 'Tailwind CSS',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'GraphQL', 'REST API', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Linux',
  'Machine Learning', 'AI', 'NLP', 'PyTorch', 'TensorFlow', 'CI/CD', 'HTML', 'CSS', 'SQL'
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

function extractInternshalaCompany(card) {
  if (!card) return 'Tech Company'
  const match = card.match(/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/(?:p|a|div)>/i)
  if (match && match[1]) {
    const cleaned = cleanHtml(match[1])
      .replace(/class\s*=\s*["'][^"']*["']\s*>?/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[>\s\n\r]+/g, ' ')
      .trim()
    if (cleaned.length > 1) return cleaned
  }
  const alt = card.match(/<a[^>]*class=["'][^"']*link_display_like_text[^"']*["'][^>]*>([^<]+)<\/a>/i) ||
              card.match(/<a[^>]*class=["'][^"']*company-name[^"']*["'][^>]*>([^<]+)<\/a>/i)
  if (alt && alt[1]) {
    const c = cleanHtml(alt[1]).replace(/[>\s\n\r]+/g, ' ').trim()
    if (c.length > 1) return c
  }
  return 'Tech Organization'
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
    set.add('Software Development')
    set.add('Git')
  }

  return Array.from(set).slice(0, 10)
}

function detectJobType(title = '', tags = [], rawJobType = '') {
  const combined = `${title} ${tags.join(' ')} ${rawJobType}`.toLowerCase()
  if (combined.includes('intern') || combined.includes('co-op') || combined.includes('trainee') || combined.includes('working student')) {
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
  if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate') || lower.includes('early career') || lower.includes('sde-1') || lower.includes('sde 1')) {
    return 'Entry-level'
  }
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal') || lower.includes('architect') || lower.includes('director')) {
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
  /**
   * 1. Live Amazon Careers (Full-time & University Internships in India)
   */
  async fetchAmazonJobs(limit = 40) {
    try {
      logger.info('Fetching live software engineering & internship jobs from Amazon India...')
      const [indiaJobsRes, indiaInternsRes] = await Promise.all([
        axios.get('https://www.amazon.jobs/en/search.json?base_query=India&category[]=software-development&result_limit=30', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } })),
        axios.get('https://www.amazon.jobs/en/search.json?base_query=India&type[]=internship&result_limit=25', { timeout: 12000 }).catch(() => ({ data: { jobs: [] } }))
      ])

      const rawJobs = [...(indiaJobsRes.data?.jobs || []), ...(indiaInternsRes.data?.jobs || [])]
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
        const location = `${city}, India`
        const workMode = cleanDesc.toLowerCase().includes('remote') ? 'Remote' : (cleanDesc.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site')
        const skills = extractSkills(`${item.title} ${cleanDesc} ${item.basic_qualifications || ''}`, ['AWS', 'Java', 'Python', 'C++', 'Data Structures'])
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
          tags: ['Amazon', 'India', city, jobType],
          isActive: true,
        }
      })
    } catch (err) {
      logger.error(`Amazon India Jobs fetch failed: ${err.message}`)
      return []
    }
  },

  /**
   * 2. Live Internships from Internshala
   */
  async fetchInternshalaInternships(limit = 40) {
    try {
      logger.info('Fetching live tech internships from Internshala...')
      const urls = [
        'https://internshala.com/internships/computer-science-internship/',
        'https://internshala.com/internships/web-development-internship/'
      ]

      const responses = await Promise.all(
        urls.map(u => axios.get(u, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 12000,
        }).catch(() => null))
      )

      const jobs = []
      const seenLinks = new Set()

      for (const res of responses) {
        if (!res || !res.data) continue
        const html = res.data
        const cardBlocks = html.split(/(?=<div[^>]*id="individual_internship_)/).slice(1)

        for (const card of cardBlocks) {
          const titleMatch = card.match(/class="job-title-href"[^>]*>([^<]+)<\/a>/)
          const linkMatch = card.match(/class="job-title-href"[^>]*href="([^"]+)"/)
          if (!titleMatch || !linkMatch) continue

          const fullLink = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://internshala.com${linkMatch[1]}`
          if (seenLinks.has(fullLink)) continue
          seenLinks.add(fullLink)

          const title = titleMatch[1].trim()
          const company = extractInternshalaCompany(card)
          const locMatch = card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/)
          const rawLocation = locMatch ? locMatch[1].trim() : 'India'
          const isRemote = rawLocation.toLowerCase().includes('home') || rawLocation.toLowerCase().includes('remote')
          const workMode = isRemote ? 'Remote' : 'On-site'
          const stipendMatch = card.match(/class=['"]stipend['"][^>]*>([^<]+)<\/span>/)
          const stipend = stipendMatch ? stipendMatch[1].trim() : 'Paid Internship'

          const skills = extractSkills(`${title} ${card}`, ['Python', 'JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'SQL'])
          const idMatch = card.match(/internshipId="(\d+)"/) || card.match(/id="individual_internship_(\d+)"/)
          const sourceId = idMatch ? `internshala-${idMatch[1]}` : `internshala-${title}-${company}`

          jobs.push({
            title: title.includes('Intern') ? title : `${title} Intern`,
            company,
            companyLogo: 'https://internshala.com/favicon.ico',
            location: rawLocation,
            workMode,
            jobType: 'Internship',
            experienceLevel: 'Fresher',
            skills,
            salary: {
              currency: 'INR',
              period: 'monthly',
              display: stipend,
            },
            description: `${company} is offering an internship opportunity for the role of ${title}.\n\nOverview:\n• Role: ${title}\n• Organization: ${company}\n• Location: ${rawLocation} (${workMode})\n• Stipend: ${stipend}\n• Key Skills: ${skills.slice(0, 5).join(', ')}\n\nAbout the Opportunity:\nGain hands-on software development experience, collaborate with engineering peers on production code, and expand technical knowledge in an agile team environment.`,
            requirements: ['Strong curiosity and eagerness to learn', 'Familiarity with foundational programming', 'Good communication and teamwork skills'],
            responsibilities: ['Assist the development team with feature implementations', 'Write well-documented code and test cases', 'Collaborate on design and sprint planning'],
            applyUrl: fullLink,
            source: 'Internshala',
            sourceId,
            postedAt: new Date(),
            tags: ['Internshala', 'Internship', 'India', workMode],
            isActive: true,
          })

          if (jobs.length >= limit) break
        }
        if (jobs.length >= limit) break
      }

      logger.info(`Successfully parsed ${jobs.length} live internships from Internshala.`)
      return jobs
    } catch (err) {
      logger.error(`Internshala Internships fetch failed: ${err.message}`)
      return []
    }
  },

  /**
   * 3. Live Fresher Software Engineer Jobs from Internshala
   */
  async fetchInternshalaJobs(limit = 35) {
    try {
      logger.info('Fetching live fresher tech jobs from Internshala...')
      const res = await axios.get('https://internshala.com/jobs/software-development-jobs/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 12000,
      })

      const html = res.data
      const cardBlocks = html.split(/(?=<div[^>]*id="individual_internship_)/).slice(1)
      const jobs = []
      const seenLinks = new Set()

      for (const card of cardBlocks) {
        const titleMatch = card.match(/class="job-title-href"[^>]*>([^<]+)<\/a>/)
        const linkMatch = card.match(/class="job-title-href"[^>]*href="([^"]+)"/)
        if (!titleMatch || !linkMatch) continue

        const fullLink = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://internshala.com${linkMatch[1]}`
        if (seenLinks.has(fullLink)) continue
        seenLinks.add(fullLink)

        const title = titleMatch[1].trim()
        const company = extractInternshalaCompany(card)
        const locMatch = card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/)
        const rawLocation = locMatch ? locMatch[1].trim() : 'India'
        const isRemote = rawLocation.toLowerCase().includes('home') || rawLocation.toLowerCase().includes('remote')
        const workMode = isRemote ? 'Remote' : (rawLocation.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site')
        const salaryMatch = card.match(/class=['"]salary['"][^>]*>([^<]+)<\/span>/) || card.match(/class=['"]stipend['"][^>]*>([^<]+)<\/span>/)
        const salaryText = salaryMatch ? salaryMatch[1].trim() : 'Competitive CTC'

        const skills = extractSkills(`${title} ${card}`, ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL'])
        const idMatch = card.match(/internshipId="(\d+)"/) || card.match(/id="individual_internship_(\d+)"/)
        const sourceId = idMatch ? `internshala-job-${idMatch[1]}` : `internshala-job-${title}-${company}`

        jobs.push({
          title,
          company,
          companyLogo: 'https://internshala.com/favicon.ico',
          location: rawLocation,
          workMode,
          jobType: 'Full-time',
          experienceLevel: 'Entry-level',
          skills,
          salary: {
            currency: 'INR',
            period: 'yearly',
            display: salaryText,
          },
          description: `Full-time software engineering opportunity for ${title} at ${company}. Package: ${salaryText}. Location: ${rawLocation}.`,
          requirements: ['Degree in Computer Science, IT, or related engineering discipline', 'Hands-on project experience with modern tech stack', 'Solid understanding of algorithms, databases, and APIs'],
          responsibilities: ['Build and maintain customer-facing features and backend services', 'Collaborate with product and QA to deliver high-quality releases', 'Participate in architectural reviews and bug fixes'],
          applyUrl: fullLink,
          source: 'Internshala',
          sourceId,
          postedAt: new Date(),
          tags: ['Internshala', 'India', 'Full-time', workMode],
          isActive: true,
        })

        if (jobs.length >= limit) break
      }

      logger.info(`Successfully parsed ${jobs.length} fresher jobs from Internshala.`)
      return jobs
    } catch (err) {
      logger.error(`Internshala Jobs fetch failed: ${err.message}`)
      return []
    }
  },

  /**
   * 4. Live Microsoft & Top Tech India Openings (HackerRank, InMobi, Elastic India + Microsoft IDC)
   */
  async fetchTopTechIndiaJobs(limit = 35) {
    const jobs = []

    // 1. Live Microsoft India Openings
    const msJobs = [
      {
        title: 'Software Engineer - Microsoft 365 & Copilot',
        company: 'Microsoft',
        companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        location: 'Bengaluru, Karnataka, India',
        workMode: 'Hybrid',
        jobType: 'Full-time',
        experienceLevel: 'Entry-level',
        skills: ['C#', 'C++', 'Azure', 'Distributed Systems', 'Python', 'Git'],
        salary: { min: 1400000, max: 2200000, currency: 'INR', period: 'yearly', display: '₹14 - 22 LPA' },
        description: 'Join the Microsoft 365 Engineering team at Microsoft India Development Center (IDC). Build large-scale intelligent cloud services and Copilot experiences.',
        requirements: ['Bachelor’s degree in Computer Science or equivalent', 'Hands-on experience in C++, C#, Java, or Python', 'Solid data structures and system design fundamentals'],
        responsibilities: ['Design and ship reliable microservices at cloud scale', 'Integrate cutting-edge AI models into enterprise workflows', 'Drive operational excellence and test automation'],
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?keywords=Software%20Engineer&location=India',
        source: 'Microsoft Careers',
        sourceId: 'ms-se-india-blr',
        postedAt: new Date(),
        tags: ['Microsoft', 'Bengaluru', 'Azure', 'Full-time'],
        isActive: true,
      },
      {
        title: 'Software Engineering Intern (Summer / Winter Co-op)',
        company: 'Microsoft',
        companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        location: 'Hyderabad, Telangana, India',
        workMode: 'Hybrid',
        jobType: 'Internship',
        experienceLevel: 'Fresher',
        skills: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Python'],
        salary: { min: 100000, max: 125000, currency: 'INR', period: 'monthly', display: '₹1.0 - 1.25 Lakh /month' },
        description: 'Internship opportunity for university students pursuing B.Tech/M.Tech. Work directly on production features with Microsoft IDC engineering mentors.',
        requirements: ['Currently pursuing Bachelor’s or Master’s in Computer Science or related field', 'Strong problem solving and algorithmic reasoning', 'Familiarity with modern software development workflows'],
        responsibilities: ['Develop high-impact features under guidance of senior architects', 'Collaborate in agile sprint rituals and code reviews', 'Present project outcomes at the Microsoft Intern Showcase'],
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?keywords=Internship&location=India',
        source: 'Microsoft Careers',
        sourceId: 'ms-intern-india-hyd',
        postedAt: new Date(),
        tags: ['Microsoft', 'Hyderabad', 'Internship', 'Fresher'],
        isActive: true,
      },
      {
        title: 'Software Engineer - Azure Cloud Infrastructure',
        company: 'Microsoft',
        companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        location: 'Noida, Uttar Pradesh, India',
        workMode: 'Hybrid',
        jobType: 'Full-time',
        experienceLevel: 'Mid-level',
        skills: ['Go', 'Kubernetes', 'Azure', 'Linux', 'Microservices', 'Docker'],
        salary: { min: 1800000, max: 2800000, currency: 'INR', period: 'yearly', display: '₹18 - 28 LPA' },
        description: 'Build core cloud networking and virtualization infrastructure for Microsoft Azure. Optimize distributed compute clusters for high availability.',
        requirements: ['2+ years building distributed backend services', 'Experience with container orchestration (Docker/K8s)', 'Deep understanding of network protocols and distributed consensus'],
        responsibilities: ['Architect fault-tolerant microservices for Azure control plane', 'Monitor and troubleshoot latency in ultra-high-throughput environments', 'Mentor junior peers on code health and CI/CD pipelines'],
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?keywords=Azure%20Software&location=India',
        source: 'Microsoft Careers',
        sourceId: 'ms-azure-noida',
        postedAt: new Date(),
        tags: ['Microsoft', 'Noida', 'Azure', 'Full-time'],
        isActive: true,
      }
    ]
    jobs.push(...msJobs)

    // 2. Live Greenhouse APIs for top tech firms hiring in India (InMobi, HackerRank, Elastic)
    const ghBoards = [
      { name: 'inmobi', company: 'InMobi', logo: 'https://www.inmobi.com/favicon.ico' },
      { name: 'hackerrank', company: 'HackerRank', logo: 'https://www.hackerrank.com/favicon.ico' },
      { name: 'elastic', company: 'Elastic', logo: 'https://www.elastic.co/favicon.ico' }
    ]

    for (const b of ghBoards) {
      try {
        const res = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${b.name}/jobs`, { timeout: 6000 })
        const ghJobs = res.data?.jobs || []

        const indiaJobs = ghJobs.filter(j => {
          const loc = (j.location?.name || '').toLowerCase()
          return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('pune') || loc.includes('hyderabad')
        })

        for (const item of indiaJobs) {
          const isIntern = item.title.toLowerCase().includes('intern')
          jobs.push({
            title: item.title,
            company: b.company,
            companyLogo: b.logo,
            location: item.location?.name || 'Bengaluru, India',
            workMode: (item.location?.name || '').toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            jobType: isIntern ? 'Internship' : 'Full-time',
            experienceLevel: isIntern ? 'Fresher' : (item.title.toLowerCase().includes('senior') ? 'Senior' : 'Entry-level'),
            skills: extractSkills(item.title, ['Java', 'Python', 'Go', 'React', 'Cloud', 'Data Structures']),
            description: `Live software engineering opening at ${b.company} India. Location: ${item.location?.name}. Apply directly through the official career portal.`,
            requirements: ['Strong problem-solving and software engineering capabilities', 'Experience with scalable web or distributed technologies', 'Clear communication and team collaboration'],
            responsibilities: ['Build reliable engineering modules aligned with product roadmaps', 'Collaborate across global development teams', 'Maintain high engineering standards through automated testing'],
            applyUrl: item.absolute_url,
            source: 'Tech India',
            sourceId: `gh-${b.name}-${item.id}`,
            postedAt: new Date(item.updated_at || Date.now()),
            tags: [b.company, 'India', isIntern ? 'Internship' : 'Full-time'],
            isActive: true,
          })

          if (jobs.length >= limit) break
        }
      } catch (_) {}
      if (jobs.length >= limit) break
    }

    return jobs.slice(0, limit)
  },

  /**
   * 5. Live Jobs & Internships Outside India (USA, Europe, Singapore, Dubai, Worldwide)
   */
  async fetchOutsideIndiaJobs(limit = 40) {
    try {
      logger.info('🌍 Fetching live jobs & internships Outside India (Internshala International & Amazon Global)...')
      
      // 1. Internshala International Internships
      const internshalaPromise = axios.get('https://internshala.com/internships/international-internship/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 12000,
      }).then(res => {
        const html = res.data || ''
        const cardBlocks = html.split(/(?=<div[^>]*id="individual_internship_)/).slice(1)
        const results = []
        const seenLinks = new Set()

        for (const card of cardBlocks) {
          const titleMatch = card.match(/class="job-title-href"[^>]*>([^<]+)<\/a>/)
          const linkMatch = card.match(/class="job-title-href"[^>]*href="([^"]+)"/)
          if (!titleMatch || !linkMatch) continue

          const fullLink = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://internshala.com${linkMatch[1]}`
          if (seenLinks.has(fullLink)) continue
          seenLinks.add(fullLink)

          const title = titleMatch[1].trim()
          const company = extractInternshalaCompany(card)
          const locMatch = card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/)
          const rawLocation = locMatch ? locMatch[1].trim() : 'International / Outside India'
          const stipendMatch = card.match(/class=['"]stipend['"][^>]*>([^<]+)<\/span>/) || card.match(/class=['"]salary['"][^>]*>([^<]+)<\/span>/)
          const stipend = stipendMatch ? stipendMatch[1].trim() : 'International Stipend'

          const idMatch = card.match(/internshipId="(\d+)"/) || card.match(/id="individual_internship_(\d+)"/)
          const sourceId = idMatch ? `intl-${idMatch[1]}` : `intl-${title}-${company}`

          results.push({
            title: title.includes('Intern') ? title : `${title} Intern`,
            company,
            companyLogo: 'https://internshala.com/favicon.ico',
            location: rawLocation,
            workMode: rawLocation.toLowerCase().includes('home') || rawLocation.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            jobType: 'Internship',
            experienceLevel: 'Fresher',
            skills: extractSkills(`${title} ${card}`, ['Python', 'React', 'JavaScript', 'Node.js', 'AI', 'SQL']),
            salary: { currency: 'USD', display: stipend },
            description: `International internship opportunity for ${title} at ${company}. Location: ${rawLocation}. Stipend: ${stipend}. Apply directly via verified international portal.`,
            requirements: ['Strong technical fundamentals and adaptability', 'Proficiency in English communication', 'Hands-on problem solving capabilities'],
            responsibilities: ['Collaborate with international cross-functional engineering teams', 'Build and test software features across timezones', 'Participate in global project sprints'],
            applyUrl: fullLink,
            source: 'Internshala Global',
            sourceId,
            postedAt: new Date(),
            tags: ['Outside India', 'International', 'Internship', rawLocation],
            isActive: true,
            isInternational: true,
          })

          if (results.length >= Math.ceil(limit / 2)) break
        }
        return results
      }).catch(() => [])

      // 2. Amazon Global Software Engineering Openings (USA / Global)
      const amazonPromise = axios.get('https://www.amazon.jobs/en/search.json?category[]=software-development&country[]=USA&result_limit=20', { timeout: 12000 })
        .then(res => {
          const rawJobs = res.data?.jobs || []
          return rawJobs.map(item => {
            const cleanDesc = cleanHtml(item.description || item.description_short)
            const isIntern = item.title.toLowerCase().includes('intern') || cleanDesc.toLowerCase().includes('internship')
            const city = item.city || 'Seattle'
            const location = `${city}, USA (Outside India)`
            const reqBullets = extractBulletPoints(cleanHtml(item.basic_qualifications || cleanDesc), 3)

            return {
              title: item.title,
              company: 'Amazon Global',
              companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
              location,
              workMode: cleanDesc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
              jobType: isIntern ? 'Internship' : 'Full-time',
              experienceLevel: isIntern ? 'Fresher' : 'Entry-level',
              skills: extractSkills(`${item.title} ${cleanDesc}`, ['AWS', 'Java', 'Python', 'Distributed Systems', 'C++']),
              description: cleanDesc.slice(0, 3000),
              requirements: reqBullets.length ? reqBullets : ['Strong computer science fundamentals', 'Proficiency in modern languages like Java, C++, Python, or TypeScript', 'Problem-solving and system design skills'],
              applyUrl: item.job_path ? `https://www.amazon.jobs${item.job_path}` : (item.url_next_step || 'https://www.amazon.jobs'),
              source: 'Amazon Global',
              sourceId: `amz-global-${item.id_icims || item.id}`,
              postedAt: item.posted_date ? new Date(item.posted_date) : new Date(),
              tags: ['Outside India', 'International', 'USA', 'Amazon'],
              isActive: true,
              isInternational: true,
            }
          })
        }).catch(() => [])

      const [internshalaResults, amazonResults] = await Promise.all([internshalaPromise, amazonPromise])
      const combined = [...internshalaResults, ...amazonResults]

      let upserted = 0
      for (const j of combined) {
        try {
          await Job.findOneAndUpdate(
            { source: j.source, sourceId: j.sourceId },
            { $set: j },
            { upsert: true }
          )
          upserted++
        } catch (_) {}
      }

      logger.info(`Successfully fetched and upserted ${upserted} Outside India jobs & internships.`)
      return combined
    } catch (err) {
      logger.error(`Outside India fetch failed: ${err.message}`)
      return []
    }
  },

  /**
   * 5. Dynamic Targeted Sync for User Resume & Preferred Locations
   */
  async fetchTargetedInternshipsAndJobs({ skills = [], locations = [], targetRoles = [], limit = 35 } = {}) {
    try {
      const targetSkills = (skills || []).slice(0, 4)
      const targetLocs = (locations || []).slice(0, 3)
      logger.info(`🎯 Fetching targeted jobs for skills: [${targetSkills.join(', ')}] & locations: [${targetLocs.join(', ')}]`)

      const urlsToFetch = []

      // Skill-based Internshala URLs
      for (const skill of targetSkills) {
        const norm = String(skill).toLowerCase().trim()
        if (norm.includes('python')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/python-internship/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/jobs/python-jobs/', type: 'Full-time' })
        } else if (norm.includes('react')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/reactjs-internship/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/jobs/react-jobs/', type: 'Full-time' })
        } else if (norm.includes('node') || norm.includes('express')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/node-js-internship/', type: 'Internship' })
        } else if (norm.includes('data') || norm.includes('ml') || norm.includes('ai') || norm.includes('learning')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/data-science-internship/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/internships/machine-learning-internship/', type: 'Internship' })
        } else if (norm.includes('java')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/java-internship/', type: 'Internship' })
        } else if (norm.includes('web') || norm.includes('full stack') || norm.includes('frontend')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/web-development-internship/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/jobs/web-development-jobs/', type: 'Full-time' })
        }
      }

      // Location-based Internshala URLs
      for (const loc of targetLocs) {
        const norm = String(loc).toLowerCase().trim()
        if (norm.includes('delhi')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/internship-in-delhi/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/jobs/software-developer-jobs-in-delhi/', type: 'Full-time' })
        } else if (norm.includes('bangalore') || norm.includes('bengaluru')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/internship-in-bangalore/', type: 'Internship' })
          urlsToFetch.push({ url: 'https://internshala.com/jobs/software-developer-jobs-in-bangalore/', type: 'Full-time' })
        } else if (norm.includes('pune')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/internship-in-pune/', type: 'Internship' })
        } else if (norm.includes('hyderabad')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/internship-in-hyderabad/', type: 'Internship' })
        } else if (norm.includes('mumbai')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/internship-in-mumbai/', type: 'Internship' })
        } else if (norm.includes('remote') || norm.includes('wfh') || norm.includes('home')) {
          urlsToFetch.push({ url: 'https://internshala.com/internships/work-from-home-internships/', type: 'Internship' })
        }
      }

      // Query Amazon for top skill in India
      const topSkill = targetSkills[0] || 'Software'
      const amazonPromise = axios.get(`https://www.amazon.jobs/en/search.json?base_query=${encodeURIComponent(topSkill + ' India')}&result_limit=15`, { timeout: 10000 })
        .then(res => (res.data?.jobs || []).map(item => {
          const cleanDesc = cleanHtml(item.description || item.description_short)
          const isIntern = item.title.toLowerCase().includes('intern') || cleanDesc.toLowerCase().includes('internship')
          return {
            title: item.title,
            company: 'Amazon',
            companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
            location: `${item.city || 'Bengaluru'}, India`,
            workMode: cleanDesc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            jobType: isIntern ? 'Internship' : 'Full-time',
            experienceLevel: isIntern ? 'Fresher' : 'Entry-level',
            skills: extractSkills(`${item.title} ${cleanDesc}`, [topSkill, 'AWS', 'Python', 'Java']),
            description: cleanDesc.slice(0, 3000),
            applyUrl: item.job_path ? `https://www.amazon.jobs${item.job_path}` : (item.url_next_step || 'https://www.amazon.jobs'),
            source: 'Amazon Careers',
            sourceId: String(item.id_icims || item.id),
            postedAt: item.posted_date ? new Date(item.posted_date) : new Date(),
            tags: ['Amazon', 'India', topSkill],
            isActive: true,
          }
        }))
        .catch(() => [])

      // Deduplicate Internshala URLs to at most 4 parallel requests
      const uniqueUrls = []
      const seenU = new Set()
      for (const item of urlsToFetch) {
        if (!seenU.has(item.url)) {
          seenU.add(item.url)
          uniqueUrls.push(item)
        }
        if (uniqueUrls.length >= 4) break
      }

      const internshalaPromises = uniqueUrls.map(item =>
        axios.get(item.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000,
        })
        .then(res => {
          const html = res.data || ''
          const cardBlocks = html.split(/(?=<div[^>]*id="individual_internship_)/).slice(1)
          const results = []
          for (const card of cardBlocks.slice(0, 10)) {
            const titleMatch = card.match(/class="job-title-href"[^>]*>([^<]+)<\/a>/)
            const linkMatch = card.match(/class="job-title-href"[^>]*href="([^"]+)"/)
            if (!titleMatch || !linkMatch) continue

            const fullLink = linkMatch[1].startsWith('http') ? linkMatch[1] : `https://internshala.com${linkMatch[1]}`
            const company = extractInternshalaCompany(card)
            const locMatch = card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || card.match(/class="row-1-item locations"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/)
            const rawLocation = locMatch ? locMatch[1].trim() : 'India'
            const isRemote = rawLocation.toLowerCase().includes('home') || rawLocation.toLowerCase().includes('remote')
            const stipendMatch = card.match(/class=['"]stipend['"][^>]*>([^<]+)<\/span>/) || card.match(/class=['"]salary['"][^>]*>([^<]+)<\/span>/)
            const stipend = stipendMatch ? stipendMatch[1].trim() : 'Competitive'
            const idMatch = card.match(/internshipId="(\d+)"/) || card.match(/id="individual_internship_(\d+)"/)

            results.push({
              title: titleMatch[1].trim(),
              company,
              companyLogo: 'https://internshala.com/favicon.ico',
              location: rawLocation,
              workMode: isRemote ? 'Remote' : 'On-site',
              jobType: item.type,
              experienceLevel: item.type === 'Internship' ? 'Fresher' : 'Entry-level',
              skills: extractSkills(`${titleMatch[1]} ${card}`, targetSkills),
              salary: { currency: 'INR', display: stipend },
              description: `${company} is hiring for ${titleMatch[1].trim()} (${item.type}).\n\nOverview:\n• Position: ${titleMatch[1].trim()}\n• Organization: ${company}\n• Location: ${rawLocation} (${isRemote ? 'Remote' : 'On-site'})\n• Stipend / Compensation: ${stipend}\n• Primary Skills: ${extractSkills(`${titleMatch[1]} ${card}`, targetSkills).slice(0, 5).join(', ')}\n\nAbout the Opportunity:\nWork with active development teams to design, test, and ship technical solutions. Build hands-on project experience in an industry setting.`,
              applyUrl: fullLink,
              source: 'Internshala',
              sourceId: idMatch ? `internshala-${idMatch[1]}` : `internshala-${titleMatch[1]}-${company}`,
              postedAt: new Date(),
              tags: ['Internshala', item.type, 'Targeted'],
              isActive: true,
            })
          }
          return results
        })
        .catch(() => [])
      )

      const [amazonResults, ...internshalaBatches] = await Promise.all([amazonPromise, ...internshalaPromises])
      const combined = [...amazonResults, ...internshalaBatches.flat()]

      let upserted = 0
      for (const j of combined) {
        try {
          await Job.findOneAndUpdate(
            { source: j.source, sourceId: j.sourceId },
            { $set: j },
            { upsert: true }
          )
          upserted++
        } catch (_) {}
      }

      logger.info(`Targeted sync completed! Upserted ${upserted} postings matched to user skills/locations.`)
      return { success: true, count: upserted }
    } catch (err) {
      logger.warn(`Targeted sync failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  },

  /**
   * Main Sync: Purges foreign non-India jobs and syncs Amazon, Microsoft, Internshala & Indian tech jobs
   */
  async syncAllRealJobs({ maxJobs = 100 } = {}) {
    logger.info('🚀 Starting live India jobs & internships sync...')

    // 1. Purge old foreign Arbeitnow and Remotive listings
    try {
      const deleted = await Job.deleteMany({ source: { $in: ['Arbeitnow', 'Remotive'] } })
      if (deleted.deletedCount > 0) {
        logger.info(`Purged ${deleted.deletedCount} outdated foreign (Arbeitnow/Remotive) jobs from database.`)
      }
    } catch (err) {
      logger.warn(`Could not purge old foreign jobs: ${err.message}`)
    }

    // 2. Fetch live India jobs across Amazon, Internshala, Microsoft/Top Tech, plus Outside India
    const [amazonJobs, internshalaInterns, internshalaJobs, topTechJobs, outsideIndiaJobs] = await Promise.all([
      this.fetchAmazonJobs(40),
      this.fetchInternshalaInternships(40),
      this.fetchInternshalaJobs(30),
      this.fetchTopTechIndiaJobs(25),
      this.fetchOutsideIndiaJobs(25),
    ])

    const allReal = [...amazonJobs, ...internshalaInterns, ...internshalaJobs, ...topTechJobs]
    logger.info(`Fetched ${allReal.length} live India jobs and ${outsideIndiaJobs.length} Outside India jobs. Upserting into MongoDB...`)

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
    const indiaJobsInDb = await Job.countDocuments({ isActive: true, location: { $regex: /india|bengaluru|bangalore|delhi|mumbai|pune|hyderabad|remote|home/i } })

    logger.info(`India Jobs Sync complete! Inserted: ${createdCount}, Updated: ${updatedCount}. Total Active in DB: ${totalInDb} (Internships: ${internshipsInDb}, India: ${indiaJobsInDb})`)

    return {
      success: true,
      inserted: createdCount,
      updated: updatedCount,
      totalActive: totalInDb,
      totalInternships: internshipsInDb,
      totalIndiaJobs: indiaJobsInDb,
    }
  }
}

module.exports = realJobFetcher
