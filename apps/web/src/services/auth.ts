"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { apiRequest } from "./client";

export type LoginDto = {
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthPermission = {
  action: string;
  resource: string;
};

export type AuthUser = {
  email: string;
  id: string;
  permissions: AuthPermission[];
  role: string;
  username: string;
};

const tokenStorageKey = "httlncvn.authTokens";
const tokenChangeEvent = "httlncvn:auth-token-change";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(tokenStorageKey);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens: AuthTokens) {
  window.localStorage.setItem(tokenStorageKey, JSON.stringify(tokens));
  window.dispatchEvent(new Event(tokenChangeEvent));
}

export function clearStoredTokens() {
  window.localStorage.removeItem(tokenStorageKey);
  window.dispatchEvent(new Event(tokenChangeEvent));
}

function subscribeToTokenChanges(listener: () => void) {
  window.addEventListener(tokenChangeEvent, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(tokenChangeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

function getAccessTokenSnapshot() {
  return getStoredTokens()?.accessToken ?? null;
}

function getServerAccessTokenSnapshot() {
  return null;
}

export function useAccessToken() {
  return useSyncExternalStore(
    subscribeToTokenChanges,
    getAccessTokenSnapshot,
    getServerAccessTokenSnapshot,
  );
}

export const authApi = {
  login(dto: LoginDto) {
    return apiRequest<AuthTokens>("/auth/login", {
      body: JSON.stringify(dto),
      method: "POST",
    });
  },
  me() {
    return apiRequest<AuthUser>("/auth/me", {
      token: getStoredTokens()?.accessToken,
    });
  },
  logout() {
    clearStoredTokens();
    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
    }).catch(() => ({ message: "Logged out locally." }));
  },
};

export function useMeQuery(enabled?: boolean) {
  const accessToken = useAccessToken();

  return useQuery({
    enabled: enabled ?? Boolean(accessToken),
    queryFn: authApi.me,
    queryKey: authKeys.session(),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess(tokens) {
      setStoredTokens(tokens);
      queryClient.invalidateQueries();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess() {
      clearStoredTokens();
      queryClient.setQueryData(authKeys.session(), null);
      queryClient.invalidateQueries();
    },
  });
}
