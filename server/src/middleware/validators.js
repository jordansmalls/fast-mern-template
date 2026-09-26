import { body, query } from "express-validator";

const emailRule = (field = "email") =>
    body(field)
        .exists({ values: "falsy" })
        .withMessage("Email is required")
        .bail()
        .isString()
        .withMessage("Email must be a string")
        .bail()
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Please provide a valid email address")
        .isLength({ max: 254 })
        .withMessage("Email is too long");

const passwordRule = (field = "password", { optional = false } = {}) => {
    const chain = optional
        ? body(field).optional()
        : body(field).exists({ values: "falsy" }).withMessage("Password is required").bail();
    return chain
        .isString()
        .withMessage("Password must be a string")
        .bail()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long");
};

export const signupValidators = [emailRule(), passwordRule()];

export const loginValidators = [emailRule(), passwordRule()];

export const updateMeValidators = [emailRule().optional(), passwordRule("password", { optional: true })];

export const emailAvailableValidators = [
    query("email")
        .exists({ values: "falsy" })
        .withMessage("Email query parameter is required")
        .bail()
        .isString()
        .withMessage("Email must be a string")
        .bail()
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Please provide a valid email address"),
];
