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
  phone:         Joi.string().allow('', null),
  linkedinUrl:   Joi.string().uri().allow('', null),
  githubUrl:     Joi.string().uri().allow('', null),
  portfolioUrl:  Joi.string().uri().allow('', null),
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

const createApplicationSchema = Joi.object({
  jobId:         Joi.string().hex().length(24).allow(null, ''),
  company:       Joi.string().trim().required(),
  role:          Joi.string().trim().required(),
  location:      Joi.string().trim().default('Remote'),
  jobUrl:        Joi.string().uri().allow('', null),
  status:        Joi.string().valid('Bookmarked', 'Applied', 'Screening', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn').default('Applied'),
  appliedDate:   Joi.date().iso().allow(null),
  deadline:      Joi.date().iso().allow(null),
  salaryOffered: Joi.string().allow('', null),
  notes:         Joi.string().allow('', null),
})

const updateApplicationSchema = Joi.object({
  status:        Joi.string().valid('Bookmarked', 'Applied', 'Screening', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn'),
  company:       Joi.string().trim(),
  role:          Joi.string().trim(),
  location:      Joi.string().trim(),
  jobUrl:        Joi.string().uri().allow('', null),
  appliedDate:   Joi.date().iso().allow(null),
  deadline:      Joi.date().iso().allow(null),
  salaryOffered: Joi.string().allow('', null),
  notes:         Joi.string().allow('', null),
  interviews:    Joi.array().items(Joi.object({
    stage:       Joi.string().required(),
    date:        Joi.date().iso().allow(null),
    interviewer: Joi.string().allow('', null),
    notes:       Joi.string().allow('', null),
  })),
})

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  createApplicationSchema,
  updateApplicationSchema,
}
