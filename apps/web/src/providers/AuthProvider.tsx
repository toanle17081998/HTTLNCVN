"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type AccessRole =
  | "guest"
  | "church-member"
  | "church-admin"
  | "system-admin";

export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
  role: Exclude<AccessRole, "guest">;
};

export type AccessProfile = {
  role: AccessRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
  user: AuthUser | null;
};

type AuthContextValue = {
  accessRole: AccessRole;
  currentProfile: AccessProfile;
  user: AuthUser | null;
  isAuthenticated: boolean;
  switchRole: (role: AccessRole) => void;
  continueAsGuest: () => void;
  logout: () => void;
};

const storageKey = "httlncvn.accessRole";
const listeners = new Set<() => void>();
let clientAccessRole: AccessRole | null = null;

export const accessProfiles: Record<AccessRole, AccessProfile> = {
  guest: {
    role: "guest",
    label: "Guest user",
    shortLabel: "Guest",
    description:
      "Public visitor access for browsing homepage, public courses, blog content, and events.",
    capabilities: [
      "View public homepage content",
      "Browse public lectures, courses, and events",
      "Open the login flow when ready",
    ],
    user: null,
  },
  "church-member": {
    role: "church-member",
    label: "Church member",
    shortLabel: "Member",
    description:
      "Member access for personal profile, notifications, prayer journal, and community participation.",
    capabilities: [
      "Manage personal member profile",
      "Use prayer journal and notifications",
      "Join member-facing courses and events",
    ],
    user: {
      id: "demo-church-member",
      displayName: "Demo Church Member",
      email: "member@httlncvn.local",
      role: "church-member",
    },
  },
  "church-admin": {
    role: "church-admin",
    label: "Church admin",
    shortLabel: "Church Admin",
    description:
      "Church staff access for publishing content, managing events, and supporting members.",
    capabilities: [
      "Create and publish church content",
      "Manage events, courses, and member records",
      "Review notifications and ministry workflows",
    ],
    user: {
      id: "demo-church-admin",
      displayName: "Demo Church Admin",
      email: "church-admin@httlncvn.local",
      role: "church-admin",
    },
  },
  "system-admin": {
    role: "system-admin",
    label: "System admin",
    shortLabel: "System Admin",
    description:
      "Platform operator access for system-wide configuration, data operations, and admin oversight.",
    capabilities: [
      "Configure platform-wide settings",
      "Oversee all church workspaces",
      "Perform system administration tasks",
    ],
    user: {
      id: "demo-system-admin",
      displayName: "Demo System Admin",
      email: "system-admin@httlncvn.local",
      role: "system-admin",
    },
  },
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isAccessRole(value: string | null): value is AccessRole {
  return (
    value === "guest" ||
    value === "church-member" ||
    value === "church-admin" ||
    value === "system-admin"
  );
}

function getPreferredAccessRole(): AccessRole {
  try {
    const savedRole = window.localStorage.getItem(storageKey);

    if (isAccessRole(savedRole)) {
      return savedRole;
    }
  } catch {
    return "guest";
  }

  return "guest";
}

function getAccessRoleSnapshot() {
  clientAccessRole ??= getPreferredAccessRole();

  return clientAccessRole;
}

function getServerAccessRoleSnapshot(): AccessRole {
  return "guest";
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
  const currentProfile = accessProfiles[accessRole];

  useEffect(() => {
    document.documentElement.dataset.accessRole = accessRole;
  }, [accessRole]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      accessRole,
      currentProfile,
      user: currentProfile.user,
      isAuthenticated: accessRole !== "guest",
      switchRole(role) {
        updateAccessRole(role);
      },
      continueAsGuest() {
        updateAccessRole("guest");
      },
      logout() {
        updateAccessRole("guest");
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
