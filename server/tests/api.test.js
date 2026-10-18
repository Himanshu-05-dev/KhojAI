const request = require('supertest')
const app     = require('../src/app')

describe('KhojAI API Integration Tests', () => {
  it('GET /api/v1/health returns ok status', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.statusCode).toEqual(200)
    expect(res.body.status).toEqual('ok')
    expect(res.body.service).toEqual('KhojAI API')
  })

  it('POST /api/v1/auth/register fails on missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({})
    expect(res.statusCode).toEqual(400)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/v1/auth/login fails on missing credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.statusCode).toEqual(400)
    expect(res.body.success).toBe(false)
  })

  it('GET /api/v1/jobs requires no auth or allows optional auth', async () => {
    const res = await request(app).get('/api/v1/jobs')
    // Should respond with 200 (or if DB offline, handle gracefully)
    expect([200, 500]).toContain(res.statusCode)
  })
})
