import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createUser, findUserByEmail } from "../db.js";
import { signToken, authRequired } from "../auth.js";
import { CATEGORIES } from "../reminders.js";

const router = Router();

const HOUSES = ["Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"];

router.post("/register", async (req, res) => {
  const { name, email, password, house } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, owl-post email, and password are required." });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters." });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "That owl address is already enrolled at Hogwarts." });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = createUser({
    id: uuidv4(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: hash,
    house: HOUSES.includes(house) ? house : "Gryffindor",
    createdAt: new Date().toISOString(),
  });

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, house: user.house },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email || "");
  if (!user) return res.status(401).json({ error: "No such witch or wizard." });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Alohomora failed — wrong password." });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, house: user.house },
  });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user, categories: CATEGORIES });
});

export default router;
