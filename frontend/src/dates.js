export function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getMonday(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

export function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toIsoDate(d);
  });
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function formatWeekRange(monday) {
  const end = addDays(monday, 6);
  const opts = { month: "short", day: "numeric" };
  const y = monday.getFullYear() !== end.getFullYear();
  return `${monday.toLocaleDateString(undefined, {
    ...opts,
    year: y ? "numeric" : undefined,
  })} – ${end.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
}

export function formatHourLabel(hhmm) {
  const [h] = hhmm.split(":").map(Number);
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

export function timeToMinutes(t) {
  if (!t) return null;
  if (t === "24:00") return 24 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Position task block within 05:00–24:00 grid (19 hours). */
export function taskLayout(task, dayStart = 5, dayEnd = 24) {
  const start = timeToMinutes(task.startTime) ?? dayStart * 60;
  const end = timeToMinutes(task.endTime) ?? start + 60;
  const total = (dayEnd - dayStart) * 60;
  const top = ((Math.max(start, dayStart * 60) - dayStart * 60) / total) * 100;
  const height =
    ((Math.min(end, dayEnd * 60) - Math.max(start, dayStart * 60)) / total) * 100;
  return { top: `${Math.max(0, top)}%`, height: `${Math.max(2.2, height)}%` };
}

/** Every-minute options 05:00–23:59, plus midnight end. */
export function buildHourOptions(startHour = 5, endHour = 24, stepMinutes = 1) {
  const opts = [];
  const start = startHour * 60;
  const end = endHour * 60;
  for (let m = start; m < end; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    opts.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  opts.push("24:00");
  return opts;
}

/** Normalize browser time input to HH:MM (supports 24:00). */
export function normalizeTimeValue(value) {
  if (!value) return "";
  if (value === "24:00") return "24:00";
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!m) return value;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h === 24 && min === 0) return "24:00";
  if (h < 0 || h > 23 || min < 0 || min > 59) return value;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
