export const DAY_START_HOUR = 5;
export const DAY_END_HOUR = 24;

export const CATEGORIES = [
  {
    id: "study",
    label: "Study",
    house: "Ravenclaw",
    color: "#0e1a40",
    accent: "#946b2d",
    character: "Hermione",
    motto: "Wit beyond measure",
  },
  {
    id: "project",
    label: "Project",
    house: "Gryffindor",
    color: "#740001",
    accent: "#d3a625",
    character: "Harry",
    motto: "Dare and do",
  },
  {
    id: "class",
    label: "Class",
    house: "Hufflepuff",
    color: "#ecb939",
    accent: "#372e29",
    character: "Neville",
    motto: "Loyal and true",
  },
  {
    id: "personal",
    label: "Personal",
    house: "Slytherin",
    color: "#1a472a",
    accent: "#aaaaaa",
    character: "Luna",
    motto: "Uncommon wisdom",
  },
];

export const TEMPLATES = [
  {
    id: "owl-week",
    name: "OWL Week",
    description: "Exam-week spellwork — morning revision, afternoon papers, evening review.",
    tagline: "Ordinary Wizarding Levels await.",
    tasks: [
      { title: "Charms revision", category: "study", startTime: "06:00", endTime: "08:00", offsetDays: 0 },
      { title: "Transfiguration paper", category: "class", startTime: "10:00", endTime: "12:00", offsetDays: 0 },
      { title: "Potions review", category: "study", startTime: "14:00", endTime: "16:00", offsetDays: 1 },
      { title: "Defence practical", category: "class", startTime: "10:00", endTime: "12:00", offsetDays: 2 },
      { title: "Astronomy charting", category: "study", startTime: "20:00", endTime: "22:00", offsetDays: 2 },
      { title: "Herbology notes", category: "study", startTime: "07:00", endTime: "09:00", offsetDays: 3 },
      { title: "History of Magic essay", category: "project", startTime: "15:00", endTime: "18:00", offsetDays: 4 },
    ],
  },
  {
    id: "assignment-sprint",
    name: "Assignment Sprint",
    description: "McGonagall-approved essay blitz across three focused evenings.",
    tagline: "Ten points to your house for finishing.",
    tasks: [
      { title: "Outline & research", category: "project", startTime: "18:00", endTime: "20:00", offsetDays: 0 },
      { title: "First draft", category: "project", startTime: "18:00", endTime: "21:00", offsetDays: 1 },
      { title: "Edit & cite sources", category: "study", startTime: "17:00", endTime: "19:00", offsetDays: 2 },
      { title: "Final polish & submit", category: "project", startTime: "16:00", endTime: "18:00", offsetDays: 3 },
    ],
  },
  {
    id: "quidditch-focus",
    name: "Quidditch Focus Week",
    description: "Training blocks balanced with recovery — catch the Snitch of deep work.",
    tagline: "The Golden Snitch awaits the focused seeker.",
    tasks: [
      { title: "Warm-up deep work", category: "study", startTime: "05:30", endTime: "07:00", offsetDays: 0 },
      { title: "Main pitch — core project", category: "project", startTime: "09:00", endTime: "12:00", offsetDays: 0 },
      { title: "Recovery walk / personal", category: "personal", startTime: "17:00", endTime: "18:00", offsetDays: 0 },
      { title: "Evening tactics review", category: "study", startTime: "20:00", endTime: "21:30", offsetDays: 2 },
      { title: "Match-day execution", category: "project", startTime: "10:00", endTime: "14:00", offsetDays: 4 },
    ],
  },
];

const COMPLETE_CHARACTERS = {
  study: {
    id: "hermione",
    name: "Hermione Granger",
    title: "Prefect of Study",
    quote: "When in doubt, go to the library.",
    mood: "complete",
    glyph: "📚",
    shortName: "Hermione",
    image: "/characters/hermione.png",
  },
  project: {
    id: "harry",
    name: "Harry Potter",
    title: "Project Seeker",
    quote: "The Snitch is caught — this work is done.",
    mood: "complete",
    glyph: "⚡",
    shortName: "Harry",
    image: "/characters/harry.png",
  },
  class: {
    id: "mcgonagall",
    name: "Minerva McGonagall",
    title: "Transfiguration Mistress",
    quote: "This classwork is complete. Ten points.",
    mood: "complete",
    glyph: "🪄",
    shortName: "McGonagall",
    image: "/characters/mcgonagall.png",
  },
  personal: {
    id: "dobby",
    name: "Dobby",
    title: "Free Elf",
    quote: "Dobby is happy this task is finished!",
    mood: "complete",
    glyph: "🧦",
    shortName: "Dobby",
    image: "/characters/dobby.png",
  },
};

/** Bonus figures available for variety on completed work with matching tags. */
export const EXTRA_FIGURES = {
  ron: {
    id: "ron",
    name: "Ron Weasley",
    shortName: "Ron",
    image: "/characters/ron.png",
    glyph: "♟️",
  },
  hagrid: {
    id: "hagrid",
    name: "Rubeus Hagrid",
    shortName: "Hagrid",
    image: "/characters/hagrid.png",
    glyph: "🐉",
  },
  dumbledore: {
    id: "dumbledore",
    name: "Albus Dumbledore",
    shortName: "Dumbledore",
    image: "/characters/dumbledore.png",
    glyph: "✨",
  },
};

