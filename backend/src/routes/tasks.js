import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import * as db from "../db.js";
import { authRequired } from "../auth.js";
import {
  CATEGORIES,
  TEMPLATES,
  computeReminderTimes,
  expandRecurringForWeek,
  getWeekDates,
  hourSlots,
  plannedMinutes,
  toIsoDate,
  toPublicTask,
  DAY_START_HOUR,
  DAY_END_HOUR,
  timeToMinutes,
  parseLocalDate,
} from "../reminders.js";

const router = Router();
router.use(authRequired);

function validateTime(t) {
  if (t == null || t === "") return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t) || t === "24:00";
}

function validateScheduleWindow(startTime, endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const windowStart = DAY_START_HOUR * 60;
  const windowEnd = DAY_END_HOUR * 60;
  if (startMin != null && (startMin < windowStart || startMin >= windowEnd)) {
    return `Start must be between ${String(DAY_START_HOUR).padStart(2, "0")}:00 and 23:59`;
  }
  if (endMin != null && (endMin < windowStart || endMin > windowEnd)) {
    return `End must be between ${String(DAY_START_HOUR).padStart(2, "0")}:00 and midnight`;
  }
  if (startMin != null && endMin != null && endMin <= startMin) {
    return "End time must be after start time";
  }
  return null;
}

function sortTasks(a, b) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return String(a.start_time || "").localeCompare(String(b.start_time || ""));
}

function collectWeekTasks(userId, weekOf) {
  const dates = getWeekDates(String(weekOf));
  const dateSet = new Set(dates);
  const all = db.listTasks(userId);
  const concrete = all.filter((t) => !t.recurrence && dateSet.has(t.date));
  const masters = all.filter((t) => t.recurrence?.daysOfWeek?.length);
  const virtual = [];
  for (const m of masters) {
    virtual.push(...expandRecurringForWeek(m, dates));
  }
  // If a concrete override exists for same parent+date, skip virtual
  const overrideKeys = new Set(
    concrete
      .filter((t) => t.parent_recurrence_id)
      .map((t) => `${t.parent_recurrence_id}|${t.date}`)
  );
  const filteredVirtual = virtual.filter(
    (v) => !overrideKeys.has(`${v.parent_recurrence_id}|${v.date}`)
  );
  return [...concrete, ...filteredVirtual].sort(sortTasks);
}

function rowFromBody(body, existing = {}) {
  return {
    title: body.title != null ? String(body.title).trim() : existing.title,
    notes: body.notes != null ? String(body.notes) : existing.notes || "",
    date: body.date != null ? body.date : existing.date,
    start_time:
      body.startTime !== undefined ? body.startTime || null : existing.start_time,
    end_time: body.endTime !== undefined ? body.endTime || null : existing.end_time,
    category: body.category || existing.category || "study",
    priority: body.priority || existing.priority || "normal",
    tags: body.tags !== undefined ? body.tags : existing.tags || [],
    recurrence:
      body.recurrence !== undefined ? body.recurrence : existing.recurrence || null,
    notify_at_time:
      body.notifyAtTime !== undefined
        ? body.notifyAtTime
          ? 1
          : 0
        : existing.notify_at_time ?? 1,
    notify_one_day_earlier:
      body.notifyOneDayEarlier !== undefined
        ? body.notifyOneDayEarlier
          ? 1
          : 0
        : existing.notify_one_day_earlier ?? 1,
    notify_minutes_before:
      body.notifyMinutesBefore !== undefined
        ? Number(body.notifyMinutesBefore)
        : existing.notify_minutes_before ?? 15,
    completed:
      body.completed !== undefined
        ? body.completed
          ? 1
          : 0
        : existing.completed ?? 0,
    worked_seconds: existing.worked_seconds || 0,
  };
}

router.get("/meta", (_req, res) => {
  res.json({
    dayStartHour: DAY_START_HOUR,
    dayEndHour: DAY_END_HOUR,
    hourSlots: hourSlots(),
    categories: CATEGORIES,
    templates: TEMPLATES.map(({ id, name, description, tagline }) => ({
      id,
      name,
      description,
      tagline,
    })),
  });
});

