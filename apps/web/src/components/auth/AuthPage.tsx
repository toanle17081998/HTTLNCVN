"use client";

import { Text, Button, Card, FormField, Input, Title } from "@/components/ui";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useLoginMutation, useLogoutMutation } from "@/hooks/auth";

const seededAccounts = [
  { email: "member@htnc.local", label: "Church Member" },
  { email: "editor@htnc.local", label: "Church Admin" },
  { email: "admin@htnc.local", label: "System Admin" },
];

export function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuth();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const [email, setEmail] = useState("editor@htnc.local");
  const [password, setPassword] = useState("seed-password");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginMutation.mutateAsync({ email, password });
    router.push("/");
    router.refresh();
  }

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="grid gap-6 p-6 sm:p-8">
          <div>
            <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
              Authentication
            </Text>
            <Title as="h1" className="mt-2 text-3xl font-semibold" variant="inherit">
              Sign in
            </Title>
            <Text as="p" tone="inherit" variant="inherit" className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Sign in with a real API account. Authorization is loaded from database roles,
              actions, resources, and role permissions.
            </Text>
          </div>

          <form className="grid gap-4" onSubmit={handleLogin}>
            <FormField htmlFor="api-email" label="Email">
              <Input
                id="api-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </FormField>

            <FormField htmlFor="api-password" label="Password">
              <Input
                id="api-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </FormField>

            <div className="flex flex-wrap gap-2">
              <Button isLoading={loginMutation.isPending} type="submit">
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
              <Button
                disabled={!isAuthenticated || logoutMutation.isPending}
                onClick={handleLogout}
                type="button"
                variant="secondary"
              >
                Sign out
              </Button>
            </div>

            {loginMutation.error ? (
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-medium text-[var(--status-danger)]">
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : "Login failed."}
              </Text>
            ) : null}
          </form>

          <div className="grid gap-2">
            {seededAccounts.map((account) => (
              <button
                className="rounded-md border border-[var(--border-subtle)] px-3 py-2 text-left text-sm transition hover:bg-[var(--brand-muted)]"
                key={account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword("seed-password");
                }}
                type="button"
              >
                <span className="block font-semibold text-[var(--text-primary)]">
                  {account.label}
                </span>
                <span className="text-[var(--text-secondary)]">{account.email}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="h-max p-6">
          <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
            Current session
          </Text>
          <Title as="h2" className="mt-2" variant="cardSoft">
            {isAuthenticated ? role : "Guest"}
          </Title>
          <div className="mt-5 rounded-md border border-[var(--border-subtle)] px-4 py-3">
            <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold text-[var(--text-primary)]">
              {user?.username ?? "Public visitor"}
            </Text>
            <Text variant="small">
              {user?.email ?? "No API session"}
            </Text>
          </div>
          {user ? (
            <Text as="p" tone="inherit" variant="inherit" className="mt-4 text-sm text-[var(--text-secondary)]">
              {user.permissions.length} permissions loaded from the database.
            </Text>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
