import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.join(__dirname, "..", "data");

fs.mkdirSync(dataDir, { recursive: true });

function ensureFile(filePath, initial) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
  }
}

const usersPath = path.join(dataDir, "users.json");
const legacyTasksPath = path.join(dataDir, "tasks.json");

ensureFile(usersPath, { users: [] });
ensureFile(legacyTasksPath, { tasks: [], timerSessions: [], snoozes: [] });

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function userStorePath(userId) {
  return path.join(dataDir, `user-${userId}.json`);
}

function ensureUserStore(userId) {
  const p = userStorePath(userId);
  ensureFile(p, { tasks: [], timerSessions: [], snoozes: [] });
  return p;
}

export function listUsers() {
  return readJson(usersPath).users;
}

export function findUserByEmail(email) {
  return listUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(id) {
  return listUsers().find((u) => u.id === id) || null;
}

export function createUser(user) {
  const store = readJson(usersPath);
  store.users.push(user);
  writeJson(usersPath, store);
  ensureUserStore(user.id);
  return user;
}

function readUserStore(userId) {
  return readJson(ensureUserStore(userId));
}

function writeUserStore(userId, store) {
  writeJson(userStorePath(userId), store);
}

export function listTasks(userId) {
  return readUserStore(userId).tasks;
}

export function getTask(userId, id) {
  return listTasks(userId).find((t) => t.id === id) || null;
}

export function insertTask(userId, task) {
  const store = readUserStore(userId);
  store.tasks.push(task);
  writeUserStore(userId, store);
  return task;
}

export function insertTasks(userId, tasks) {
  const store = readUserStore(userId);
  store.tasks.push(...tasks);
  writeUserStore(userId, store);
  return tasks;
}

export function updateTask(userId, id, patch) {
  const store = readUserStore(userId);
  const idx = store.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.tasks[idx] = { ...store.tasks[idx], ...patch };
  writeUserStore(userId, store);
  return store.tasks[idx];
}

export function deleteTask(userId, id) {
  const store = readUserStore(userId);
  const before = store.tasks.length;
  store.tasks = store.tasks.filter((t) => t.id !== id);
  writeUserStore(userId, store);
  return store.tasks.length < before;
}

export function replaceAllTasks(userId, tasks) {
  const store = readUserStore(userId);
  store.tasks = tasks;
  writeUserStore(userId, store);
}

export function listTimerSessions(userId) {
  return readUserStore(userId).timerSessions || [];
}

export function insertTimerSession(userId, session) {
  const store = readUserStore(userId);
  if (!store.timerSessions) store.timerSessions = [];
  store.timerSessions.push(session);
  writeUserStore(userId, store);
  return session;
}

export function updateTimerSession(userId, id, patch) {
  const store = readUserStore(userId);
  if (!store.timerSessions) store.timerSessions = [];
  const idx = store.timerSessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.timerSessions[idx] = { ...store.timerSessions[idx], ...patch };
  writeUserStore(userId, store);
  return store.timerSessions[idx];
}

export function listSnoozes(userId) {
  return readUserStore(userId).snoozes || [];
}

export function upsertSnooze(userId, snooze) {
  const store = readUserStore(userId);
  if (!store.snoozes) store.snoozes = [];
  const key = `${snooze.taskId}|${snooze.kind}|${snooze.originalFireAt}`;
  store.snoozes = store.snoozes.filter(
    (s) => `${s.taskId}|${s.kind}|${s.originalFireAt}` !== key
  );
  store.snoozes.push(snooze);
  writeUserStore(userId, store);
  return snooze;
}

export function getBackup(userId) {
  return readUserStore(userId);
}

export function restoreBackup(userId, data) {
  writeUserStore(userId, {
    tasks: data.tasks || [],
    timerSessions: data.timerSessions || [],
    snoozes: data.snoozes || [],
  });
}