router.get("/", (req, res) => {
  const { weekOf, from, to, q, category, completed, tag, today } = req.query;
  let rows;

  if (today === "1") {
    const iso = toIsoDate(new Date());
    rows = collectWeekTasks(req.user.id, iso).filter((t) => t.date === iso);
  } else if (weekOf) {
    rows = collectWeekTasks(req.user.id, String(weekOf));
  } else {
    rows = db.listTasks(req.user.id);
    if (from && to) {
      rows = rows.filter((t) => t.date >= String(from) && t.date <= String(to));
    }
  }

  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.notes || "").toLowerCase().includes(needle) ||
        (t.tags || []).some((x) => String(x).toLowerCase().includes(needle))
    );
  }
  if (category) rows = rows.filter((t) => t.category === category);
  if (tag) {
    rows = rows.filter((t) => (t.tags || []).includes(String(tag)));
  }
  if (completed === "1") rows = rows.filter((t) => t.completed);
  if (completed === "0") rows = rows.filter((t) => !t.completed);

  rows = [...rows].sort(sortTasks);
  res.json(rows.map(toPublicTask));
});

router.get("/reminders/upcoming", (req, res) => {
  const rows = db.listTasks(req.user.id).filter((t) => !t.completed && !t.recurrence);
  const masters = db.listTasks(req.user.id).filter((t) => t.recurrence);
  const week = getWeekDates(toIsoDate(new Date()));
  const expanded = [];
  for (const m of masters) expanded.push(...expandRecurringForWeek(m, week));

  const snoozes = db.listSnoozes(req.user.id);
  const reminders = [];
  for (const row of [...rows, ...expanded]) {
    for (const r of computeReminderTimes(row, new Date(), snoozes)) {
      reminders.push({
        taskId: row.parent_recurrence_id || row.id,
        instanceId: row.id,
        title: row.title,
        date: row.date,
        startTime: row.start_time,
        category: row.category,
        character: toPublicTask(row).character,
        ...r,
      });
    }
  }
  reminders.sort((a, b) => a.fireAt.localeCompare(b.fireAt));
  res.json(reminders);
});

router.post("/reminders/snooze", (req, res) => {
  const { taskId, kind, originalFireAt, minutes = 10 } = req.body || {};
  if (!taskId || !kind || !originalFireAt) {
    return res.status(400).json({ error: "taskId, kind, and originalFireAt required" });
  }
  const until = new Date();
  until.setMinutes(until.getMinutes() + Number(minutes));
  const snooze = db.upsertSnooze(req.user.id, {
    id: uuidv4(),
    taskId,
    kind,
    originalFireAt,
    snoozeUntil: until.toISOString(),
    minutes: Number(minutes),
  });
  res.json({
    ...snooze,
    message: `Snoozed with a Stupefy charm for ${minutes} minutes.`,
  });
});

router.get("/summary/week", (req, res) => {
  const weekOf = String(req.query.weekOf || toIsoDate(new Date()));
  const rows = collectWeekTasks(req.user.id, weekOf);
  let planned = 0;
  let completedPlanned = 0;
  let doneCount = 0;
  let totalCount = rows.length;
  let workedSeconds = 0;

  for (const t of rows) {
    const mins = plannedMinutes(t);
    planned += mins;
    if (t.completed) {
      doneCount += 1;
      completedPlanned += mins;
    }
    workedSeconds += t.worked_seconds || 0;
  }

  const sessions = db.listTimerSessions(req.user.id);
  const weekDates = new Set(getWeekDates(weekOf));
  for (const s of sessions) {
    const day = (s.endedAt || s.startedAt || "").slice(0, 10);
    if (weekDates.has(day) && s.seconds) workedSeconds += 0; // already on task; avoid double if we only use task.worked_seconds
  }

  // Sum timer sessions that completed this week (in addition to task totals already stored)
  const sessionSeconds = sessions
    .filter((s) => s.endedAt && weekDates.has(s.endedAt.slice(0, 10)))
    .reduce((a, s) => a + (s.seconds || 0), 0);

  // Prefer max of accumulated task worked_seconds vs session sum to avoid confusion — use task field as source of truth
  const percentComplete = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const housePoints = doneCount * 10 + Math.floor(workedSeconds / 600);

  res.json({
    weekOf,
    totalTasks: totalCount,
    completedTasks: doneCount,
    percentComplete,
    plannedMinutes: planned,
    completedPlannedMinutes: completedPlanned,
    workedSeconds,
    sessionSecondsThisWeek: sessionSeconds,
    housePoints,
    motto:
      percentComplete >= 80
        ? "Outstanding OWL — Dumbledore would be proud."
        : percentComplete >= 50
          ? "Exceeds Expectations. Keep your wand steady."
          : "Acceptable… but the Sorting Hat expects more.",
  });
});

