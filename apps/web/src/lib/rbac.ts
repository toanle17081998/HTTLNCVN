export const ROLES = {
  guest: "guest",
  churchMember: "church-member",
  churchAdmin: "church-admin",
  systemAdmin: "system-admin",
} as const;

export type AccessRole = (typeof ROLES)[keyof typeof ROLES];
export type AuthenticatedRole = Exclude<AccessRole, typeof ROLES.guest>;

export const PERMISSIONS = {
  viewLanding: "view:landing",
  viewAbout: "view:about",
  viewContact: "view:contact",
  viewPublicArticle: "view:article:public",
  viewInternalArticle: "view:article:internal",
  comment: "create:comment",
  manageOwnPrayers: "manage:prayer:own",
  shareChurchPrayers: "share:prayer:church",
  moderateChurchPrayers: "moderate:prayer:church",
  enrollCourses: "enroll:course",
  accessLessons: "access:lesson",
  takeAssessments: "take:assessment",
  viewCertificates: "view:certificate",
  viewEvents: "view:event",
  personalizedSearch: "search:personalized",
  manageArticle: "manage:article",
  manageAbout: "manage:about",
  manageContact: "manage:contact",
  manageCourses: "manage:course",
  enrollMembers: "enroll:member",
  manageEvents: "manage:event",
  manageTelegramNotifications: "manage:telegram-notification",
  manageChurchMembers: "manage:church-member",
  manageRoleSchemas: "manage:role-schema",
  manageSystemSettings: "manage:system-setting",
  manageIntegrations: "manage:integration",
  manageDatabaseConfig: "manage:database-config",
  viewAllData: "view:data:all",
  executeMaintenance: "execute:maintenance",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AccessProfile = {
  role: AccessRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
  user: {
    id: string;
    displayName: string;
    email: string;
    role: AuthenticatedRole;
  } | null;
};

const guestPermissions = [
  PERMISSIONS.viewLanding,
  PERMISSIONS.viewAbout,
  PERMISSIONS.viewContact,
  PERMISSIONS.viewPublicArticle,
  PERMISSIONS.viewEvents,
] as const;

const churchMemberPermissions = [
  ...guestPermissions,
  PERMISSIONS.viewInternalArticle,
  PERMISSIONS.comment,
  PERMISSIONS.manageOwnPrayers,
  PERMISSIONS.shareChurchPrayers,
  PERMISSIONS.enrollCourses,
  PERMISSIONS.accessLessons,
  PERMISSIONS.takeAssessments,
  PERMISSIONS.viewCertificates,
  PERMISSIONS.personalizedSearch,
] as const;

const churchAdminPermissions = [
  ...churchMemberPermissions,
  PERMISSIONS.manageArticle,
  PERMISSIONS.manageAbout,
  PERMISSIONS.manageContact,
  PERMISSIONS.manageCourses,
  PERMISSIONS.enrollMembers,
  PERMISSIONS.manageEvents,
  PERMISSIONS.manageTelegramNotifications,
  PERMISSIONS.moderateChurchPrayers,
  PERMISSIONS.manageChurchMembers,
] as const;

export const ROLE_PERMISSIONS: Record<AccessRole, readonly Permission[]> = {
  [ROLES.guest]: guestPermissions,
  [ROLES.churchMember]: churchMemberPermissions,
  [ROLES.churchAdmin]: churchAdminPermissions,
  [ROLES.systemAdmin]: [
    ...churchAdminPermissions,
    PERMISSIONS.manageRoleSchemas,
    PERMISSIONS.manageSystemSettings,
    PERMISSIONS.manageIntegrations,
    PERMISSIONS.manageDatabaseConfig,
    PERMISSIONS.viewAllData,
    PERMISSIONS.executeMaintenance,
  ],
};

export const ACCESS_PROFILES = {
  [ROLES.guest]: {
    role: ROLES.guest,
    label: "Guest",
    shortLabel: "Guest",
    description:
      "Public visitor access for the landing page, About article, footer contact information, public articles, and public event calendar.",
    capabilities: [
      "View landing page, About article, and footer contact information",
      "View public articles and public event calendar",
      "No comments, course enrollment, or internal prayer journals",
    ],
    user: null,
  },
  [ROLES.churchMember]: {
    role: ROLES.churchMember,
    label: "Church Member",
    shortLabel: "Member",
    description:
      "Member access for prayer journals, learning, internal content, events, and personalized search.",
    capabilities: [
      "Create, edit, delete, and share personal prayers",
      "Enroll in courses, access lessons, take quizzes, and view certificates",
      "View public and internal-only articles, events, and recommendations",
    ],
    user: {
      id: "demo-church-member",
      displayName: "Demo Church Member",
      email: "member@httlncvn.local",
      role: ROLES.churchMember,
    },
  },
  [ROLES.churchAdmin]: {
    role: ROLES.churchAdmin,
    label: "Church Admin",
    shortLabel: "Church Admin",
    description:
      "Church staff/admin access for local content, LMS operations, events, notifications, moderation, and member permissions.",
    capabilities: [
      "Manage article, About Us, Contact, courses, lessons, and tests",
      "Add events and configure automated Telegram notifications",
      "Moderate shared prayer journals and local member permissions",
    ],
    user: {
      id: "demo-church-admin",
      displayName: "Demo Church Admin",
      email: "church-admin@httlncvn.local",
      role: ROLES.churchAdmin,
    },
  },
  [ROLES.systemAdmin]: {
    role: ROLES.systemAdmin,
    label: "System Admin",
    shortLabel: "System Admin",
    description:
      "Platform operator access for global role schemas, integrations, all-data oversight, maintenance, backups, and security audits.",
    capabilities: [
      "Configure global role and permission schemas",
      "Manage Telegram webhooks, notification servers, and database configuration",
      "Access all data and execute maintenance, backups, and security audits",
    ],
    user: {
      id: "demo-system-admin",
      displayName: "Demo System Admin",
      email: "system-admin@httlncvn.local",
      role: ROLES.systemAdmin,
    },
  },
} satisfies Record<AccessRole, AccessProfile>;

export const ACCESS_FLOW = [
  ACCESS_PROFILES[ROLES.guest],
  ACCESS_PROFILES[ROLES.churchMember],
  ACCESS_PROFILES[ROLES.churchAdmin],
  ACCESS_PROFILES[ROLES.systemAdmin],
] as const;

export function isAccessRole(value: string | null): value is AccessRole {
  return Object.values(ROLES).includes(value as AccessRole);
}

export function can(role: AccessRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: AccessRole, permissions: readonly Permission[]) {
  return permissions.some((permission) => can(role, permission));
}
