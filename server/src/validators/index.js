const Joi = require('joi')

const registerSchema = Joi.object({
  name:          Joi.string().trim().min(2).max(120).required(),
  email:         Joi.string().email().lowercase().trim().required(),
  password:      Joi.string().min(6).max(72).required(),
  currentStatus: Joi.string().valid('Student', 'Fresher', 'Working Professional', 'Career Switcher', 'Other').default('Student'),
  role:          Joi.string().valid('Student', 'Fresher', 'Working Professional', 'Career Switcher', 'Other').optional(),
})

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
})

const updateProfileSchema = Joi.object({
  name:          Joi.string().trim().min(2).max(120),
  currentStatus: Joi.string().valid('Student', 'Fresher', 'Working Professional', 'Career Switcher', 'Other'),
  phone:         Joi.string().trim().allow('', null),
  linkedinUrl:   Joi.string().trim().allow('', null),
  githubUrl:     Joi.string().trim().allow('', null),
  portfolioUrl:  Joi.string().trim().allow('', null),
  bio:           Joi.string().max(500).allow('', null),
})

const updatePreferencesSchema = Joi.object({
  targetRoles:        Joi.array().items(Joi.string().trim()),
  locations:          Joi.array().items(Joi.string().trim()),
  jobTypes:           Joi.array().items(Joi.string().trim()),
  workModes:          Joi.array().items(Joi.string().trim()),
  minSalary:          Joi.number().min(0).allow(null),
  jobMatchAlerts:     Joi.boolean(),
  deadlineReminders:  Joi.boolean(),
  systemUpdates:      Joi.boolean(),
  weeklyDigest:       Joi.boolean(),
  emailEnabled:       Joi.boolean(),
  emailDigest:        Joi.boolean(),
  pushEnabled:        Joi.boolean(),
  minMatchScore:      Joi.number().min(0).max(100),
  quietHoursEnabled:  Joi.boolean(),
  quietStart:         Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('', null),
  quietEnd:           Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).allow('', null),
  discoveryEnabled:   Joi.boolean(),
  discoveryFrequency: Joi.string().valid('hourly', 'daily', 'weekly'),
})

const VALID_APPLICATION_STATUSES = [
  'Interested', 'Saved', 'Bookmarked', 'Ready to Apply',
  'Applied', 'Screening', 'Assessment', 'Interview',
  'Interviewing', 'Offer', 'Offered', 'Rejected', 'Withdrawn'
]

const createApplicationSchema = Joi.object({
  jobId:         Joi.string().hex().length(24).allow(null, ''),
  company:       Joi.string().trim().allow('', null),
  role:          Joi.string().trim().allow('', null),
  location:      Joi.string().trim().allow('', null).default('Remote'),
  jobUrl:        Joi.string().allow('', null),
  applyUrl:      Joi.string().allow('', null),
  status:        Joi.string().valid(...VALID_APPLICATION_STATUSES).default('Applied'),
  appliedDate:   Joi.date().iso().allow(null, ''),
  appliedAt:     Joi.date().iso().allow(null, ''),
  deadline:      Joi.date().iso().allow(null, ''),
  salaryOffered: Joi.string().allow('', null),
  notes:         Joi.string().allow('', null),
}).unknown(true)

const updateApplicationSchema = Joi.object({
  status:        Joi.string().valid(...VALID_APPLICATION_STATUSES),
  company:       Joi.string().trim().allow('', null),
  role:          Joi.string().trim().allow('', null),
  location:      Joi.string().trim().allow('', null),
  jobUrl:        Joi.string().allow('', null),
  applyUrl:      Joi.string().allow('', null),
  appliedDate:   Joi.date().iso().allow(null, ''),
  appliedAt:     Joi.date().iso().allow(null, ''),
  deadline:      Joi.date().iso().allow(null, ''),
  salaryOffered: Joi.string().allow('', null),
  notes:         Joi.string().allow('', null),
  interviews:    Joi.array().items(Joi.object({
    stage:       Joi.string().required(),
    date:        Joi.date().iso().allow(null, ''),
    interviewer: Joi.string().allow('', null),
    notes:       Joi.string().allow('', null),
  })),
}).unknown(true)

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  createApplicationSchema,
  updateApplicationSchema,
}
