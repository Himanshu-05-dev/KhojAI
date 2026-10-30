const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true, index: true },
  company:         { type: String, required: true, trim: true, index: true },
  companyLogo:     { type: String },
  location:        { type: String, default: 'Remote', trim: true },
  workMode:        { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
  jobType:         { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Co-op'], default: 'Full-time' },
  experienceLevel: { type: String, enum: ['Entry-level', 'Fresher', 'Mid-level', 'Senior', 'Executive', 'Any'], default: 'Fresher' },
  skills:          [{ type: String, trim: true, index: true }],
  salary: {
    min:      { type: Number },
    max:      { type: Number },
    currency: { type: String, default: 'USD' },
    period:   { type: String, enum: ['yearly', 'monthly', 'hourly'], default: 'yearly' },
  },
  description:      { type: String, required: true },
  requirements:     [{ type: String }],
  responsibilities: [{ type: String }],
  applyUrl:         { type: String },
  source:           { type: String, default: 'Direct', index: true },
  sourceId:         { type: String },
  deadline:         { type: Date },
  postedAt:         { type: Date, default: Date.now, index: true },
  isActive:         { type: Boolean, default: true, index: true },
  isInternational:  { type: Boolean, default: false, index: true },
  tags:             [{ type: String }],
}, { timestamps: true })

jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' })
jobSchema.index({ workMode: 1, jobType: 1, experienceLevel: 1 })

module.exports = mongoose.model('Job', jobSchema)
