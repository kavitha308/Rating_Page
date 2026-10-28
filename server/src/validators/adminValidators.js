const { body, param } = require('express-validator');
const { ROLE_LIST } = require('../constants/roles');

const createUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 20, max: 60 })
    .withMessage('Name must be between 20 and 60 characters long'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be between 8 and 16 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 400 })
    .withMessage('Address cannot exceed 400 characters'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(ROLE_LIST)
    .withMessage(`Role must be one of: ${ROLE_LIST.join(', ')}`)
];

const createStoreValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters long'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Store contact email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Store address is required')
    .isLength({ max: 400 })
    .withMessage('Store address cannot exceed 400 characters'),

  body('ownerId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Owner ID must be a positive integer')
];

const userIdParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID')
];

const storeIdParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid store ID')
];

const updateStoreValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters long'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Store contact email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Store address is required')
    .isLength({ max: 400 })
    .withMessage('Store address cannot exceed 400 characters'),

  body('ownerId')
    .optional({ nullable: true })
    .custom((val) => val === null || val === '' || (Number.isInteger(Number(val)) && Number(val) > 0))
    .withMessage('Owner ID must be a valid user ID or null')
];

module.exports = {
  createUserValidator,
  createStoreValidator,
  updateStoreValidator,
  userIdParamValidator,
  storeIdParamValidator
};
