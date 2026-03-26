/**
 * useTaskStore.js
 * Place at: src/stores/useTaskStore.js
 *
 * Module-level singleton — tasks persist across route changes (no reload).
 * Reminder polling fires every 30s, injects into notification bell on fire.
 */

import { useState, useEffect, useCallback } from "react";
import { databases, account } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useQueryClient } from "@tanstack/react-query";
import { initTaskNotificationBridge, injectTaskNotification } from "./taskNotificationBridge";

const DB_ID         = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID;
const LS_KEY        = "unizuya_tasks";
const FIRED_KEY     = "unizuya_fired_reminders";

// ── Serialization ─────────────────────────────────────────────────────────────
export const serialize = (t) => ({
  userId: t.userId, title: t.title, description: t.description || "",
  priority: t.priority, subject: t.subject || "", dueDate: t.dueDate || "",
  reminder: t.reminder || "", subtasks: JSON.stringify(t.subtasks || []),
  done: t.done, createdAt: t.createdAt,
});

export const deserialize = (doc) => ({
  id: doc.$id, userId: doc.userId, title: doc.title,
  description: doc.description || "", priority: doc.priority,
  subject: doc.subject || "", dueDate: doc.dueDate || "",
  reminder: doc.reminder || "",
  subtasks: (() => { try { return JSON.parse(doc.subtasks || "[]"); } catch { return []; } })(),
  done: doc.done, createdAt: doc.createdAt,
});

// ── Local Storage ─────────────────────────────────────────────────────────────
const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
};
const saveLocal = (tasks) => localStorage.setItem(LS_KEY, JSON.stringify(tasks));

// ── Reminder helpers ──────────────────────────────────────────────────────────
const getFired  = () => { try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || "[]")); } catch { return new Set(); } };
const markFired = (id) => { const s = getFired(); s.add(id); localStorage.setItem(FIRED_KEY, JSON.stringify([...s])); };

function fireReminder(task) {
  // 1. Browser notification (if SW available)
  const SW_PATH = "/push-sw.js";
  const fire = () => {
    navigator.serviceWorker?.getRegistration(SW_PATH).then(reg => {
      if (reg?.active) {
        reg.showNotification("Unizuya Reminder", {
          body:  task.title,
          icon:  "/favicon.ico",
          badge: "/favicon.ico",
          tag:   `task-${task.id}`,
          data:  { url: "/dashboard/tasks" },
        });
      } else if (Notification.permission === "granted") {
        new Notification("Unizuya Reminder", { body: task.title, icon: "/favicon.ico" });
      }
    }).catch(() => {
      if (Notification.permission === "granted")
        new Notification("Unizuya Reminder", { body: task.title, icon: "/favicon.ico" });
    });
  };

  if ("Notification" in window) {
    if (Notification.permission === "granted") fire();
  }

  // 2. Inject into notification bell
  injectTaskNotification(task);
}

function checkReminders(tasks) {
  if (!("Notification" in window)) return;
  const fired = getFired();
  const now   = Date.now();
  tasks.forEach(task => {
    if (!task.reminder || task.done || fired.has(task.id)) return;
    const at = new Date(task.reminder).getTime();
    if (at <= now) {
      markFired(task.id);
      fireReminder(task);
    }
  });
}

// ── Singleton module-level state ──────────────────────────────────────────────
let _tasks    = [];
let _userId   = null;
let _loaded   = false;
let _loading  = false;
const _listeners = new Set();

function notify() { _listeners.forEach(fn => fn([..._tasks])); }

function setTasks(next) {
  _tasks = next;
  saveLocal(next);
  notify();
}

async function bootstrap() {
  if (_loaded || _loading) return;
  _loading = true;
  try {
    const session = await account.get();
    _userId = session.$id;
    const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal("userId", _userId),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ]);
    const remote = res.documents.map(deserialize);
    setTasks(remote);
  } catch {
    setTasks(loadLocal());
  } finally {
    _loaded  = true;
    _loading = false;
    notify();
  }
}

// ── Public CRUD ───────────────────────────────────────────────────────────────
export async function addTask(form) {
  const task = {
    id: ID.unique(), userId: _userId || "local",
    title: form.title, description: form.description || "",
    priority: form.priority, subject: form.subject || "",
    dueDate: form.dueDate || "", reminder: form.reminder || "",
    subtasks: form.subtasks || [], done: false,
    createdAt: new Date().toISOString(),
  };
  setTasks([task, ..._tasks]);
  if (_userId) {
    try { await databases.createDocument(DB_ID, COLLECTION_ID, task.id, serialize(task)); }
    catch (e) { console.error("create:", e); }
  }
}

export async function toggleTask(id) {
  const next = _tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  setTasks(next);
  if (_userId) {
    try { await databases.updateDocument(DB_ID, COLLECTION_ID, id, { done: next.find(t => t.id === id).done }); }
    catch (e) { console.error("toggle:", e); }
  }
}

export async function deleteTask(id) {
  setTasks(_tasks.filter(t => t.id !== id));
  if (_userId) {
    try { await databases.deleteDocument(DB_ID, COLLECTION_ID, id); }
    catch (e) { console.error("delete:", e); }
  }
}

export async function updateTask(task) {
  setTasks(_tasks.map(t => t.id === task.id ? task : t));
  if (_userId) {
    try { await databases.updateDocument(DB_ID, COLLECTION_ID, task.id, serialize(task)); }
    catch (e) { console.error("update:", e); }
  }
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useTaskStore() {
  const [tasks,   setLocal]   = useState([..._tasks]);
  const [loading, setLoading] = useState(!_loaded);
  const queryClient           = useQueryClient();

  useEffect(() => {
    const handler = (t) => { setLocal(t); setLoading(false); };
    _listeners.add(handler);

    if (!_loaded) {
      bootstrap();
    } else {
      setLocal([..._tasks]);
      setLoading(false);
    }

    return () => { _listeners.delete(handler); };
  }, []);

  // Init the notification bridge once userId is known
  useEffect(() => {
    if (_userId && queryClient) {
      initTaskNotificationBridge(queryClient, _userId);
    }
  }, [queryClient]);

  // Also init bridge after bootstrap resolves userId
  useEffect(() => {
    if (!_loaded) return;
    if (_userId && queryClient) {
      initTaskNotificationBridge(queryClient, _userId);
    }
  }, [loading, queryClient]);

  // Reminder polling — 30s interval
  useEffect(() => {
    if (!_loaded || tasks.length === 0) return;
    checkReminders(tasks);
    const id = setInterval(() => checkReminders(tasks), 30_000);
    return () => clearInterval(id);
  }, [tasks]);

  return {
    tasks,
    loading,
    userId: _userId,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
  };
}