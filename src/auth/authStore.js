// authStore.js
// Centralized, backend-free auth + credential storage.
// Uses localStorage, which is shared by EVERY tab/window of this browser -
// the closest thing to "all devices" achievable without a server.
//
// SECURITY NOTE: hashing passwords here only stops someone from reading the
// plaintext password directly out of localStorage/DevTools. It is NOT real
// security - all the comparison logic still runs in the browser, so anyone
// can read this file, hash their own guesses, and compare hashes. True
// security requires a server. This just raises the bar above "plaintext in
// plain view," it does not remove it.

const ACCOUNTS_KEY = "accounts";
const AUTH_VERSION_KEY = "authVersion";
const SESSION_VERSION_KEY = "sessionAuthVersion";
const LOGGED_IN_KEY = "loggedIn";
const ROLE_KEY = "role";
const REMEMBERED_ID_KEY = "rememberedId";
const DEFAULTS_FINGERPRINT_KEY = "defaultsFingerprint";

// Plaintext here is fine - this lives in your source code / git repo, not
// in the browser. It's hashed before it's ever written to localStorage.
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

// --- Hashing helpers (Web Crypto API - built into every modern browser) ---

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashAccounts(accounts) {
  return Promise.all(
    accounts.map(async (a) => ({ ...a, password: await sha256Hex(a.password) }))
  );
}

function readStoredAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Returns accounts with HASHED passwords, seeding from DEFAULT_ACCOUNTS
// (hashed on the way in) the first time this browser has none stored.
export async function getAccounts() {
  const stored = readStoredAccounts();
  if (stored) return stored;

  const hashed = await hashAccounts(DEFAULT_ACCOUNTS);
  saveAccounts(hashed);
  return hashed;
}

function getAuthVersion() {
  return Number(localStorage.getItem(AUTH_VERSION_KEY) || "0");
}

function bumpAuthVersion() {
  const next = getAuthVersion() + 1;
  localStorage.setItem(AUTH_VERSION_KEY, String(next));
  return next;
}

export async function login(id, password) {
  const accounts = await getAccounts();
  const passwordHash = await sha256Hex(password);
  const account = accounts.find((a) => a.id === id && a.password === passwordHash);
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
export async function changeCredentials(currentId, { newId, newPassword } = {}) {
  const accounts = await getAccounts();
  const idx = accounts.findIndex((a) => a.id === currentId);
  if (idx === -1) throw new Error("Account not found");

  const updated = { ...accounts[idx] };
  if (newId && newId.trim() && newId.trim() !== updated.id) {
    updated.id = newId.trim();
  }
  if (newPassword && newPassword.trim()) {
    updated.password = await sha256Hex(newPassword.trim());
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
// changed since last load, reseeds (hashed) and bumps the auth version so
// every open tab/window (and this one, on its next load) gets logged out.

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

async function syncWithCodeDefaults() {
  const currentFingerprint = defaultsFingerprint();
  const storedFingerprint = localStorage.getItem(DEFAULTS_FINGERPRINT_KEY);

  if (storedFingerprint === null) {
    // First time this browser has ever loaded the app - nothing to invalidate.
    localStorage.setItem(DEFAULTS_FINGERPRINT_KEY, currentFingerprint);
    return;
  }

  if (storedFingerprint !== currentFingerprint) {
    const hashed = await hashAccounts(DEFAULT_ACCOUNTS);
    saveAccounts(hashed);
    localStorage.setItem(DEFAULTS_FINGERPRINT_KEY, currentFingerprint);
    bumpAuthVersion();
    broadcastAuthChange();
  }
}

// Runs once as soon as this module loads - i.e. every tab, every page load/refresh.
if (typeof window !== "undefined") {
  syncWithCodeDefaults();
}