router.get("/templates", (_req, res) => {
  res.json(TEMPLATES);
});

router.post("/templates/:id/apply", (req, res) => {
  const tpl = TEMPLATES.find((t) => t.id === req.params.id);
  if (!tpl) return res.status(404).json({ error: "Template scroll not found." });
  const startDate = req.body?.startDate || toIsoDate(new Date());
  const base = parseLocalDate(startDate);
  const now = new Date().toISOString();
  const created = tpl.tasks.map((t) => {
    const d = new Date(base);
    d.setDate(base.getDate() + (t.offsetDays || 0));
    return {
      id: uuidv4(),
      title: t.title,
      notes: `From template: ${tpl.name}`,
      date: toIsoDate(d),
      start_time: t.startTime,
      end_time: t.endTime,
      category: t.category,
      priority: "normal",
      tags: ["template", tpl.id],
      recurrence: null,
      notify_at_time: 1,
      notify_one_day_earlier: 1,
      notify_minutes_before: 15,
      completed: 0,
      worked_seconds: 0,
      created_at: now,
      updated_at: now,
    };
  });
  db.insertTasks(req.user.id, created);
  res.status(201).json(created.map(toPublicTask));
});

router.get("/export/csv", (req, res) => {
  const rows = db.listTasks(req.user.id);
  const header = [
    "id",
    "title",
    "notes",
    "date",
    "startTime",
    "endTime",
    "category",
    "priority",
    "tags",
    "completed",
    "workedSeconds",
  ];
  const lines = [header.join(",")];
  for (const t of rows) {
    const vals = [
      t.id,
      t.title,
      t.notes,
      t.date,
      t.start_time || "",
      t.end_time || "",
      t.category || "",
      t.priority || "",
      (t.tags || []).join("|"),
      t.completed ? "1" : "0",
      t.worked_seconds || 0,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(vals.join(","));
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="hogwarts-planner.csv"');
  res.send(lines.join("\n"));
});

router.get("/export/ics", (req, res) => {
  const rows = db.listTasks(req.user.id).filter((t) => t.start_time && !t.recurrence);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hogwarts Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const t of rows) {
    const start = toIcsStamp(t.date, t.start_time);
    const end = toIcsStamp(t.date, t.end_time || t.start_time);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@hogwarts-planner`,
      `DTSTAMP:${toIcsUtcNow()}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(t.title)}`,
      `DESCRIPTION:${escapeIcs(t.notes || "")}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", 'attachment; filename="hogwarts-planner.ics"');
  res.send(lines.join("\r\n"));
});

function toIcsStamp(date, time) {
  const t = time === "24:00" ? "2359" : time.replace(":", "");
  return `${date.replace(/-/g, "")}T${t.padEnd(6, "0")}`;
}

function toIcsUtcNow() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

router.get("/backup", (req, res) => {
  const data = db.getBackup(req.user.id);
  res.setHeader("Content-Disposition", 'attachment; filename="hogwarts-backup.json"');
  res.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    wizard: req.user.email,
    ...data,
  });
});

router.post("/backup/restore", (req, res) => {
  const data = req.body || {};
  if (!Array.isArray(data.tasks)) {
    return res.status(400).json({ error: "Backup must include a tasks array." });
  }
  db.restoreBackup(req.user.id, data);
  res.json({ ok: true, message: "Memory restored from the Pensieve." });
});

router.post("/import/csv", (req, res) => {
  const { csv } = req.body || {};
  if (!csv) return res.status(400).json({ error: "csv string required" });
  const lines = String(csv).trim().split(/\r?\n/);
  if (lines.length < 2) return res.status(400).json({ error: "No rows found" });
  const now = new Date().toISOString();
  const created = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    if (!cols[1]) continue;
    created.push({
      id: uuidv4(),
      title: cols[1],
      notes: cols[2] || "",
      date: cols[3] || toIsoDate(new Date()),
      start_time: cols[4] || null,
      end_time: cols[5] || null,
      category: cols[6] || "study",
      priority: cols[7] || "normal",
      tags: cols[8] ? cols[8].split("|") : ["imported"],
      recurrence: null,
      notify_at_time: 1,
      notify_one_day_earlier: 1,
      notify_minutes_before: 15,
      completed: cols[9] === "1" ? 1 : 0,
      worked_seconds: Number(cols[10]) || 0,
      created_at: now,
      updated_at: now,
    });
  }
  db.insertTasks(req.user.id, created);
  res.status(201).json({ imported: created.length, tasks: created.map(toPublicTask) });
});

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// Timer — Time-Turner
router.get("/timer/active", (req, res) => {
  const sessions = db.listTimerSessions(req.user.id);
  const active = sessions.find((s) => !s.endedAt);
  res.json(active || null);
});

