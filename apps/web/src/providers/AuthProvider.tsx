"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ACCESS_PROFILES,
  ROLES,
  can,
  canAny,
  isAccessRole,
  type AccessProfile,
  type AccessRole,
  type Permission,
} from "@/lib/rbac";

export { ACCESS_FLOW, ACCESS_PROFILES, PERMISSIONS, ROLES } from "@/lib/rbac";
export type { AccessProfile, AccessRole, Permission } from "@/lib/rbac";

export type AuthUser = NonNullable<AccessProfile["user"]>;

type AuthContextValue = {
  accessRole: AccessRole;
  currentProfile: AccessProfile;
  user: AuthUser | null;
  isAuthenticated: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  switchRole: (role: AccessRole) => void;
  continueAsGuest: () => void;
  logout: () => void;
};

const storageKey = "httlncvn.accessRole";
const listeners = new Set<() => void>();
let clientAccessRole: AccessRole | null = null;

const AuthContext = createContext<AuthContextValue | null>(null);

function getPreferredAccessRole(): AccessRole {
  try {
    const savedRole = window.localStorage.getItem(storageKey);

    if (isAccessRole(savedRole)) {
      return savedRole;
    }
  } catch {
    return ROLES.guest;
  }

  return ROLES.guest;
}

function getAccessRoleSnapshot() {
  clientAccessRole ??= getPreferredAccessRole();

  return clientAccessRole;
}

function getServerAccessRoleSnapshot(): AccessRole {
  return ROLES.guest;
}

function subscribeToAccessRole(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function updateAccessRole(nextRole: AccessRole) {
  clientAccessRole = nextRole;

  try {
    window.localStorage.setItem(storageKey, nextRole);
  } catch {
    // Keep the in-memory role even if storage is unavailable.
  }

  listeners.forEach((listener) => {
    listener();
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessRole = useSyncExternalStore(
    subscribeToAccessRole,
    getAccessRoleSnapshot,
    getServerAccessRoleSnapshot,
  );
  const currentProfile = ACCESS_PROFILES[accessRole];

  useEffect(() => {
    document.documentElement.dataset.accessRole = accessRole;
  }, [accessRole]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      accessRole,
      currentProfile,
      user: currentProfile.user,
      isAuthenticated: accessRole !== ROLES.guest,
      can(permission) {
        return can(accessRole, permission);
      },
      canAny(permissions) {
        return canAny(accessRole, permissions);
      },
      switchRole(role) {
        updateAccessRole(role);
      },
      continueAsGuest() {
        updateAccessRole(ROLES.guest);
      },
      logout() {
        updateAccessRole(ROLES.guest);
      },
    };
  }, [accessRole, currentProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
