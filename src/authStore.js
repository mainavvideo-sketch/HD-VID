// authStore.js  (place at src/authStore.js)
//
// IMPORTANT LIMITATION: this whole app is frontend-only (no server), and
// localStorage lives inside ONE browser. There is no way for a browser on
// Device A to know that Device B changed its password — there's no shared
// place for that fact to live without a backend.
//
// What this file DOES give you, using only localStorage:
//   1. Automatic logout in every OTHER TAB/WINDOW of the SAME BROWSER the
//      moment credentials are changed (via the native "storage" event).
//   2. A `version` per account that gets bumped on every credential change,
//      so a stale session can always be detected and killed.
//
// To get *real* cross-device forced logout, swap this file for calls to a
// backend that stores `version` server-side and checks it on each
// request/token refresh — everything else (ProtectedRoute, Login,
// ChangeCredentials) stays the same.

const ACCOUNTS_KEY = "accounts";
const SESSION_KEY = "session"; // { id, role, version }

const DEFAULT_ACCOUNTS = [
  { id: "admin", password: "admin", role: "admin", version: 1 },
  { id: "2234", password: "3234", role: "user", version: 1 },
];

function loadAccounts() {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
}

function saveAccounts(accounts) {
  // Writing this key is what fires the "storage" event in every OTHER
  // tab/window of this browser — that's what ProtectedRoute listens for.
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function findAccount(id) {
  return loadAccounts().find((a) => a.id === id) || null;
}

export function verifyLogin(id, password) {
  return loadAccounts().find((a) => a.id === id && a.password === password) || null;
}

// Call right after a successful login. Pins this tab's session to the
// account's CURRENT credential version.
export function startSession(account) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: account.id, role: account.role, version: account.version })
  );
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("role", account.role);
}

export function endSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("role");
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// True if the session logged in on THIS tab still matches the account's
// latest credential version. False = stale -> caller should log out.
export function isSessionValid() {
  const session = getSession();
  if (!session) return false;
  const account = findAccount(session.id);
  if (!account) return false; // renamed/removed
  return account.version === session.version;
}

// Change an account's id and/or password. Bumps its version, which
// invalidates every OTHER open session for that account (same browser).
export function changeCredentials(currentId, { newId, newPassword }) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === currentId);
  if (idx === -1) return { ok: false, error: "Account not found" };

  const targetId = (newId || currentId).trim();
  if (targetId !== currentId && accounts.some((a) => a.id === targetId)) {
    return { ok: false, error: "That ID is already taken" };
  }
  if (!targetId) return { ok: false, error: "ID cannot be empty" };

  const updated = {
    ...accounts[idx],
    id: targetId,
    password: newPassword ? newPassword : accounts[idx].password,
    version: accounts[idx].version + 1,
  };
  accounts[idx] = updated;
  saveAccounts(accounts);

  return { ok: true, account: updated };
}
