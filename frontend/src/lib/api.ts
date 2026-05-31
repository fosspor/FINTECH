const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const AUTH_STORAGE_KEY = "finbro_auth";
const AUTH_CHANGE_EVENT = "finbro_auth_change";

type AuthState = {
  email: string;
  password: string;
  name: string;
  token: string;
  refresh_token: string;
  user_id: string;
  is_guest?: boolean;
};

export type UserMe = {
  id: string;
  email: string;
  created_at: string;
  currency: {
    crystals: number;
    freezes: number;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
  };
  hero: {
    name: string;
    base_model: string;
    current_emotion: string;
  };
};

export function readAuth(): AuthState | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function writeAuth(auth: AuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  emitAuthChange();
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChange();
}

export function onAuthChange(callback: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function authHeaders(auth?: AuthState) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  if (auth) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  return headers;
}

async function registerAnonymousUser(name = "Гость"): Promise<AuthState> {
  const id = crypto.randomUUID();
  const email = `guest-${id}@finbro.local`;
  const password = `guest-${id}`;
  const displayName = name.trim() || "Гость";

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      name: displayName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create anonymous user: ${response.status}`);
  }

  const data = await response.json();
  const auth = {
    email,
    password,
    name: displayName,
    token: data.token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    is_guest: true,
  };
  writeAuth(auth);
  return auth;
}

async function refreshAuth(auth: AuthState): Promise<AuthState | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: auth.refresh_token }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const next = {
    ...auth,
    token: data.token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
  };
  writeAuth(next);
  return next;
}

async function parseApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
}

export async function registerUser(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthState> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Не удалось создать аккаунт"));
  }

  const data = await response.json();
  const auth = {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    token: data.token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    is_guest: false,
  };
  writeAuth(auth);
  return auth;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthState> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Не удалось войти"));
  }

  const data = await response.json();
  const auth = {
    email: payload.email,
    password: payload.password,
    name: payload.email.split("@")[0] || "Пользователь",
    token: data.token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    is_guest: false,
  };
  writeAuth(auth);
  return auth;
}

export async function logoutUser() {
  const auth = readAuth();

  if (auth) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: authHeaders(auth),
      body: JSON.stringify({ refresh_token: auth.refresh_token }),
    }).catch(() => undefined);
  }

  clearAuth();
}

export async function ensureAuth(): Promise<AuthState> {
  return readAuth() ?? registerAnonymousUser();
}

export async function ensureGuestAuth(name: string): Promise<AuthState> {
  const auth = readAuth();
  if (auth) {
    const next = { ...auth, name: name.trim() || auth.name || "Гость" };
    writeAuth(next);
    return next;
  }

  return registerAnonymousUser(name);
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const auth = await ensureAuth();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${auth.token}`);
  headers.set("ngrok-skip-browser-warning", "true");

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  const refreshed = await refreshAuth(auth);
  if (!refreshed) {
    clearAuth();
    const nextAuth = await registerAnonymousUser();
    headers.set("Authorization", `Bearer ${nextAuth.token}`);
    return fetch(input, { ...init, headers });
  }

  headers.set("Authorization", `Bearer ${refreshed.token}`);
  return fetch(input, { ...init, headers });
}

export async function getCurrentUser(): Promise<UserMe> {
  const response = await authFetch(apiUrl("/users/me"));

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Не удалось загрузить профиль"));
  }

  return response.json();
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}
