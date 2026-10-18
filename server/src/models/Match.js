const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  resumeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  matchScore:     { type: Number, required: true, min: 0, max: 100, index: true },
  categoryScores: {
    skillsMatch:       { type: Number, default: 0 },
    experienceMatch:   { type: Number, default: 0 },
    educationMatch:    { type: Number, default: 0 },
    locationRoleMatch: { type: Number, default: 0 },
  },
  matchingSkills: [{ type: String }],
  missingSkills:  [{ type: String }],
  strengths:      [{ type: String }],
  weaknesses:     [{ type: String }],
  copilotPitch:   { type: String },
  isSaved:        { type: Boolean, default: false, index: true },
  isViewed:       { type: Boolean, default: false },
  computedAt:     { type: Date, default: Date.now },
}, { timestamps: true })

matchSchema.index({ userId: 1, jobId: 1 }, { unique: true })
matchSchema.index({ userId: 1, matchScore: -1 })

module.exports = mongoose.model('Match', matchSchema)
