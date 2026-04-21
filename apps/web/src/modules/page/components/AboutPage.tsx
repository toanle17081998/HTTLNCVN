"use client";

import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";

export function AboutPage() {
  return (
    <PageLayout
      description="Public information about HTNC, our learning focus, and the community this platform supports."
      eyebrow="Public"
      title="About Us"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            A shared place for learning and community
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            HTNC Platform brings public updates, learning paths, events, and
            member tools into one calm workspace. Guests can learn who we are;
            members and admins unlock deeper community workflows after login.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Public access
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            This page is available to every role, including guests.
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
