import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";
import {
  addDays,
  formatWeekRange,
  getMonday,
  getWeekDates,
  toIsoDate,
} from "./dates";
import {
  createReminderWatcher,
  ensureNotificationPermission,
} from "./notifications";
import AuthScreen from "./components/AuthScreen";
import WeekGrid from "./components/WeekGrid";
import TaskModal from "./components/TaskModal";
import RemindersPanel from "./components/RemindersPanel";
import AgendaView from "./components/AgendaView";
import TimerPanel from "./components/TimerPanel";
import WeeklySummary from "./components/WeeklySummary";
import TemplatesPanel from "./components/TemplatesPanel";
import { CATEGORY_STYLE } from "./hp";

const THEME_KEY = "hogwarts-theme";

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const DEFAULT_SLOTS = Array.from({ length: 19 }, (_, i) =>
  `${String(i + 5).padStart(2, "0")}:00`
);

const DEFAULT_CATEGORIES = [
  { id: "study", label: "Study", house: "Ravenclaw" },
  { id: "project", label: "Project", house: "Gryffindor" },
  { id: "class", label: "Class", house: "Hufflepuff" },
  { id: "personal", label: "Personal", house: "Slytherin" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);
  const [view, setView] = useState("week"); // week | agenda
  const [monday, setMonday] = useState(() => getMonday());
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [hourSlots, setHourSlots] = useState(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notifyStatus, setNotifyStatus] = useState("default");
  const [activeTimer, setActiveTimer] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    completed: "",
    tag: "",
  });

  const weekDates = useMemo(() => getWeekDates(monday), [monday]);
  const weekOf = weekDates[0];
  const todayIso = toIsoDate(new Date());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .me()
      .then((data) => {
        setUser(data.user);
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => setToken(null))
      .finally(() => setAuthChecking(false));
  }, []);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.category) params.category = filters.category;
      if (filters.completed !== "") params.completed = filters.completed;
      if (filters.tag) params.tag = filters.tag;

      const [meta, weekTasks, upcoming, sum, tpls, today, timer] =
        await Promise.all([
          api.getMeta().catch(() => null),
          api.getWeek(weekOf, params),
          api.getReminders(),
          api.getSummary(weekOf),
          api.getTemplates(),
          api.getToday(params),
          api.getActiveTimer(),
        ]);
      if (meta?.hourSlots?.length) setHourSlots(meta.hourSlots);
      if (meta?.categories) setCategories(meta.categories);
      setTasks(weekTasks);
      setReminders(upcoming);
      setSummary(sum);
      setTemplates(tpls);
      setTodayTasks(today);
      setActiveTimer(timer);
    } catch (e) {
      if (e.status === 401) {
        setToken(null);
        setUser(null);
      }
      setError(e.message || "Failed to load the Marauder's Map.");
    } finally {
      setLoading(false);
    }
  }, [weekOf, filters]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    if (!user) return undefined;
    const watcher = createReminderWatcher(() => api.getReminders());
    watcher.start();
    return () => watcher.stop();
  }, [user]);

  if (authChecking) {
    return <div className="boot">Opening the Marauder&apos;s Map…</div>;
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          className="theme-fab"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <AuthScreen onAuth={setUser} />
      </>
    );
  }

  async function enableNotifications() {
    setNotifyStatus(await ensureNotificationPermission());
  }

  function openNew(date, startTime) {
    const [h, m] = (startTime || "09:00").split(":").map(Number);
    const endH = Math.min(h + 1, 24);
    const endTime =
      endH === 24
        ? "24:00"
        : `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setEditing({
      date,
      startTime: startTime || "09:00",
      endTime,
      category: "study",
      notifyAtTime: true,
      notifyOneDayEarlier: true,
      notifyMinutesBefore: 15,
    });
    setModalOpen(true);
  }

  function openEdit(task) {
    if (String(task.id).includes("__")) {
      setEditing({
        ...task,
        id: undefined,
        title: task.title,
        notes: task.notes || "",
      });
    } else setEditing(task);
    setModalOpen(true);
  }

  async function handleSave(payload) {
    if (editing?.id && !String(editing.id).includes("__")) {
      await api.updateTask(editing.id, payload);
    } else {
      await api.createTask(payload);
    }
    await load();
  }

  async function handleDelete(id) {
    await api.deleteTask(id);
    await load();
  }

  async function toggleComplete(task) {
    if (String(task.id).includes("__")) return;
    await api.toggleComplete(task.id, !task.completed);
    await load();
  }

  async function handleSnooze(body) {
    await api.snoozeReminder(body);
    await load();
  }

  async function handleStartTimer(task) {
    try {
      const session = await api.startTimer(task?.id || null);
      setActiveTimer(session);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStopTimer() {
    await api.stopTimer();
    setActiveTimer(null);
    await load();
  }

  async function applyTemplate(id) {
    await api.applyTemplate(id, todayIso);
    await load();
    setView("week");
  }

  async function handleRestoreFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    await api.restore(data);
    await load();
  }

  async function handleImportCsv(file) {
    const csv = await file.text();
    await api.importCsv(csv);
    await load();
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <div className={`app house-${(user.house || "Gryffindor").toLowerCase()}`}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="castle-glow" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">Hogwarts Hourglass</span>
          <span className="brand__tag">
            {user.name} · {user.house} · 5 AM → Midnight
          </span>
        </div>

        <nav className="view-tabs">
          <button
            type="button"
            className={view === "week" ? "is-active" : ""}
            onClick={() => setView("week")}
          >
            Marauder&apos;s Map
          </button>
          <button
            type="button"
            className={view === "agenda" ? "is-active" : ""}
            onClick={() => setView("agenda")}
          >
            Today&apos;s Agenda
          </button>
        </nav>

        <div className="week-nav">
          <button type="button" className="btn btn--ghost" onClick={() => setMonday((m) => addDays(m, -7))}>
            ←
          </button>
          <strong>{formatWeekRange(monday)}</strong>
          <button type="button" className="btn btn--ghost" onClick={() => setMonday((m) => addDays(m, 7))}>
            →
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setMonday(getMonday())}>
            Today
          </button>
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => openNew(todayIso, "09:00")}>
            + Assign
          </button>
          <button type="button" className="btn btn--ghost" onClick={enableNotifications}>
            {notifyStatus === "granted" ? "Owls on" : "Enable owls"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={logout}>
            Mischief managed
          </button>
        </div>
      </header>

      <div className="filter-bar parchment">
        <input
          placeholder="Search title, notes, tags…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="">All subjects</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={filters.completed}
          onChange={(e) => setFilters((f) => ({ ...f, completed: e.target.value }))}
        >
          <option value="">All status</option>
          <option value="0">Incomplete</option>
          <option value="1">Completed</option>
        </select>
        <input
          placeholder="Filter tag"
          value={filters.tag}
          onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
        />
        <div className="filter-bar__exports">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => api.exportCsv()}>
            CSV
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => api.exportIcs()}>
            ICS
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => api.backup()}>
            Backup
          </button>
          <label className="btn btn--ghost btn--sm file-btn">
            Restore
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => e.target.files?.[0] && handleRestoreFile(e.target.files[0])}
            />
          </label>
          <label className="btn btn--ghost btn--sm file-btn">
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => e.target.files?.[0] && handleImportCsv(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <main className="layout">
        <section className="schedule-panel parchment">
          {error && <div className="banner banner--error">{error}</div>}
          {loading ? (
            <p className="loading">Consulting the Sorting Hat…</p>
          ) : view === "agenda" ? (
            <AgendaView
              tasks={todayTasks}
              onTaskClick={openEdit}
              onToggleComplete={toggleComplete}
              onStartTimer={handleStartTimer}
            />
          ) : (
            <>
              <div className="schedule-panel__intro">
                <h1>Weekly Timetable</h1>
                <p>
                  From first light at five until midnight. Subject colours mark each block — tick Done
                  when finished.
                </p>
                <div className="subject-legend">
                  {Object.entries(CATEGORY_STYLE).map(([id, s]) => (
                    <span key={id} className="subject-legend__item">
                      <i style={{ background: `linear-gradient(135deg, ${s.color}, ${s.accent})` }} />
                      {s.label}
                    </span>
                  ))}
                </div>
                {summary && (
                  <p className="inline-progress">
                    Week progress: <strong>{summary.percentComplete}%</strong> · House points{" "}
                    <strong>{summary.housePoints}</strong>
                  </p>
                )}
              </div>
              <WeekGrid
                weekDates={weekDates}
                tasks={tasks}
                hourSlots={hourSlots}
                todayIso={todayIso}
                onSlotClick={openNew}
                onTaskClick={openEdit}
                onToggleComplete={toggleComplete}
              />
            </>
          )}
        </section>

        <div className="side-stack">
          <WeeklySummary summary={summary} />
          <TimerPanel
            active={activeTimer}
            onStart={handleStartTimer}
            onStop={handleStopTimer}
            tasks={[...tasks, ...todayTasks]}
          />
          <RemindersPanel
            reminders={reminders}
            onRefresh={load}
            onSnooze={handleSnooze}
          />
          <TemplatesPanel templates={templates} onApply={applyTemplate} />
        </div>
      </main>

      <TaskModal
        open={modalOpen}
        initial={editing}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
