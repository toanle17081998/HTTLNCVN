"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Edit3,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Pagination, Select, Textarea, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useChurchUnitMetaQuery,
  useChurchUnitsQuery,
  useCreateChurchUnitMutation,
  useDeleteChurchUnitMutation,
  useUpdateChurchUnitMutation,
  type ChurchUnit,
} from "@services/church-unit";

type ChurchUnitForm = {
  description: string;
  is_active: boolean;
  leader_id: string;
  member_ids: string[];
  name: string;
  parent_id: string;
  sort_order: string;
  type: string;
};

function createEmptyForm(defaultType = "small_group"): ChurchUnitForm {
  return {
    description: "",
    is_active: true,
    leader_id: "",
    member_ids: [],
    name: "",
    parent_id: "",
    sort_order: "0",
    type: defaultType,
  };
}

function churchUnitToForm(unit: ChurchUnit): ChurchUnitForm {
  return {
    description: unit.description ?? "",
    is_active: unit.is_active,
    leader_id: unit.leader?.id ?? "",
    member_ids: unit.members.map((member) => member.id),
    name: unit.name,
    parent_id: unit.parent?.id ?? "",
    sort_order: String(unit.sort_order),
    type: unit.type,
  };
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function typeLabel(type: string) {
  return type.replaceAll("_", " ");
}

type ChurchUnitPageProps = {
  admin?: boolean;
};

export function ChurchUnitPage({ admin = false }: ChurchUnitPageProps) {
  const { t } = useTranslation();
  const { can, isAuthenticated, isLoading: authLoading } = useAuth();
  const { confirm, toast } = useFeedback();
  const canReadUnits = can(PERMISSIONS.manageChurchUnits);
  const canCreateUnits = can(PERMISSIONS.createChurchUnits) || canReadUnits;
  const canUpdateUnits = can(PERMISSIONS.updateChurchUnits);
  const canDeleteUnits = can(PERMISSIONS.deleteChurchUnits);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const unitsQuery = useChurchUnitsQuery(
    { take: pageSize, skip: page * pageSize },
    isAuthenticated && canReadUnits,
  );
  const metaQuery = useChurchUnitMetaQuery(isAuthenticated && canReadUnits);
  const createMutation = useCreateChurchUnitMutation();
  const updateMutation = useUpdateChurchUnitMutation();
  const deleteMutation = useDeleteChurchUnitMutation();
  const units = unitsQuery.data?.items ?? [];
  const meta = metaQuery.data;
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ChurchUnit | null>(null);
  const [form, setForm] = useState<ChurchUnitForm>(() =>
    createEmptyForm(meta?.types[0] ?? "small_group"),
  );

  const visibleUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return units.filter((unit) => {
      if (typeFilter !== "all" && unit.type !== typeFilter) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        String(unit.is_active) !== String(statusFilter === "active")
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        unit.name,
        unit.type,
        unit.description ?? "",
        unit.parent?.name ?? "",
        unit.leader?.display_name ?? "",
        ...unit.members.map((member) => member.display_name),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, statusFilter, typeFilter, units]);

  const activeCount = units.filter((unit) => unit.is_active).length;
  const teamCount = units.filter((unit) => unit.type === "team").length;
  const memberCount = units.reduce((total, unit) => total + unit.member_count, 0);
  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  function openCreateModal() {
    setEditingUnit(null);
    setForm(createEmptyForm(meta?.types[0] ?? "small_group"));
    setModalOpen(true);
  }

  function openEditModal(unit: ChurchUnit) {
    setEditingUnit(unit);
    setForm(churchUnitToForm(unit));
    setModalOpen(true);
  }

  function closeModal() {
    setEditingUnit(null);
    setModalOpen(false);
  }

  function submitChurchUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dto = {
      description: form.description.trim() || null,
      is_active: form.is_active,
      leader_id: form.leader_id || null,
      member_ids: form.member_ids,
      name: form.name.trim(),
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
      type: form.type,
    };

    if (editingUnit) {
      updateMutation.mutate(
        { dto, id: editingUnit.id },
        {
          onSuccess() {
            toast({ title: t("admin.churchUnits.toast.saved"), variant: "success" });
            closeModal();
          },
        },
      );
      return;
    }

    createMutation.mutate(dto, {
      onSuccess() {
        toast({ title: t("admin.churchUnits.toast.created"), variant: "success" });
        closeModal();
      },
    });
  }

  async function handleDelete(unit: ChurchUnit) {
    const ok = await confirm({
      title: t("admin.churchUnits.deleteConfirm", { name: unit.name }),
      variant: "delete",
    });

    if (!ok) {
      return;
    }

    deleteMutation.mutate(unit.id, {
      onSuccess() {
        toast({ title: t("admin.churchUnits.toast.deleted"), variant: "success" });
        if (editingUnit?.id === unit.id) {
          closeModal();
        }
      },
    });
  }

  const filteredParentOptions = (meta?.units ?? []).filter((unit) => unit.id !== editingUnit?.id);

  return (
    <PageLayout
      actions={
        canCreateUnits ? (
          <Button onClick={openCreateModal}>
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("admin.churchUnits.add")}
          </Button>
        ) : null
      }
      description={admin ? t("admin.churchUnits.description") : t("page.churchUnit.description")}
      eyebrow={admin ? t("admin.common.admin") : t("page.churchUnit.eyebrow")}
      title={t("nav.churchUnit.label")}
    >
      {!authLoading && !canReadUnits ? (
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
                {t("admin.churchUnits.active")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{activeCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("admin.churchUnits.teams")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{teamCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("admin.churchUnits.membersAssigned")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{memberCount}</p>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-2xl border-[var(--border-subtle)] shadow-sm transition-all duration-300">
            <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {t("admin.churchUnits.list")}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                    {unitsQuery.isLoading
                      ? t("admin.churchUnits.loading")
                      : t("admin.churchUnits.records", {
                          count: String(visibleUnits.length),
                          total: String(unitsQuery.data?.total ?? 0),
                        })}
                  </p>
                </div>
                <div className="flex w-full items-center gap-3 lg:w-auto">
                  <div className="relative min-w-0 flex-1 lg:w-80">
                    <Search
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                    />
                    <Input
                      className="h-11 rounded-xl pl-11 shadow-sm"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("admin.churchUnits.search")}
                      value={query}
                    />
                  </div>
                  <Button
                    aria-label={t("admin.members.refresh")}
                    className="h-11 w-11 shrink-0 rounded-xl"
                    onClick={() => {
                      void unitsQuery.refetch();
                      void metaQuery.refetch();
                    }}
                    variant="secondary"
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4",
                        unitsQuery.isFetching || metaQuery.isFetching ? "animate-spin" : "",
                      )}
                    />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField htmlFor="church-unit-type-filter" label={t("admin.churchUnits.type")}>
                  <Select
                    id="church-unit-type-filter"
                    onChange={(event) => setTypeFilter(event.target.value)}
                    value={typeFilter}
                  >
                    <option value="all">{t("prayer.filter.all")}</option>
                    {(meta?.types ?? []).map((type) => (
                      <option key={type} value={type}>
                        {typeLabel(type)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField htmlFor="church-unit-status-filter" label={t("course.form.status")}>
                  <Select
                    id="church-unit-status-filter"
                    onChange={(event) => setStatusFilter(event.target.value)}
                    value={statusFilter}
                  >
                    <option value="all">{t("prayer.filter.all")}</option>
                    <option value="active">{t("admin.churchUnits.status.active")}</option>
                    <option value="inactive">{t("admin.churchUnits.status.inactive")}</option>
                  </Select>
                </FormField>
              </div>
            </div>

            {unitsQuery.error || metaQuery.error || mutationError ? (
              <div
                className="m-6 rounded-xl border p-4 text-sm font-medium"
                style={{
                  backgroundColor: "var(--status-danger-bg)",
                  borderColor: "color-mix(in srgb, var(--status-danger) 24%, var(--border-subtle))",
                  color: "var(--status-danger)",
                }}
              >
                {mutationErrorMessage(unitsQuery.error ?? metaQuery.error ?? mutationError)}
              </div>
            ) : null}

            <div className="grid divide-y divide-[var(--border-subtle)]">
              {visibleUnits.map((unit) => (
                <div
                  className="group flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-[var(--bg-surface)]/50 sm:flex-row sm:items-center"
                  key={unit.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                      <Building2 aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-bold text-[var(--text-primary)]">
                          {unit.name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-bold capitalize",
                            unit.is_active
                              ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                              : "bg-[var(--bg-base)] text-[var(--text-secondary)]",
                          )}
                        >
                          {unit.is_active
                            ? t("admin.churchUnits.status.active")
                            : t("admin.churchUnits.status.inactive")}
                        </span>
                      </div>
                      <p className="truncate text-sm font-medium capitalize text-[var(--text-tertiary)]">
                        {typeLabel(unit.type)}
                        {unit.parent ? ` · ${unit.parent.name}` : ""}
                        {unit.leader ? ` · ${unit.leader.display_name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:w-80 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                      <Users aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      <span>{unit.member_count}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                      <FolderTree aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      <span>{unit.children_count}</span>
                    </div>
                    <div className="flex gap-2">
                      {canUpdateUnits ? (
                        <button
                          aria-label={t("admin.churchUnits.editNamed", { name: unit.name })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                          onClick={() => openEditModal(unit)}
                          type="button"
                        >
                          <Edit3 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {canDeleteUnits ? (
                        <button
                          aria-label={t("admin.churchUnits.deleteNamed", { name: unit.name })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--status-danger)] transition-all hover:bg-[var(--status-danger-bg)]"
                          onClick={() => void handleDelete(unit)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {!unitsQuery.isLoading && visibleUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Building2 className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
                  <p className="text-base font-medium text-[var(--text-secondary)]">
                    {t("admin.churchUnits.empty")}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            {(unitsQuery.data?.total ?? 0) > 0 ? (
              <Pagination
                className="rounded-none border-x-0 border-b-0"
                page={page}
                pageSize={pageSize}
                total={unitsQuery.data?.total ?? 0}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
              />
            ) : null}
          </Card>
        </>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
          <form
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-4xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitChurchUnit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  {t("admin.churchUnits.eyebrow")}
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {editingUnit ? t("admin.churchUnits.edit") : t("admin.churchUnits.add")}
                </h2>
              </div>
              <button
                aria-label={t("action.close")}
                className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                onClick={closeModal}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {mutationError ? (
              <div className="rounded-md border border-[var(--status-danger)]/30 bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--status-danger)]">
                {mutationErrorMessage(mutationError)}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="church-unit-name" label={t("admin.churchUnits.name")}>
                <Input
                  id="church-unit-name"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={form.name}
                />
              </FormField>
              <FormField htmlFor="church-unit-type" label={t("admin.churchUnits.type")}>
                <Select
                  id="church-unit-type"
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  value={form.type}
                >
                  {(meta?.types ?? []).map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="church-unit-parent" label={t("admin.churchUnits.parent")}>
                <Select
                  id="church-unit-parent"
                  onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                  value={form.parent_id}
                >
                  <option value="">{t("admin.churchUnits.parentNone")}</option>
                  {filteredParentOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="church-unit-leader" label={t("admin.churchUnits.leader")}>
                <Select
                  id="church-unit-leader"
                  onChange={(event) => setForm((current) => ({ ...current, leader_id: event.target.value }))}
                  value={form.leader_id}
                >
                  <option value="">{t("admin.churchUnits.leaderNone")}</option>
                  {(meta?.members ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="church-unit-sort-order" label={t("admin.churchUnits.sortOrder")}>
                <Input
                  id="church-unit-sort-order"
                  onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                  type="number"
                  value={form.sort_order}
                />
              </FormField>
              <FormField htmlFor="church-unit-status" label={t("course.form.status")}>
                <Select
                  id="church-unit-status"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.value === "active" }))
                  }
                  value={form.is_active ? "active" : "inactive"}
                >
                  <option value="active">{t("admin.churchUnits.status.active")}</option>
                  <option value="inactive">{t("admin.churchUnits.status.inactive")}</option>
                </Select>
              </FormField>
              <FormField className="sm:col-span-2" htmlFor="church-unit-description" label={t("admin.churchUnits.descriptionField")}>
                <Textarea
                  id="church-unit-description"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  value={form.description}
                />
              </FormField>
              <FormField className="sm:col-span-2" htmlFor="church-unit-members" label={t("admin.churchUnits.members")}>
                <div
                  className="grid max-h-60 gap-2 overflow-y-auto rounded-xl border border-[var(--border-subtle)] p-3"
                  id="church-unit-members"
                >
                  {(meta?.members ?? []).map((member) => {
                    const checked = form.member_ids.includes(member.id);
                    return (
                      <label
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-base)]"
                        key={member.id}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                            {member.display_name}
                          </span>
                          <span className="block truncate text-xs text-[var(--text-tertiary)]">
                            @{member.username}
                          </span>
                        </span>
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-[var(--brand-primary)]"
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              member_ids: event.target.checked
                                ? [...current.member_ids, member.id]
                                : current.member_ids.filter((id) => id !== member.id),
                            }))
                          }
                          type="checkbox"
                        />
                      </label>
                    );
                  })}
                </div>
              </FormField>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {editingUnit && canDeleteUnits ? (
                <Button
                  isLoading={deleteMutation.isPending}
                  onClick={() => void handleDelete(editingUnit)}
                  type="button"
                  variant="danger"
                >
                  <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t("admin.common.delete")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button onClick={closeModal} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
                <Button isLoading={isSaving} type="submit">
                  {editingUnit ? t("admin.churchUnits.saveChanges") : t("admin.churchUnits.create")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
