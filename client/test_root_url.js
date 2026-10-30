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

  // 1. Visit root / with no auth
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
  console.log('Visited http://localhost:5173/ -> Final URL:', page.url())

  // Check title or heading on page
  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText)
  console.log('H1 on /:', h1)

  await browser.close()
}

run().catch(console.error)
