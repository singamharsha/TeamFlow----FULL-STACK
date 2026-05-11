const { body, validationResult } = require('express-validator');

// ── Validation Result Handler ──────────────────────────────
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ── Auth Validators ────────────────────────────────────────
exports.registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// ── Project Validators ─────────────────────────────────────
exports.projectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed'])
    .withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
];

// ── Task Validators ────────────────────────────────────────
exports.taskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done'])
    .withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('project').notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('estimatedHours').optional().isNumeric().withMessage('Estimated hours must be a number')
];
