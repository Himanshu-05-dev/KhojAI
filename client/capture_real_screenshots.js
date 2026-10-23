import puppeteer from 'puppeteer-core'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
const BASE_URL = "http://localhost:5173"
const API_URL = "http://localhost:5000/api/v1"
const OUTPUT_DIR = path.resolve(__dirname, '../report_assets')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function prepareData() {
  console.log('Logging in user...')
  let token, user
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'himanshu@khojai.dev',
      password: 'Password@123'
    })
    token = loginRes.data.data.token
    user = loginRes.data.data.user
    console.log('Logged in successfully as:', user.name)
  } catch (err) {
    console.log('Login failed, attempting registration...')
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Himanshu Sharma',
      email: 'himanshu@khojai.dev',
      password: 'Password@123'
    })
    token = regRes.data.data.token
    user = regRes.data.data.user
  }

  const authHeaders = { Authorization: `Bearer ${token}` }

  // Seed user skills if empty
  try {
    await axios.put(`${API_URL}/auth/profile`, {
      skills: ['Python', 'Machine Learning', 'React', 'FastAPI', 'Node.js', 'Docker', 'LangChain', 'MongoDB'],
      targetRoles: ['AI/ML Engineer', 'Full Stack Developer'],
      experienceYears: 1
    }, { headers: authHeaders })
    console.log('User profile updated with AI/ML skills.')
  } catch (e) {
    console.log('Profile update notice:', e.message)
  }

  // Generate roadmap if not present
  try {
    await axios.post(`${API_URL}/roadmap/generate`, {
      targetRole: 'AI/ML Engineer',
      currentSkills: ['Python', 'Machine Learning', 'React', 'Node.js']
    }, { headers: authHeaders })
    console.log('Roadmap generated.')
  } catch (e) {
    console.log('Roadmap notice:', e.message)
  }

  // Get jobs to create applications
  try {
    const jobsRes = await axios.get(`${API_URL}/jobs?limit=5`, { headers: authHeaders })
    const jobs = jobsRes.data.data.jobs || []
    if (jobs.length > 0) {
      const stages = ['bookmarked', 'applied', 'interviewing', 'offered']
      for (let i = 0; i < Math.min(jobs.length, 4); i++) {
        try {
          await axios.post(`${API_URL}/applications`, {
            jobId: jobs[i]._id,
            status: stages[i],
            notes: `Application stage: ${stages[i]} for ${jobs[i].title}`
          }, { headers: authHeaders })
        } catch (err) {
          // might already exist
        }
      }
      console.log('Seeded applications across stages.')
    }
  } catch (e) {
    console.log('Applications notice:', e.message)
  }

  return { token, user }
}

async function capture() {
  const { token, user } = await prepareData()

  console.log('Launching Edge browser via puppeteer-core...')
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 })

  // 1. Landing Page
  console.log('Capturing Landing Page...')
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing_page.png') })

  // 2. Login Page
  console.log('Capturing Login Page...')
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_login_page.png') })

  // Setup Auth state in localStorage
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('khojai-auth', JSON.stringify({
      state: {
        token,
        user,
        isAuthenticated: true,
        isLoading: false
      },
      version: 0
    }))
  }, { token, user })

  // 3. Dashboard
  console.log('Capturing Dashboard...')
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_dashboard.png') })

  // 4. Jobs Discovery
  console.log('Capturing Jobs Discovery...')
  await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_jobs_discovery.png') })

  // 5. Job Detail Modal / View
  console.log('Capturing Job Detail View...')
  try {
    const jobCard = await page.$('.job-card, [data-testid="job-card"], a[href^="/jobs/"]')
    if (jobCard) {
      await jobCard.click()
      await new Promise(r => setTimeout(r, 1200))
      await page.screenshot({ path: path.join(OUTPUT_DIR, '05_job_detail.png') })
    } else {
      // Direct navigation
      const jobsRes = await axios.get(`${API_URL}/jobs?limit=1`)
      const firstJobId = jobsRes.data.data.jobs[0]?._id
      if (firstJobId) {
        await page.goto(`${BASE_URL}/jobs/${firstJobId}`, { waitUntil: 'networkidle2' })
        await new Promise(r => setTimeout(r, 1500))
        await page.screenshot({ path: path.join(OUTPUT_DIR, '05_job_detail.png') })
      }
    }
  } catch (e) {
    console.log('Job detail capture notice:', e.message)
  }

  // 6. Applications Kanban Tracker
  console.log('Capturing Applications Tracker...')
  await page.goto(`${BASE_URL}/applications`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_applications_kanban.png') })

  // 7. Career Roadmap
  console.log('Capturing Career Roadmap...')
  await page.goto(`${BASE_URL}/career-roadmap`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_career_roadmap.png') })

  // 8. Resume Center
  console.log('Capturing Resume Optimizer...')
  await page.goto(`${BASE_URL}/resume`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_resume_optimizer.png') })

  // 9. Inbox / Notifications
  console.log('Capturing Notifications Inbox...')
  await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1200))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_inbox_notifications.png') })

  // 10. Profile Settings
  console.log('Capturing Profile & Skills Matrix...')
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1200))
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_profile_skills.png') })

  await browser.close()
  console.log('All real-life screenshots captured successfully in report_assets!')
}

capture().catch(err => {
  console.error('Capture error:', err)
  process.exit(1)
})
