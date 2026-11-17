import rateLimit from "express-rate-limit";

/**
 * Strip MongoDB operator keys (`$gt`, `$ne`, ...) from user input so request
 * data can never turn into a query operator (NoSQL injection).
 */
const stripOperators = (value) => {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$")) {
        delete value[key];
      } else {
        value[key] = stripOperators(value[key]);
      }
    }
  }
  return value;
};

export const sanitizeMongoInput = (req, _res, next) => {
  if (req.body) stripOperators(req.body);
  if (req.query) stripOperators(req.query);
  if (req.params) stripOperators(req.params);
  next();
};

/**
 * Allow the request when the authenticated user is the owner of the resource
 * named by `req.params[param]`, or holds `capability` (admins / staff).
 * Must run after rbac `requireSignIn`.
 */
export const requireSelfOrCapability = (param, capability) => (req, res, next) => {
  const ownerId = req.params[param];
  if (req.user && String(req.user._id) === String(ownerId)) return next();
  if (req.user?.capabilities?.includes(capability)) return next();
  return res.status(403).send({ success: false, message: "Access denied" });
};

const limiter = (windowMinutes, max) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  });

// SMS OTP costs money per send
export const otpLimiter = limiter(15, 10);
// Login / password reset brute force
export const authLimiter = limiter(15, 30);
