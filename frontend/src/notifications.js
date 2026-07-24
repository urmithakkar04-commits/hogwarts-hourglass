const FIRED_KEY = "afterfive-fired-reminders";

function loadFired() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveFired(set) {
  const arr = [...set].slice(-200);
  localStorage.setItem(FIRED_KEY, JSON.stringify(arr));
}

export async function ensureNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function reminderKey(r) {
  return `${r.taskId}|${r.kind}|${r.fireAt}`;
}

export function createReminderWatcher(fetchReminders) {
  let timer = null;
  const fired = loadFired();

  async function tick() {
    try {
      const reminders = await fetchReminders();
      const now = Date.now();
      for (const r of reminders) {
        const fireMs = new Date(r.fireAt).getTime();
        const key = reminderKey(r);
        // Fire if due within the last 2 minutes and not yet shown
        if (fireMs <= now && now - fireMs < 2 * 60 * 1000 && !fired.has(key)) {
          fired.add(key);
          saveFired(fired);
          if (Notification.permission === "granted") {
            new Notification(r.label || "Reminder", {
              body: r.message,
              tag: key,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Reminder check failed", e);
    }
  }

  return {
    start() {
      tick();
      timer = setInterval(tick, 30_000);
    },
    stop() {
      if (timer) clearInterval(timer);
    },
  };
}
