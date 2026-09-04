"use client";

import { useState, type FormEvent } from "react";
import { Bell, Plus, RefreshCw, Send, X } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Pagination, Select, Textarea, cn } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import {
  useCreateNotificationMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type NotificationDto,
} from "@/services/notification";
import { useRouter } from "next/navigation";

export function NotificationPage() {
  const { t } = useTranslation();
  const { confirm, toast } = useFeedback();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "church_admin" || user?.role === "system_admin";

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "church_unit" | "user">("all");
  const [targetId, setTargetId] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  const notificationsQuery = useNotificationsQuery(
    { take: pageSize, skip: page * pageSize },
    isAuthenticated
  );

  const createMutation = useCreateNotificationMutation();
  const markReadMutation = useMarkNotificationReadMutation();

  const notifications = notificationsQuery.data?.items ?? [];
  const total = notificationsQuery.data?.total ?? 0;

  const isSaving = createMutation.isPending;

  if (!isAuthenticated) {
    return (
      <PageLayout
        description={t("nav.notification.description")}
        eyebrow={t("page.notification.eyebrow")}
        title={t("nav.notification.label")}
      >
        <Card className="p-6 text-center max-w-md mx-auto mt-8">
          <Bell className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20 mx-auto" />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Restricted access
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] animate-pulse">
            {t("admin.layout.protectedContent")}
          </p>
        </Card>
      </PageLayout>
    );
  }

  function openCreateModal() {
    setTitle("");
    setMessage("");
    setTargetType("all");
    setTargetId("");
    setActionUrl("");
    setModalOpen(true);
    createMutation.reset();
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        target_type: targetType,
        target_id: targetId.trim() || undefined,
        action_url: actionUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Notification created successfully" });
          closeModal();
        },
      }
    );
  }

  const handleNotificationClick = (notification: NotificationDto) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <PageLayout
      actions={
        isAdmin ? (
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t("action.newItem")}
          </Button>
        ) : null
      }
      description={t("nav.notification.description")}
      eyebrow={t("page.notification.eyebrow")}
      title={t("nav.notification.label")}
    >
      <Card className="overflow-hidden rounded-2xl border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {t("nav.notification.label")}
            </h2>
            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
              {notificationsQuery.isLoading
                ? "Loading notifications..."
                : `Showing ${notifications.length} of ${total} notifications`}
            </p>
          </div>
          <button
            aria-label="Refresh"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--brand-muted)] transition duration-200 active:scale-95"
            onClick={() => void notificationsQuery.refetch()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn("h-5 w-5", notificationsQuery.isFetching ? "animate-spin" : "")}
            />
          </button>
        </div>

        <div className="grid divide-y divide-[var(--border-subtle)]">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={cn(
                "group flex flex-col gap-2 px-6 py-5 transition-colors cursor-pointer hover:bg-[var(--bg-surface)]/50 sm:flex-row sm:items-center sm:justify-between",
                !n.is_read && "bg-[var(--brand-soft)]"
              )}
            >
              <div className="flex min-w-0 flex-1 gap-4 items-start">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  n.is_read ? "bg-[var(--border-subtle)]/40 text-[var(--text-secondary)]" : "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                )}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("truncate text-sm font-bold", n.is_read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)] font-extrabold")}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {!notificationsQuery.isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
              <p className="text-base font-medium text-[var(--text-secondary)]">
                No notifications found.
              </p>
            </div>
          ) : null}
        </div>

        {total > 0 && (
          <Pagination
            className="rounded-none border-x-0 border-b-0"
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        )}
      </Card>

      {/* Creation Modal for Admins */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
          <form
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-lg gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={handleCreate}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  Admin Action
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Create Notification
                </h2>
              </div>
              <button
                aria-label="Close"
                className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                onClick={closeModal}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createMutation.error && (
              <div className="rounded-md border border-[var(--status-danger)]/30 bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--status-danger)]">
                {createMutation.error instanceof Error ? createMutation.error.message : "Submission failed"}
              </div>
            )}

            <div className="grid gap-4">
              <FormField htmlFor="notif-title" label="Title">
                <Input
                  id="notif-title"
                  required
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </FormField>

              <FormField htmlFor="notif-message" label="Message">
                <Textarea
                  id="notif-message"
                  required
                  rows={4}
                  onChange={(event) => setMessage(event.target.value)}
                  value={message}
                />
              </FormField>

              <FormField htmlFor="notif-target-type" label="Target Type">
                <Select
                  id="notif-target-type"
                  onChange={(event) => setTargetType(event.target.value as any)}
                  value={targetType}
                >
                  <option value="all">All Users</option>
                  <option value="church_unit">Church Unit</option>
                  <option value="user">Specific User ID</option>
                </Select>
              </FormField>

              {targetType !== "all" && (
                <FormField htmlFor="notif-target-id" label="Target ID">
                  <Input
                    id="notif-target-id"
                    required
                    onChange={(event) => setTargetId(event.target.value)}
                    value={targetId}
                  />
                </FormField>
              )}

              <FormField htmlFor="notif-action-url" label="Action URL (Optional)">
                <Input
                  id="notif-action-url"
                  placeholder="/church or /course"
                  onChange={(event) => setActionUrl(event.target.value)}
                  value={actionUrl}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={closeModal} type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
              <Button isLoading={isSaving} type="submit">
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      )}
    </PageLayout>
  );
}
