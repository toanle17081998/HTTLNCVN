"use client";

import { PageLayout } from "@/components/layout";
import { Button, Card, cn } from "@/components/ui";
import {
  ACCESS_FLOW,
  useAuth,
  type AccessProfile,
} from "@/providers/AuthProvider";

function roleActionLabel(profile: AccessProfile) {
  if (profile.role === "guest") {
    return "Continue as guest";
  }

  return `Use ${profile.shortLabel}`;
}

export function AuthPage() {
  const { accessRole, currentProfile, switchRole, user } = useAuth();

  return (
    <PageLayout
      description="Pick the access flow you want to preview. Guest users browse public content, church members use personal community tools, church admins manage ministry content, and system admins operate the platform."
      eyebrow="Access flow"
      title="Choose one of four user paths"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-4 md:grid-cols-2">
          {ACCESS_FLOW.map((profile) => {
            const isActive = profile.role === accessRole;

            return (
              <Card
                className={cn(
                  "grid gap-5 p-6",
                  isActive && "border-[var(--brand-primary)] shadow-md",
                )}
                key={profile.role}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                      {profile.shortLabel}
                    </p>
                    {isActive ? (
                      <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                    {profile.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {profile.description}
                  </p>
                </div>

                <ul className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  {profile.capabilities.map((capability) => (
                    <li
                      className="rounded-md border border-[var(--border-subtle)] px-3 py-2"
                      key={capability}
                    >
                      {capability}
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={isActive}
                  onClick={() => switchRole(profile.role)}
                  variant={isActive ? "secondary" : "primary"}
                >
                  {isActive ? "Current flow" : roleActionLabel(profile)}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="h-max p-6">
          <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
            Current access
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            {currentProfile.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {currentProfile.description}
          </p>
          <div className="mt-5 rounded-md border border-[var(--border-subtle)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {user?.displayName ?? "Guest visitor"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {user?.email ?? "No account session"}
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
