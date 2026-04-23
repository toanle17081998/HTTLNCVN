"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, Plus } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import {
  prayerCategoryMockData,
  prayerMockData,
  type Prayer,
  type PrayerCategory,
} from "@/mockData";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
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

export function PrayerJournalPage() {
  const { can } = useAuth();
  const { t } = useTranslation();
  const { confirm } = useFeedback();

  const canModerate = can(PERMISSIONS.moderateChurchPrayers);
  const canManageOwn = can(PERMISSIONS.manageOwnPrayers);

  // ── State ──────────────────────────────────────────────────────────────────
  const [prayers, setPrayers] = useState<Prayer[]>(prayerMockData);
  const [categories] = useState<PrayerCategory[]>(prayerCategoryMockData);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [activePrayer, setActivePrayer] = useState<Prayer | null>(null);
  const [form, setForm] = useState<PrayerForm>(createEmptyForm);
  const [closeReason, setCloseReason] = useState("");

  // ── Derived ────────────────────────────────────────────────────────────────
  const visiblePrayers = useMemo(
    () =>
      prayers
        .filter((p) => {
          if (statusFilter !== "all" && p.status !== statusFilter) return false;
          if (visibilityFilter !== "all" && p.visibility !== visibilityFilter) return false;
          if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
          return true;
        })
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [prayers, statusFilter, visibilityFilter, categoryFilter],
  );

  // ── Modal helpers ──────────────────────────────────────────────────────────
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
    setCloseReason("");
    setModalMode("close");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActivePrayer(null);
    setCloseReason("");
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  function submitPrayer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const now = new Date().toISOString();

    if (modalMode === "create") {
      const newPrayer: Prayer = {
        id: crypto.randomUUID(),
        title: form.title || null,
        content: form.content,
        visibility: form.visibility,
        status: "open",
        close_reason: null,
        category_id: form.category_id === "" ? null : form.category_id,
        created_by: "demo-church-member",
        created_at: now,
        updated_at: now,
        closed_at: null,
      };
      setPrayers((prev) => [newPrayer, ...prev]);
    } else if (modalMode === "edit" && activePrayer) {
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === activePrayer.id
            ? {
                ...p,
                title: form.title || null,
                content: form.content,
                visibility: form.visibility,
                category_id: form.category_id === "" ? null : form.category_id,
                updated_at: now,
              }
            : p,
        ),
      );
    }
    closeModal();
  }

  async function deletePrayer() {
    if (!activePrayer) return;
    const ok = await confirm({
      variant: "delete",
      title: t("prayer.action.delete"),
      description: t("action.delete_confirm_desc"),
    });
    if (!ok) return;
    setPrayers((prev) => prev.filter((p) => p.id !== activePrayer.id));
    closeModal();
  }

  function closePrayer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activePrayer) return;
    const now = new Date().toISOString();
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === activePrayer.id
          ? { ...p, status: "closed", close_reason: closeReason || null, closed_at: now, updated_at: now }
          : p,
      ),
    );
    closeModal();
  }

  function reopenPrayer(prayer: Prayer) {
    const now = new Date().toISOString();
    setPrayers((prev) =>
      prev.map((p) =>
        p.id === prayer.id
          ? { ...p, status: "open", close_reason: null, closed_at: null, updated_at: now }
          : p,
      ),
    );
    closeModal();
  }

  // ──────────────────────────────────────────────────────────────────────────
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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── Left: filter + cards ── */}
        <div className="grid gap-4">
          <PrayerFilterBar
            statusFilter={statusFilter}
            visibilityFilter={visibilityFilter}
            onStatusChange={setStatusFilter}
            onVisibilityChange={setVisibilityFilter}
          />

          {visiblePrayers.length === 0 ? (
            <Card className="grid place-items-center gap-2 py-16 text-center">
              <BookOpen
                aria-hidden="true"
                className="h-10 w-10 text-[var(--text-tertiary)]"
              />
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
                  key={prayer.id}
                  categories={categories}
                  canEdit={canManageOwn || canModerate}
                  prayer={prayer}
                  onEdit={openEditModal}
                  onView={openViewModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: category sidebar ── */}
        <CategorySidebar
          categories={categories}
          categoryFilter={categoryFilter}
          prayers={prayers}
          onCategoryChange={setCategoryFilter}
        />
      </div>

      {/* ── Modal ── */}
      {modalOpen ? (
        <PrayerModal
          activePrayer={activePrayer}
          canManageOwn={canManageOwn}
          canModerate={canModerate}
          categories={categories}
          closeReason={closeReason}
          form={form}
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
