const mongoose = require('mongoose')

const milestoneSchema = new mongoose.Schema({
  id:             { type: String, required: true },
  title:          { type: String, required: true },
  description:    { type: String },
  category:       { type: String, enum: ['course', 'project', 'certification', 'practice', 'networking'], default: 'project' },
  status:         { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  estimatedHours: { type: Number, default: 10 },
  dueDate:        { type: Date },
  resources: [{
    title: String,
    url:   String,
    type:  { type: String, default: 'link' },
  }],
  completedAt: { type: Date },
})

const roadmapSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  targetRole:      { type: String, required: true },
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  skillGaps: [{
    skill:        { type: String, required: true },
    importance:   { type: String, enum: ['critical', 'high', 'medium', 'nice_to_have'], default: 'high' },
    currentLevel: { type: String, default: 'beginner' },
    targetLevel:  { type: String, default: 'proficient' },
  }],
  milestones:  [milestoneSchema],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = mongoose.model('Roadmap', roadmapSchema)
