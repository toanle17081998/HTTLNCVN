"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PERMISSIONS, type Permission } from "@/lib/rbac";
import {
  clearStoredTokens,
  useAccessToken,
  useMeQuery,
  type AuthUser,
} from "@services/auth";

export { PERMISSIONS };
export type { Permission };

type AuthContextValue = {
  role: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  logout: () => void;
};

type ApiPermissionRequirement = {
  action: string;
  resource: string;
};

const publicPermissions = new Set<Permission>([
  PERMISSIONS.viewLanding,
  PERMISSIONS.viewAbout,
  PERMISSIONS.viewContact,
  PERMISSIONS.viewPublicArticle,
  PERMISSIONS.viewEvents,
]);

const permissionMap: Partial<Record<Permission, ApiPermissionRequirement[]>> = {
  [PERMISSIONS.viewLanding]: [{ action: "read", resource: "landing_page" }],
  [PERMISSIONS.viewAbout]: [{ action: "read", resource: "about_page" }],
  [PERMISSIONS.viewContact]: [{ action: "read", resource: "contact_page" }],
  [PERMISSIONS.viewPublicArticle]: [{ action: "read", resource: "article" }],
  [PERMISSIONS.viewInternalArticle]: [{ action: "read", resource: "article" }],
  [PERMISSIONS.manageOwnPrayers]: [
    { action: "read", resource: "prayer_journal" },
    { action: "create", resource: "prayer_journal" },
    { action: "update", resource: "prayer_journal" },
    { action: "delete", resource: "prayer_journal" },
  ],
  [PERMISSIONS.shareChurchPrayers]: [{ action: "share", resource: "prayer_journal" }],
  [PERMISSIONS.moderateChurchPrayers]: [{ action: "manage", resource: "prayer_journal" }],
  [PERMISSIONS.enrollCourses]: [{ action: "enroll", resource: "course" }],
  [PERMISSIONS.accessLessons]: [{ action: "read", resource: "lesson" }],
  [PERMISSIONS.takeAssessments]: [{ action: "take", resource: "quiz" }],
  [PERMISSIONS.viewCertificates]: [{ action: "read", resource: "certificate" }],
  [PERMISSIONS.viewEvents]: [{ action: "read", resource: "event" }],
  [PERMISSIONS.personalizedSearch]: [{ action: "read", resource: "search" }],
  [PERMISSIONS.manageArticle]: [
    { action: "create", resource: "article" },
    { action: "update", resource: "article" },
    { action: "delete", resource: "article" },
  ],
  [PERMISSIONS.manageLanding]: [{ action: "update", resource: "landing_page" }],
  [PERMISSIONS.manageAbout]: [{ action: "update", resource: "about_page" }],
  [PERMISSIONS.manageContact]: [{ action: "update", resource: "contact_page" }],
  [PERMISSIONS.manageCourses]: [
    { action: "create", resource: "course" },
    { action: "update", resource: "course" },
    { action: "delete", resource: "course" },
    { action: "create", resource: "lesson" },
    { action: "update", resource: "lesson" },
    { action: "delete", resource: "lesson" },
    { action: "create", resource: "quiz" },
    { action: "update", resource: "quiz" },
    { action: "delete", resource: "quiz" },
  ],
  [PERMISSIONS.enrollMembers]: [{ action: "enroll", resource: "course" }],
  [PERMISSIONS.manageEvents]: [
    { action: "create", resource: "event" },
    { action: "update", resource: "event" },
    { action: "delete", resource: "event" },
  ],
  [PERMISSIONS.manageTelegramNotifications]: [{ action: "create", resource: "notification" }],
  [PERMISSIONS.manageChurchMembers]: [
    { action: "read", resource: "member" },
  ],
  [PERMISSIONS.createChurchMembers]: [
    { action: "create", resource: "member" },
  ],
  [PERMISSIONS.updateChurchMembers]: [
    { action: "update", resource: "member" },
  ],
  [PERMISSIONS.deleteChurchMembers]: [
    { action: "delete", resource: "member" },
  ],
  [PERMISSIONS.manageRoleSchemas]: [{ action: "manage", resource: "role_schema" }],
  [PERMISSIONS.manageSystemSettings]: [{ action: "manage", resource: "system_setting" }],
  [PERMISSIONS.manageIntegrations]: [{ action: "manage", resource: "integration" }],
  [PERMISSIONS.manageDatabaseConfig]: [{ action: "manage", resource: "database_config" }],
  [PERMISSIONS.viewAllData]: [{ action: "manage", resource: "all_data" }],
  [PERMISSIONS.executeMaintenance]: [{ action: "manage", resource: "backup" }],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function hasApiPermission(user: AuthUser | null, requirement: ApiPermissionRequirement) {
  return Boolean(
    user?.permissions.some(
      (permission) =>
        permission.action === requirement.action && permission.resource === requirement.resource,
    ),
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAccessToken();
  const meQuery = useMeQuery(Boolean(accessToken));
  const user = accessToken ? (meQuery.data ?? null) : null;

  const value = useMemo<AuthContextValue>(() => {
    const canPermission = (permission: Permission) => {
      if (!user && publicPermissions.has(permission)) return true;
      const requirements = permissionMap[permission] ?? [];
      return requirements.some((requirement) => hasApiPermission(user, requirement));
    };

    return {
      role: user?.role ?? "guest",
      user,
      isAuthenticated: Boolean(user),
      isLoading: meQuery.isLoading,
      can: canPermission,
      canAny(permissions) {
        return permissions.some(canPermission);
      },
      logout() {
        clearStoredTokens();
      },
    };
  }, [meQuery.isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
