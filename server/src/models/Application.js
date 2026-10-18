const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  company:        { type: String, required: true, trim: true },
  role:           { type: String, required: true, trim: true },
  location:       { type: String, default: 'Remote' },
  jobUrl:         { type: String },
  status: {
    type: String,
    enum: ['Bookmarked', 'Applied', 'Screening', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn'],
    default: 'Applied',
    index: true,
  },
  appliedDate:    { type: Date, default: Date.now },
  deadline:       { type: Date },
  salaryOffered:  { type: String },
  notes:          { type: String },
  interviews: [{
    stage:     { type: String, default: 'Initial Screen' },
    date:      { type: Date },
    interviewer: { type: String },
    notes:     { type: String },
  }],
  timeline: [{
    status:    { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note:      { type: String },
  }],
}, { timestamps: true })

applicationSchema.index({ userId: 1, status: 1 })
applicationSchema.index({ userId: 1, appliedDate: -1 })

module.exports = mongoose.model('Application', applicationSchema)
