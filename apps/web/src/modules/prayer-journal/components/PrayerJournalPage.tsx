"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, ListTodo, Plus, RefreshCw, Search } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import {
  useCreatePrayerMutation,
  useDeletePrayerMutation,
  usePrayerJournalMetaQuery,
  usePrayerJournalQuery,
  useUpdatePrayerMutation,
  type Prayer,
} from "@services/prayer-journal";
import { CategorySidebar } from "./CategorySidebar";
import { PrayerCard } from "./PrayerCard";
import { PrayerFilterBar } from "./PrayerFilterBar";
import { PrayerModal } from "./PrayerModal";
import {
  createEmptyForm,
  prayerToForm,
  type ModalMode,
  type PrayerForm,
  type StatusFilter,
  type VisibilityFilter,
} from "./prayerJournalTypes";

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

export function PrayerJournalPage() {
  const { can, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { t } = useTranslation();
  const { confirm, toast } = useFeedback();

  const canManageOwn = can(PERMISSIONS.manageOwnPrayers);
  const canModerate = can(PERMISSIONS.moderateChurchPrayers);
  const canShare = can(PERMISSIONS.shareChurchPrayers) || canManageOwn;
  const canRead = canManageOwn;
  const prayersQuery = usePrayerJournalQuery({ take: 100 }, isAuthenticated && canRead);
  const metaQuery = usePrayerJournalMetaQuery(isAuthenticated && canRead);
  const createPrayerMutation = useCreatePrayerMutation();
  const updatePrayerMutation = useUpdatePrayerMutation();
  const deletePrayerMutation = useDeletePrayerMutation();

  const prayers = prayersQuery.data?.items ?? [];
  const categories = metaQuery.data?.categories ?? [];
  const members = metaQuery.data?.members ?? [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [activePrayer, setActivePrayer] = useState<Prayer | null>(null);
  const [form, setForm] = useState<PrayerForm>(createEmptyForm);
  const [closeReason, setCloseReason] = useState("");

  const visiblePrayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return prayers.filter((prayer) => {
      if (statusFilter !== "all" && prayer.status !== statusFilter) return false;
      if (visibilityFilter !== "all" && prayer.visibility !== visibilityFilter) return false;
      if (categoryFilter !== "all" && prayer.category?.id !== categoryFilter) return false;
      if (!normalizedQuery) return true;

      return [
        prayer.title ?? "",
        prayer.content,
        prayer.created_by_name,
        prayer.category?.name ?? "",
        ...prayer.shared_with.map((member) => member.display_name),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [categoryFilter, prayers, query, statusFilter, visibilityFilter]);

  const ownPrayerCount = prayers.filter((prayer) => prayer.created_by === user?.id).length;
  const sharedPrayerCount = prayers.filter((prayer) => prayer.visibility === "shared").length;
  const answeredPrayerCount = prayers.filter((prayer) => prayer.status === "closed").length;
  const isSaving =
    createPrayerMutation.isPending ||
    updatePrayerMutation.isPending ||
    deletePrayerMutation.isPending;
  const mutationError =
    createPrayerMutation.error ?? updatePrayerMutation.error ?? deletePrayerMutation.error;

  function openCreateModal() {
    setActivePrayer(null);
    setForm(createEmptyForm());
    setModalMode("create");
    setModalOpen(true);
  }

  function openEditModal(prayer: Prayer) {
    setActivePrayer(prayer);
    setForm(prayerToForm(prayer));
    setModalMode("edit");
    setModalOpen(true);
  }

  function openViewModal(prayer: Prayer) {
    setActivePrayer(prayer);
    setModalMode("view");
    setModalOpen(true);
  }

  function openCloseModal(prayer: Prayer) {
    setActivePrayer(prayer);
    setCloseReason(prayer.close_reason ?? "");
    setModalMode("close");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActivePrayer(null);
    setCloseReason("");
  }

  function submitPrayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      category_id: form.category_id === "" ? null : form.category_id,
      content: form.content.trim(),
      ...(canShare && form.visibility === "shared"
        ? { shared_with_user_ids: form.selected_member_ids }
        : {}),
      title: form.title.trim() || undefined,
      visibility: canShare ? form.visibility : "private",
    } as const;

    if (modalMode === "edit" && activePrayer) {
      updatePrayerMutation.mutate(
        { dto, id: activePrayer.id },
        {
          onSuccess() {
            toast({ title: t("prayer.toast.saved"), variant: "success" });
            closeModal();
          },
        },
      );
      return;
    }

    createPrayerMutation.mutate(dto, {
      onSuccess() {
        toast({ title: t("prayer.toast.created"), variant: "success" });
        closeModal();
      },
    });
  }

  async function deletePrayer() {
    async function deletePrayer() {
      if (!activePrayer) return;

      const ok = await confirm({
        description: t("action.delete_confirm_desc"),
        title: t("prayer.action.delete"),
        variant: "delete",
      });
      if (!ok) return;

      deletePrayerMutation.mutate(activePrayer.id, {
        onSuccess() {
          toast({ title: t("prayer.toast.deleted"), variant: "success" });
          closeModal();
        },
      });
    }

    function closePrayer(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!activePrayer) return;

      updatePrayerMutation.mutate(
        {
          dto: {
            close_reason: closeReason.trim() || undefined,
            status: "closed",
          },
          id: activePrayer.id,
        },
        {
          onSuccess() {
            toast({ title: t("prayer.toast.closed"), variant: "success" });
            closeModal();
          },
        },
      );
    }

    function reopenPrayer(prayer: Prayer) {
      updatePrayerMutation.mutate(
        {
          dto: { status: "open" },
          id: prayer.id,
        },
        {
          onSuccess() {
            toast({ title: t("prayer.toast.reopened"), variant: "success" });
            closeModal();
          },
        },
      );
    }

    function togglePrayerStatus(prayer: Prayer) {
      if (prayer.status === "open") {
        openCloseModal(prayer);
        return;
      }

      reopenPrayer(prayer);
    }

    return (
      <PageLayout
        actions={
          canManageOwn ? (
            <Button onClick={openCreateModal}>
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("prayer.action.add")}
            </Button>
          ) : null
        }
        description={t("page.prayerJournal.description")}
        eyebrow={t("page.prayerJournal.eyebrow")}
        title={t("page.prayerJournal.title")}
      >
        {!authLoading && !canRead ? (
          <Card className="p-5">
            <p className="font-semibold text-[var(--text-primary)]">{t("admin.members.restrictedTitle")}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t("admin.members.restrictedDescription")}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {t("prayer.summary.mine")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{ownPrayerCount}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {t("prayer.summary.shared")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{sharedPrayerCount}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {t("prayer.summary.answered")}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{answeredPrayerCount}</p>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid gap-4">
                <Card className="overflow-hidden rounded-[1.75rem]">
                  <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase text-[var(--brand-primary)]">
                        <ListTodo aria-hidden="true" className="h-4 w-4" />
                        {t("prayer.todo.label")}
                      </div>
                      <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        {t("prayer.todo.title")}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {t("prayer.todo.description")}
                      </p>
                    </div>

                    <div className="flex w-full items-center gap-3 lg:w-auto">
                      <div className="relative min-w-0 flex-1 lg:w-80">
                        <Search
                          aria-hidden="true"
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                        />
                        <Input
                          className="pl-10"
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={t("prayer.search.placeholder")}
                          value={query}
                        />
                      </div>
                      <Button
                        aria-label={t("admin.members.refresh")}
                        onClick={() => {
                          void prayersQuery.refetch();
                          void metaQuery.refetch();
                        }}
                        variant="secondary"
                      >
                        <RefreshCw
                          aria-hidden="true"
                          className={cn(
                            "h-4 w-4",
                            prayersQuery.isFetching || metaQuery.isFetching ? "animate-spin" : "",
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 px-5 py-5">
                    <PrayerFilterBar
                      onStatusChange={setStatusFilter}
                      onVisibilityChange={setVisibilityFilter}
                      statusFilter={statusFilter}
                      visibilityFilter={visibilityFilter}
                    />

                    {prayersQuery.error || metaQuery.error || mutationError ? (
                      <div className="rounded-2xl border border-[var(--status-danger)]/30 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger)]">
                        {mutationErrorMessage(prayersQuery.error ?? metaQuery.error ?? mutationError)}
                      </div>
                    ) : null}

                    {prayersQuery.isLoading ? (
                      <div className="grid gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            className="h-28 animate-pulse rounded-2xl bg-[var(--bg-base)]"
                            key={index}
                          />
                        ))}
                      </div>
                    ) : visiblePrayers.length === 0 ? (
                      <Card className="grid place-items-center gap-2 rounded-2xl py-16 text-center">
                        <BookOpen aria-hidden="true" className="h-10 w-10 text-[var(--text-tertiary)]" />
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">
                          {t("prayer.list.empty")}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {t("prayer.list.emptyHint")}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-3">
                        {visiblePrayers.map((prayer) => (
                          <PrayerCard
                            canEdit={prayer.created_by === user?.id || canModerate}
                            key={prayer.id}
                            onEdit={openEditModal}
                            onToggleStatus={togglePrayerStatus}
                            onView={openViewModal}
                            prayer={prayer}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <CategorySidebar
                categories={categories}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                prayers={prayers}
              />
            </div>
          </>
        )}

        {modalOpen ? (
          <PrayerModal
            activePrayer={activePrayer}
            canManageOwn={Boolean(
              activePrayer ? activePrayer.created_by === user?.id || canModerate : canManageOwn,
            )}
            categories={categories}
            closeReason={closeReason}
            form={form}
            isSaving={isSaving}
            members={members}
            modalMode={modalMode}
            onClose={closeModal}
            onClosePrayer={closePrayer}
            onCloseReasonChange={setCloseReason}
            onDelete={deletePrayer}
            onFormChange={setForm}
            onOpenClose={openCloseModal}
            onOpenEdit={openEditModal}
            onReopenPrayer={reopenPrayer}
            onSubmitPrayer={submitPrayer}
          />
        ) : null}
      </PageLayout>
    );
  }
