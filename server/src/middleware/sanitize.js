import mongoSanitize from "express-mongo-sanitize";

const { sanitize } = mongoSanitize;

// express-mongo-sanitize's built-in middleware does `req.query = ...`,
// which throws in Express 5 because req.query is getter-only. This wrapper
// sanitizes in place (the library mutates nested objects by reference)
// so nothing is ever reassigned on the request object.
const sanitizeRequest = (req, _res, next) => {
    if (req.body) {
        sanitize(req.body);
    }
    if (req.params) {
        sanitize(req.params);
    }
    if (req.query) {
        sanitize(req.query);
    }
    next();
};

export default sanitizeRequest;
