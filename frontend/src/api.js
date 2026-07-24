const TOKEN_KEY = "hogwarts-token";

/** Empty in web/dev (Vite proxy). Set VITE_API_BASE_URL for Android / production, e.g. https://your-api.onrender.com */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}, base = "/api/tasks") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(`${base}${path}`), { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

function authRequest(path, options) {
  return request(path, options, "/api/auth");
}

function downloadWithAuth(path, filename) {
  const token = getToken();
  return fetch(apiUrl(`/api/tasks${path}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export const api = {
  register: (body) => authRequest("/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => authRequest("/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => authRequest("/me"),

  getMeta: () => request("/meta"),
  getWeek: (weekOf, params = {}) => {
    const q = new URLSearchParams({ weekOf, ...params });
    return request(`?${q}`);
  },
  getToday: (params = {}) => {
    const q = new URLSearchParams({ today: "1", ...params });
    return request(`?${q}`);
  },
  getReminders: () => request("/reminders/upcoming"),
  snoozeReminder: (body) =>
    request("/reminders/snooze", { method: "POST", body: JSON.stringify(body) }),
  getSummary: (weekOf) => request(`/summary/week?weekOf=${encodeURIComponent(weekOf)}`),
  getTemplates: () => request("/templates"),
  applyTemplate: (id, startDate) =>
    request(`/templates/${id}/apply`, {
      method: "POST",
      body: JSON.stringify({ startDate }),
    }),
  createTask: (body) => request("/", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id, body) =>
    request(`/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  toggleComplete: (id, completed) =>
    request(`/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),
  deleteTask: (id) => request(`/${id}`, { method: "DELETE" }),
  startTimer: (taskId) =>
    request("/timer/start", { method: "POST", body: JSON.stringify({ taskId }) }),
  stopTimer: () => request("/timer/stop", { method: "POST", body: "{}" }),
  getActiveTimer: () => request("/timer/active"),
  exportCsv: () => downloadWithAuth("/export/csv", "hogwarts-planner.csv"),
  exportIcs: () => downloadWithAuth("/export/ics", "hogwarts-planner.ics"),
  backup: () => downloadWithAuth("/backup", "hogwarts-backup.json"),
  restore: (data) =>
    request("/backup/restore", { method: "POST", body: JSON.stringify(data) }),
  importCsv: (csv) =>
    request("/import/csv", { method: "POST", body: JSON.stringify({ csv }) }),
};
