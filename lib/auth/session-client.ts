import type { AuthSession } from "@/lib/types/usuario";
import { SESSION_STORAGE_KEY } from "@/lib/auth/constants";

type SessionListener = () => void;

const listeners = new Set<SessionListener>();

let cachedRaw: string | null | undefined;
let cachedSession: AuthSession | null = null;

function notifySessionChange() {
  listeners.forEach((listener) => listener());
}

function readSessionFromStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedSession;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(raw) as AuthSession;
    return cachedSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    cachedRaw = null;
    cachedSession = null;
    return null;
  }
}

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(session);
  localStorage.setItem(SESSION_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSession = session;
  notifySessionChange();
}

export function loadSession(): AuthSession | null {
  return readSessionFromStorage();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_STORAGE_KEY);
  cachedRaw = null;
  cachedSession = null;
  notifySessionChange();
}

export function getSessionSnapshot(): AuthSession | null {
  return readSessionFromStorage();
}

export function getSessionServerSnapshot(): AuthSession | null {
  return null;
}
