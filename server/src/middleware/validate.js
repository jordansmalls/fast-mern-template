import { validationResult } from "express-validator";
import AppError from "../utils/app-error.js";

// Turns express-validator failures into the template error shape.
const validate = (req, _res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const first = errors.array()[0];
    return next(new AppError(400, first.msg || "Invalid request data"));
};

export default validate;
