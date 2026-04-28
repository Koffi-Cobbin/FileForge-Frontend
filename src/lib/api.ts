import { queryKeys } from "./queryKeys";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://fileforge1.pythonanywhere.com";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data.detail || "API Error");
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken() {
  return localStorage.getItem("ff_access");
}

export function getRefreshToken() {
  return localStorage.getItem("ff_refresh");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("ff_access", access);
  localStorage.setItem("ff_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("ff_access");
  localStorage.removeItem("ff_refresh");
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token available");

  const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    window.dispatchEvent(new Event("auth:unauthorized"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data.access;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  let access = getAccessToken();

  const headers = new Headers(options.headers);
  if (access && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${access}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && access) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        access = await refreshToken();
        onRefreshed(access);
      } catch (err) {
        isRefreshing = false;
        clearTokens();
        window.dispatchEvent(new Event("auth:unauthorized"));
        throw err;
      }
      isRefreshing = false;
    } else {
      await new Promise<void>((resolve) => {
        refreshSubscribers.push((newToken: string) => {
          access = newToken;
          resolve();
        });
      });
    }

    headers.set("Authorization", `Bearer ${access}`);
    res = await fetch(url, { ...options, headers });
  }

  if (res.status === 204) {
    return null as T;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data;
}

