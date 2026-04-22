const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const tokenStorageKey = "httlncvn.authTokens";

export type ApiEnvelope<T> = {
  data: T;
  meta: {
    timestamp: string;
  };
  success: true;
};

export type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
  };
  meta?: {
    path?: string;
    timestamp?: string;
  };
  success: false;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

function readStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(tokenStorageKey);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: StoredTokens) {
  window.localStorage.setItem(tokenStorageKey, JSON.stringify(tokens));
  window.dispatchEvent(new Event("httlncvn:auth-token-change"));
}

function clearStoredTokens() {
  window.localStorage.removeItem(tokenStorageKey);
  window.dispatchEvent(new Event("httlncvn:auth-token-change"));
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = readStoredTokens();
  if (!tokens?.refreshToken) return null;

  const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<StoredTokens> | null;

  if (!response.ok || !payload?.success) {
    clearStoredTokens();
    return null;
  }

  writeStoredTokens(payload.data);
  return payload.data.accessToken;
}

async function requestWithToken<T>(
  path: string,
  options: RequestOptions,
  token: string | null | undefined,
): Promise<{ payload: ApiEnvelope<T> | ApiErrorEnvelope | null; response: Response }> {
  const { headers, token: _ignoredToken, ...init } = options;
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const payload =
    response.status === 204
      ? null
      : ((await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorEnvelope | null);

  return { payload, response };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let token = options.token;
  let { payload, response } = await requestWithToken<T>(path, options, token);

  if (response.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) {
      ({ payload, response } = await requestWithToken<T>(path, options, token));
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && "error" in payload
        ? payload.error?.message ?? "Request failed."
        : "Request failed.";
    const code = payload && "error" in payload ? payload.error?.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return payload.data;
}
