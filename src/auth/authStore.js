// authStore.js
// Centralized, backend-free auth + credential storage.
// Uses localStorage, which is shared by EVERY tab/window of this browser -
// the closest thing to "all devices" achievable without a server.

const ACCOUNTS_KEY = "accounts";
const AUTH_VERSION_KEY = "authVersion";
const SESSION_VERSION_KEY = "sessionAuthVersion";
const LOGGED_IN_KEY = "loggedIn";
const ROLE_KEY = "role";
const REMEMBERED_ID_KEY = "rememberedId";

const DEFAULT_ACCOUNTS = [
  { id: "admin", password: "admin", role: "admin" },
  { id: "1234", password: "1234", role: "user" },
];

// Fired in the SAME tab right after a localStorage write, since the native
// 'storage' event only fires in OTHER tabs/windows, never the one that wrote it.
export const AUTH_CHANGED_EVENT = "auth-changed";

function broadcastAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getAuthVersion() {
  return Number(localStorage.getItem(AUTH_VERSION_KEY) || "0");
}

function bumpAuthVersion() {
  const next = getAuthVersion() + 1;
  localStorage.setItem(AUTH_VERSION_KEY, String(next));
  return next;
}

export function login(id, password) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === id && a.password === password);
  if (!account) return null;

  localStorage.setItem(LOGGED_IN_KEY, "true");
  localStorage.setItem(ROLE_KEY, account.role);
  // Stamp this session with the current credentials "generation".
  localStorage.setItem(SESSION_VERSION_KEY, String(getAuthVersion()));
  return account;
}

export function logout() {
  localStorage.removeItem(LOGGED_IN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(SESSION_VERSION_KEY);
  broadcastAuthChange();
}

// True if the session recorded at login time still matches the current
// credentials generation. False = the id/password changed since this
// session started, or there's no session at all.
export function isSessionValid() {
  if (localStorage.getItem(LOGGED_IN_KEY) !== "true") return false;
  const sessionVersion = localStorage.getItem(SESSION_VERSION_KEY);
  if (sessionVersion === null) return false;
  return Number(sessionVersion) === getAuthVersion();
}

// Change the id and/or password for an existing account (matched by its
// CURRENT id). Bumps the global auth version, which invalidates every
// logged-in tab/window right away - including this one.
export function changeCredentials(currentId, { newId, newPassword } = {}) {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === currentId);
  if (idx === -1) throw new Error("Account not found");

  const updated = { ...accounts[idx] };
  if (newId && newId.trim() && newId.trim() !== updated.id) {
    updated.id = newId.trim();
  }
  if (newPassword && newPassword.trim()) {
    updated.password = newPassword.trim();
  }

  const nextAccounts = [...accounts];
  nextAccounts[idx] = updated;
  saveAccounts(nextAccounts);

  // A remembered-id shortcut could now point at a stale id.
  if (localStorage.getItem(REMEMBERED_ID_KEY) === currentId && updated.id !== currentId) {
    localStorage.removeItem(REMEMBERED_ID_KEY);
  }

  bumpAuthVersion();
  broadcastAuthChange(); // other tabs get this via the native 'storage' event automatically

  return updated;
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

// --- Catches the "I edited DEFAULT_ACCOUNTS in code and redeployed" case ---
// getAccounts() only seeds DEFAULT_ACCOUNTS the very first time a browser has
// no "accounts" entry - after that it always trusts whatever's in
// localStorage, so editing the array in source has NO effect on browsers
// that already used the app. This fingerprints DEFAULT_ACCOUNTS and, if it
// changed since last load, reseeds and bumps the auth version so every open
// tab/window (and this one, on its next load) gets logged out.

const DEFAULTS_FINGERPRINT_KEY = "defaultsFingerprint";

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function defaultsFingerprint() {
  return simpleHash(JSON.stringify(DEFAULT_ACCOUNTS));
}

function syncWithCodeDefaults() {
  const currentFingerprint = defaultsFingerprint();
  const storedFingerprint = localStorage.getItem(DEFAULTS_FINGERPRINT_KEY);

  if (storedFingerprint === null) {
    // First time this browser has ever loaded the app - nothing to invalidate.
    localStorage.setItem(DEFAULTS_FINGERPRINT_KEY, currentFingerprint);
    return;
  }

  if (storedFingerprint !== currentFingerprint) {
    saveAccounts(DEFAULT_ACCOUNTS);
    localStorage.setItem(DEFAULTS_FINGERPRINT_KEY, currentFingerprint);
    bumpAuthVersion();
    broadcastAuthChange();
  }
}

// Runs once as soon as this module loads - i.e. every tab, every page load/refresh.
if (typeof window !== "undefined") {
  syncWithCodeDefaults();
}
