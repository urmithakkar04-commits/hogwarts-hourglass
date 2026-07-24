import jwt from "jsonwebtoken";
import { findUserById } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "hogwarts-marauders-map-secret";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "The Fat Lady requires a password — please log in." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "Wizard not found in the book of admissions." });
    req.user = { id: user.id, email: user.email, name: user.name, house: user.house };
    next();
  } catch {
    return res.status(401).json({ error: "Your Time-Turner token has expired. Log in again." });
  }
}

export { JWT_SECRET };
