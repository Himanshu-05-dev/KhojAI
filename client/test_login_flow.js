import puppeteer from 'puppeteer-core'

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('response', res => {
    if (res.status() >= 400) console.log('HTTP ERROR:', res.status(), res.url())
  })

  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'networkidle2' })
  console.log('On page:', page.url())

  await page.type('#login-email', 'himanshu@gmail.com')
  await page.type('#login-password', 'Password@123')
  await page.click('button[type="submit"]')

  await new Promise(r => setTimeout(r, 2500))
  console.log('After login URL:', page.url())

  // Check auth store in localStorage
  const authStorage = await page.evaluate(() => localStorage.getItem('khojai-auth'))
  console.log('Auth storage after login:', authStorage ? 'Present' : 'Missing')

  await browser.close()
}

run().catch(console.error)
