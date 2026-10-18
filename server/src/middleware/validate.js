function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map(d => d.message)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }

    req[source] = value
    next()
  }
}

module.exports = validate
