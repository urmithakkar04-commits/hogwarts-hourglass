import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    app: "Hogwarts Hourglass API",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "hogwarts-planner-api",
    motto: "I solemnly swear I am up to no good.",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "A magical mishap occurred in the dungeons." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hogwarts Hourglass API on http://0.0.0.0:${PORT}`);
});