router.post("/timer/start", (req, res) => {
  const { taskId } = req.body || {};
  const sessions = db.listTimerSessions(req.user.id);
  const active = sessions.find((s) => !s.endedAt);
  if (active) {
    return res.status(409).json({ error: "A Time-Turner is already spinning.", session: active });
  }
  if (taskId) {
    const task = db.getTask(req.user.id, taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
  }
  const session = db.insertTimerSession(req.user.id, {
    id: uuidv4(),
    taskId: taskId || null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    seconds: 0,
  });
  res.status(201).json(session);
});

router.post("/timer/stop", (req, res) => {
  const sessions = db.listTimerSessions(req.user.id);
  const active = sessions.find((s) => !s.endedAt);
  if (!active) return res.status(404).json({ error: "No active Time-Turner." });
  const endedAt = new Date();
  const seconds = Math.max(
    0,
    Math.floor((endedAt - new Date(active.startedAt)) / 1000)
  );
  const updated = db.updateTimerSession(req.user.id, active.id, {
    endedAt: endedAt.toISOString(),
    seconds,
  });
  if (active.taskId) {
    const task = db.getTask(req.user.id, active.taskId);
    if (task) {
      db.updateTask(req.user.id, active.taskId, {
        worked_seconds: (task.worked_seconds || 0) + seconds,
        updated_at: endedAt.toISOString(),
      });
    }
  }
  res.json(updated);
});

router.get("/:id", (req, res) => {
  const row = db.getTask(req.user.id, req.params.id);
  if (!row) return res.status(404).json({ error: "Task not found in the Room of Requirement." });
  res.json(toPublicTask(row));
});

router.post("/", (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return res.status(400).json({ error: "Valid date required" });
  }
  if (!validateTime(body.startTime) || !validateTime(body.endTime)) {
    return res.status(400).json({ error: "Invalid time" });
  }
  const windowErr = validateScheduleWindow(body.startTime, body.endTime);
  if (windowErr) return res.status(400).json({ error: windowErr });

  const now = new Date().toISOString();
  const fields = rowFromBody(body);
  const row = {
    id: uuidv4(),
    ...fields,
    notify_at_time: fields.notify_at_time ? 1 : 0,
    notify_one_day_earlier: fields.notify_one_day_earlier ? 1 : 0,
    completed: fields.completed ? 1 : 0,
    created_at: now,
    updated_at: now,
  };
  db.insertTask(req.user.id, row);
  res.status(201).json(toPublicTask(row));
});

router.put("/:id", (req, res) => {
  const existing = db.getTask(req.user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found" });
  const fields = rowFromBody(req.body || {}, existing);
  if (!fields.title) return res.status(400).json({ error: "Title required" });
  if (!validateTime(fields.start_time) || !validateTime(fields.end_time)) {
    return res.status(400).json({ error: "Invalid time" });
  }
  const windowErr = validateScheduleWindow(fields.start_time, fields.end_time);
  if (windowErr) return res.status(400).json({ error: windowErr });

  const row = db.updateTask(req.user.id, req.params.id, {
    ...fields,
    notify_at_time: fields.notify_at_time ? 1 : 0,
    notify_one_day_earlier: fields.notify_one_day_earlier ? 1 : 0,
    completed: fields.completed ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  res.json(toPublicTask(row));
});

router.patch("/:id/complete", (req, res) => {
  const existing = db.getTask(req.user.id, req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found" });
  const completed = req.body?.completed !== undefined ? Boolean(req.body.completed) : !existing.completed;
  const row = db.updateTask(req.user.id, req.params.id, {
    completed: completed ? 1 : 0,
    updated_at: new Date().toISOString(),
  });
  res.json(toPublicTask(row));
});

router.delete("/:id", (req, res) => {
  const ok = db.deleteTask(req.user.id, req.params.id);
  if (!ok) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

export default router;