/** Incomplete work always watched by Snape; completed work shows real film figures. */
export function characterForTask(task) {
  const cat = CATEGORIES.find((c) => c.id === task.category) || CATEGORIES[0];

  if (!task.completed) {
    return {
      id: "snape",
      name: "Severus Snape",
      title: "Potions Master — Incomplete",
      quote: "Clearly incomplete. Detention until this is finished.",
      mood: "incomplete",
      house: "Slytherin",
      glyph: "🧪",
      shortName: "Snape",
      image: "/characters/snape.png",
    };
  }

  const tags = (task.tags || []).map((t) => String(t).toLowerCase());
  if (tags.includes("ron")) {
    return {
      ...COMPLETE_CHARACTERS.project,
      ...EXTRA_FIGURES.ron,
      mood: "complete",
      house: cat.house,
      quote: "Bloody hell — you actually finished it!",
      title: "Best Mate",
    };
  }
  if (tags.includes("hagrid")) {
    return {
      ...COMPLETE_CHARACTERS.class,
      ...EXTRA_FIGURES.hagrid,
      mood: "complete",
      house: cat.house,
      quote: "Great job, that is. Huge.",
      title: "Keeper of Keys",
    };
  }
  if (tags.includes("dumbledore")) {
    return {
      ...COMPLETE_CHARACTERS.study,
      ...EXTRA_FIGURES.dumbledore,
      mood: "complete",
      house: cat.house,
      quote: "Happiness can be found in finished work.",
      title: "Headmaster",
    };
  }

  const base = COMPLETE_CHARACTERS[task.category] || COMPLETE_CHARACTERS.study;
  return { ...base, house: cat.house };
}

export function computeReminderTimes(task, now = new Date(), snoozes = []) {
  const results = [];
  const due = parseLocalDate(task.date);
  if (!due) return results;

  if (task.notify_one_day_earlier) {
    const dayBefore = new Date(due);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(9, 0, 0, 0);
    const original = dayBefore.toISOString();
    const fireAt = applySnooze(original, task.id, "one_day_earlier", snoozes);
    if (new Date(fireAt) > now) {
      results.push({
        fireAt,
        originalFireAt: original,
        kind: "one_day_earlier",
        label: `Owl Post: ${task.title}`,
        message: `A Howler approaches — "${task.title}" is scheduled for ${formatDisplayDate(task.date)}. One day early reminder.`,
      });
    }
  }

  if (task.notify_at_time && task.start_time) {
    const [h, m] = task.start_time.split(":").map(Number);
    const at = new Date(due);
    at.setHours(h, m || 0, 0, 0);
    const minutesBefore = Number(task.notify_minutes_before) || 0;
    if (minutesBefore > 0) at.setMinutes(at.getMinutes() - minutesBefore);
    const original = at.toISOString();
    const fireAt = applySnooze(original, task.id, "timed", snoozes);
    if (new Date(fireAt) > now) {
      results.push({
        fireAt,
        originalFireAt: original,
        kind: "timed",
        label: `Time-Turner: ${task.title}`,
        message: `"${task.title}" begins at ${task.start_time} on ${formatDisplayDate(task.date)}.`,
      });
    }
  }

  return results;
}

function applySnooze(originalFireAt, taskId, kind, snoozes) {
  const hit = snoozes.find(
    (s) =>
      s.taskId === taskId &&
      s.kind === kind &&
      s.originalFireAt === originalFireAt &&
      new Date(s.snoozeUntil) > new Date()
  );
  return hit ? hit.snoozeUntil : originalFireAt;
}

export function parseLocalDate(yyyyMmDd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatDisplayDate(yyyyMmDd) {
  const d = parseLocalDate(yyyyMmDd);
  if (!d) return yyyyMmDd;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function toPublicTask(row) {
  const character = characterForTask(row);
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category || "study",
    priority: row.priority || "normal",
    tags: row.tags || [],
    recurrence: row.recurrence || null,
    parentRecurrenceId: row.parent_recurrence_id || null,
    notifyAtTime: Boolean(row.notify_at_time),
    notifyOneDayEarlier: Boolean(row.notify_one_day_earlier),
    notifyMinutesBefore: row.notify_minutes_before,
    completed: Boolean(row.completed),
    workedSeconds: row.worked_seconds || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    character,
  };
}

export function getWeekDates(anchorIsoDate) {
  const base = parseLocalDate(anchorIsoDate) || new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toIsoDate(d));
  }
  return dates;
}

export function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function hourSlots() {
  const slots = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

export function timeToMinutes(t) {
  if (!t) return null;
  if (t === "24:00") return 24 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function plannedMinutes(task) {
  const s = timeToMinutes(task.start_time || task.startTime);
  const e = timeToMinutes(task.end_time || task.endTime);
  if (s == null || e == null || e <= s) return 60;
  return e - s;
}

/**
 * Expand a recurring master task into concrete instances for a week.
 * recurrence: { daysOfWeek: [1,3,5], startTime, endTime } — Mon=1 … Sun=7
 */
export function expandRecurringForWeek(master, weekDates) {
  if (!master.recurrence?.daysOfWeek?.length) return [];
  const days = new Set(master.recurrence.daysOfWeek.map(Number));
  const instances = [];

  for (const date of weekDates) {
    const d = parseLocalDate(date);
    let dow = d.getDay(); // 0 Sun
    dow = dow === 0 ? 7 : dow;
    if (!days.has(dow)) continue;
    if (master.date && date < master.date) continue;
    if (master.recurrence.until && date > master.recurrence.until) continue;

    instances.push({
      ...master,
      id: `${master.id}__${date}`,
      date,
      start_time: master.recurrence.startTime || master.start_time,
      end_time: master.recurrence.endTime || master.end_time,
      parent_recurrence_id: master.id,
      is_virtual: true,
    });
  }
  return instances;
}
