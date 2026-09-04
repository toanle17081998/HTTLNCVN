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
  BookOpen,
  GraduationCap,
  Trophy,
  CheckCircle,
  Clock,
  AlertCircle,
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
  useClassScoresQuery,
  type ChurchUnit,
  type ChurchUnitMember,
  type CreateChurchUnitMemberInput,
} from "@/services/church-unit";
import { useCoursesQuery } from "@/services/course";

type ServiceTeamForm = {
  id?: string;
  name: string;
  leader_id: string;
  member_ids: string[];
};

type ChurchUnitForm = {
  description: string;
  is_active: boolean;
  leader_id: string;
  leader_position: string;
  name: string;
  parent_id: string;
  sort_order: string;
  type: string;
  assigned_course_ids: string[];
  class_admin_ids: string[];
  class_member_ids: string[];
  team_admin_ids: string[];
  team_member_ids: string[];
  auto_assign_schedule_ids: string[];
  service_teams: ServiceTeamForm[];
};

function createEmptyForm(defaultType = "cell_group"): ChurchUnitForm {
  return {
    description: "",
    is_active: true,
    leader_id: "",
    leader_position: "",
    name: "",
    parent_id: "",
    sort_order: "0",
    type: defaultType,
    assigned_course_ids: [],
    class_admin_ids: [],
    class_member_ids: [],
    team_admin_ids: [],
    team_member_ids: [],
    auto_assign_schedule_ids: [],
    service_teams: [],
  };
}

function churchUnitToForm(unit: ChurchUnit): ChurchUnitForm {
  const classAdminIds = unit.members
    .filter((m) => m.role === "admin" || m.role === "admin_member")
    .map((m) => m.id);
  const classMemberIds = unit.members
    .filter((m) => m.role === "member" || m.role === "admin_member" || !m.role)
    .map((m) => m.id);

  const teamAdminIds = unit.members
    .filter((m) => m.role === "admin" || m.role === "admin_member")
    .map((m) => m.id);
  const teamMemberIds = unit.members
    .filter((m) => m.role === "member" || m.role === "admin_member" || !m.role)
    .map((m) => m.id);

  const autoAssignScheduleIds = unit.members
    .filter((m) => m.auto_assign_schedule)
    .map((m) => m.id);

  const serviceTeams = (unit.service_teams ?? []).map((st) => ({
    id: st.id,
    name: st.name,
    leader_id: st.leader?.id ?? "",
    member_ids: st.members.map((m) => m.id),
  }));

  return {
    description: unit.description ?? "",
    is_active: unit.is_active,
    leader_id: unit.leader?.id ?? "",
    leader_position: unit.leader_position ?? "",
    name: unit.name,
    parent_id: unit.parent?.id ?? "",
    sort_order: String(unit.sort_order),
    type: unit.type,
    assigned_course_ids: (unit.courses ?? []).map((c) => c.id),
    class_admin_ids: classAdminIds,
    class_member_ids: classMemberIds,
    team_admin_ids: teamAdminIds,
    team_member_ids: teamMemberIds,
    auto_assign_schedule_ids: autoAssignScheduleIds,
    service_teams: serviceTeams,
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
  hideLayout?: boolean;
};

export function ChurchUnitPage({ admin = false, hideLayout = false }: ChurchUnitPageProps) {
  const { t } = useTranslation();
  const { can, isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { confirm, toast } = useFeedback();

  const canReadUnits = can(PERMISSIONS.manageChurchUnits);
  const canCreateUnits = can(PERMISSIONS.createChurchUnits) || canReadUnits;
  const canUpdateUnits = can(PERMISSIONS.updateChurchUnits);
  const canDeleteUnits = can(PERMISSIONS.deleteChurchUnits);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const unitsQuery = useChurchUnitsQuery(
    { take: pageSize, skip: page * pageSize },
    isAuthenticated,
  );
  const metaQuery = useChurchUnitMetaQuery(isAuthenticated && canReadUnits);
  const coursesQuery = useCoursesQuery({ take: 100 });

  const createMutation = useCreateChurchUnitMutation();
  const updateMutation = useUpdateChurchUnitMutation();
  const deleteMutation = useDeleteChurchUnitMutation();

  const units = unitsQuery.data?.items ?? [];
  const meta = metaQuery.data;
  const courses = coursesQuery.data?.items ?? [];

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ChurchUnit | null>(null);
  const [activeScoresUnit, setActiveScoresUnit] = useState<ChurchUnit | null>(null);

  const [form, setForm] = useState<ChurchUnitForm>(() =>
    createEmptyForm(meta?.types[0] ?? "cell_group"),
  );

  const isClassAdmin = (unit: ChurchUnit) => {
    if (!currentUser) return false;
    return unit.type === "class" && unit.members.some(
      (m) => m.id === currentUser.id && (m.role === "admin" || m.role === "admin_member")
    );
  };

  const hasPageAccess = can(PERMISSIONS.manageChurchUnits) || units.some((unit) => isClassAdmin(unit));

  const visibleUnits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const isSystemAdmin = can(PERMISSIONS.manageChurchUnits);

    return units.filter((unit) => {
      if (!isSystemAdmin && !isClassAdmin(unit)) {
        return false;
      }

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
  const cellGroupCount = units.filter((unit) => unit.type === "cell_group").length;
  const memberCount = units.reduce((total, unit) => total + unit.member_count, 0);
  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  function openCreateModal() {
    setEditingUnit(null);
    setForm(createEmptyForm(meta?.types[0] ?? "cell_group"));
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

    const type = form.type;
    let membersInput: CreateChurchUnitMemberInput[] = [];

    if (type === "class") {
      const allClassUserIds = [...new Set([...form.class_admin_ids, ...form.class_member_ids])];
      membersInput = allClassUserIds.map((userId) => {
        const isAdmin = form.class_admin_ids.includes(userId);
        const isMember = form.class_member_ids.includes(userId);
        let role = "member";
        if (isAdmin && isMember) {
          role = "admin_member";
        } else if (isAdmin) {
          role = "admin";
        }
        return { user_id: userId, role };
      });
    } else if (type === "care_team" || type === "praise_worship") {
      const allTeamUserIds = [...new Set([...form.team_admin_ids, ...form.team_member_ids])];
      membersInput = allTeamUserIds.map((userId) => {
        const isAdmin = form.team_admin_ids.includes(userId);
        const isMember = form.team_member_ids.includes(userId);
        let role = "member";
        if (isAdmin && isMember) {
          role = "admin_member";
        } else if (isAdmin) {
          role = "admin";
        }
        return {
          user_id: userId,
          role,
          auto_assign_schedule: isMember && form.auto_assign_schedule_ids.includes(userId),
        };
      });
    } else if (type === "event_organizer") {
      membersInput = [];
    } else {
      // Cell Group and others use generic member list stored in class_member_ids
      membersInput = form.class_member_ids.map((id) => ({ user_id: id, role: "member" }));
    }

    const dto = {
      description: form.description.trim() || null,
      is_active: form.is_active,
      leader_id: (type === "cell_group" || type === "event_organizer") ? (form.leader_id || null) : null,
      leader_position: type === "cell_group" ? (form.leader_position.trim() || null) : null,
      name: form.name.trim(),
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
      type: form.type,
      members: membersInput,
      ...(type === "class" && { assigned_course_ids: form.assigned_course_ids }),
      ...(type === "event_organizer" && {
        service_teams: form.service_teams.map((st) => ({
          id: st.id,
          name: st.name,
          leader_id: st.leader_id || null,
          member_ids: st.member_ids,
        })),
      }),
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

  const content = (
    <>
      {!authLoading && !unitsQuery.isLoading && !hasPageAccess ? (
        <Card className="p-5">
          <p className="font-semibold text-[var(--text-primary)]">{t("admin.members.restrictedTitle")}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("admin.members.restrictedDescription")}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                {t("admin.churchUnits.active")}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                Cell Groups
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{cellGroupCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                {t("admin.churchUnits.membersAssigned")}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{memberCount}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="church-unit-search">
                {t("common.search")}
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <Input
                  id="church-unit-search"
                  className="h-9 pl-10 text-sm"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("admin.churchUnits.search")}
                  value={query}
                />
              </div>
            </div>

            <div className="flex items-end gap-2 shrink-0">
              <div className="flex flex-col gap-1 min-w-0 flex-1 sm:w-40 sm:flex-none">
                <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="church-unit-type-filter">
                  {t("common.type")}
                </label>
                <Select
                  id="church-unit-type-filter"
                  aria-label={t("admin.churchUnits.type")}
                  className="h-9 text-sm"
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
              </div>

              <div className="flex flex-col gap-1 min-w-0 flex-1 sm:w-36 sm:flex-none">
                <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="church-unit-status-filter">
                  {t("common.status")}
                </label>
                <Select
                  id="church-unit-status-filter"
                  aria-label={t("course.form.status")}
                  className="h-9 text-sm"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  <option value="active">{t("admin.churchUnits.status.active")}</option>
                  <option value="inactive">{t("admin.churchUnits.status.inactive")}</option>
                </Select>
              </div>

              <button
                aria-label={t("admin.members.refresh")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--brand-muted)] transition duration-200"
                onClick={() => {
                  void unitsQuery.refetch();
                  void metaQuery.refetch();
                }}
                type="button"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4",
                    unitsQuery.isFetching || metaQuery.isFetching ? "animate-spin" : "",
                  )}
                />
              </button>
              {hideLayout && canCreateUnits ? (
                <Button onClick={openCreateModal} size="sm">
                  <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t("admin.churchUnits.add")}
                </Button>
              ) : null}
            </div>
          </div>

          {unitsQuery.error || metaQuery.error || mutationError ? (
            <div
              className="rounded-xl border p-4 text-sm font-medium"
              style={{
                backgroundColor: "var(--status-danger-bg)",
                borderColor: "color-mix(in srgb, var(--status-danger) 24%, var(--border-subtle))",
                color: "var(--status-danger)",
              }}
            >
              {mutationErrorMessage(unitsQuery.error ?? metaQuery.error ?? mutationError)}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-none">
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
                        {unit.leader_position ? ` (${unit.leader_position})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:w-96 sm:justify-end">
                    {/* Test Scores button (Visible strictly to class admins of this class unit) */}
                    {isClassAdmin(unit) && (
                      <Button
                        onClick={() => setActiveScoresUnit(unit)}
                        size="sm"
                        variant="secondary"
                      >
                        <Trophy aria-hidden="true" className="mr-1.5 h-4 w-4" />
                        Scores
                      </Button>
                    )}

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
          </div>
        </div>
      )}

      {/* Creation and Edit Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
          <form
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-4xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl animate-in fade-in duration-200"
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
                  rows={3}
                  value={form.description}
                />
              </FormField>

              {/* -------------------- DYNAMIC FLOWS DEPENDING ON TYPE -------------------- */}

              {/* CELL GROUP FLOW: 1 Leader and Position */}
              {form.type === "cell_group" && (
                <>
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

                  <FormField htmlFor="church-unit-leader-position" label="Leader Position">
                    <Input
                      id="church-unit-leader-position"
                      onChange={(event) => setForm((current) => ({ ...current, leader_position: event.target.value }))}
                      placeholder="e.g. Leader, Co-leader, Host"
                      value={form.leader_position}
                    />
                  </FormField>
                </>
              )}

              {/* CLASS FLOW: Class Admins, Class Members, Courses list */}
              {form.type === "class" && (
                <div className="sm:col-span-2 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/30 p-4">
                  <h3 className="text-sm font-bold text-[var(--brand-primary)]">Class Room Configuration</h3>

                  <FormField htmlFor="class-assigned-courses" label="Assign Courses">
                    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                      {courses.map((course) => {
                        const checked = form.assigned_course_ids.includes(course.id);
                        return (
                          <label key={course.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              className="h-4 w-4 accent-[var(--brand-primary)]"
                              onChange={(e) => {
                                setForm((current) => ({
                                  ...current,
                                  assigned_course_ids: e.target.checked
                                    ? [...current.assigned_course_ids, course.id]
                                    : current.assigned_course_ids.filter((id) => id !== course.id),
                                }));
                              }}
                            />
                            <span>{course.title_vi} ({course.title_en})</span>
                          </label>
                        );
                      })}
                      {courses.length === 0 && (
                        <p className="text-xs text-[var(--text-tertiary)] p-2">No courses available.</p>
                      )}
                    </div>
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="class-admins-select" label="Class Admins">
                      <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.class_admin_ids.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                className="h-4 w-4 accent-[var(--brand-primary)]"
                                onChange={(e) => {
                                  setForm((current) => ({
                                    ...current,
                                    class_admin_ids: e.target.checked
                                      ? [...current.class_admin_ids, member.id]
                                      : current.class_admin_ids.filter((id) => id !== member.id),
                                  }));
                                }}
                              />
                              <span>{member.display_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </FormField>

                    <FormField htmlFor="class-members-select" label="Class Members">
                      <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.class_member_ids.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                className="h-4 w-4 accent-[var(--brand-primary)]"
                                onChange={(e) => {
                                  setForm((current) => ({
                                    ...current,
                                    class_member_ids: e.target.checked
                                      ? [...current.class_member_ids, member.id]
                                      : current.class_member_ids.filter((id) => id !== member.id),
                                  }));
                                }}
                              />
                              <span>{member.display_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </FormField>
                  </div>
                </div>
              )}

              {/* CARE TEAM / PRAISE & WORSHIP FLOW: Team Admins, Members (with schedule auto-assign check) */}
              {(form.type === "care_team" || form.type === "praise_worship") && (
                <div className="sm:col-span-2 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/30 p-4">
                  <h3 className="text-sm font-bold text-[var(--brand-primary)]">Team Configuration</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="team-admins-select" label="Team Admins">
                      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.team_admin_ids.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                className="h-4 w-4 accent-[var(--brand-primary)]"
                                onChange={(e) => {
                                  setForm((current) => ({
                                    ...current,
                                    team_admin_ids: e.target.checked
                                      ? [...current.team_admin_ids, member.id]
                                      : current.team_admin_ids.filter((id) => id !== member.id),
                                  }));
                                }}
                              />
                              <span>{member.display_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </FormField>

                    <FormField htmlFor="team-members-select" label="Team Members & Auto-Schedule">
                      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.team_member_ids.includes(member.id);
                          const isAutoAssign = form.auto_assign_schedule_ids.includes(member.id);
                          return (
                            <div key={member.id} className="flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] text-sm">
                              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  className="h-4 w-4 accent-[var(--brand-primary)]"
                                  onChange={(e) => {
                                    setForm((current) => ({
                                      ...current,
                                      team_member_ids: e.target.checked
                                        ? [...current.team_member_ids, member.id]
                                        : current.team_member_ids.filter((id) => id !== member.id),
                                      // Remove auto-assign if unchecked as member
                                      auto_assign_schedule_ids: e.target.checked
                                        ? current.auto_assign_schedule_ids
                                        : current.auto_assign_schedule_ids.filter((id) => id !== member.id),
                                    }));
                                  }}
                                />
                                <span>{member.display_name}</span>
                              </label>

                              {checked && (
                                <label className="flex items-center gap-1.5 text-xs text-[var(--brand-primary)] bg-[var(--brand-muted)] px-2 py-0.5 rounded cursor-pointer transition-all hover:bg-[var(--brand-primary)] hover:text-white">
                                  <input
                                    type="checkbox"
                                    checked={isAutoAssign}
                                    className="h-3 w-3 accent-[var(--brand-primary)]"
                                    onChange={(e) => {
                                      setForm((current) => ({
                                        ...current,
                                        auto_assign_schedule_ids: e.target.checked
                                          ? [...current.auto_assign_schedule_ids, member.id]
                                          : current.auto_assign_schedule_ids.filter((id) => id !== member.id),
                                      }));
                                    }}
                                  />
                                  <span>Auto Schedule</span>
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </FormField>
                  </div>
                </div>
              )}

              {/* EVENT ORGANIZER FLOW: Leader, Service Teams nested setup */}
              {form.type === "event_organizer" && (
                <>
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

                  <div className="sm:col-span-2 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/30 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-[var(--brand-primary)]">Service Teams Configuration</h3>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            service_teams: [
                              ...current.service_teams,
                              { name: "", leader_id: "", member_ids: [] },
                            ],
                          }));
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Service Team
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {form.service_teams.map((team, index) => (
                        <div key={index} className="relative p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-[var(--status-danger)] p-1 rounded hover:bg-[var(--status-danger-bg)]"
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                service_teams: current.service_teams.filter((_, idx) => idx !== index),
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <FormField label="Service Team Name">
                            <Input
                              required
                              value={team.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((current) => {
                                  const list = [...current.service_teams];
                                  list[index] = { ...list[index], name: val };
                                  return { ...current, service_teams: list };
                                });
                              }}
                            />
                          </FormField>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Team Leader">
                              <Select
                                value={team.leader_id}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm((current) => {
                                    const list = [...current.service_teams];
                                    list[index] = { ...list[index], leader_id: val };
                                    return { ...current, service_teams: list };
                                  });
                                }}
                              >
                                <option value="">No leader</option>
                                {(meta?.members ?? []).map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.display_name}
                                  </option>
                                ))}
                              </Select>
                            </FormField>

                            <FormField label="Team Members">
                              <div className="grid max-h-32 gap-1 overflow-y-auto rounded border border-[var(--border-subtle)] p-2">
                                {(meta?.members ?? []).map((m) => {
                                  const checked = team.member_ids.includes(m.id);
                                  return (
                                    <label key={m.id} className="flex items-center gap-2 px-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-xs">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        className="h-3.5 w-3.5 accent-[var(--brand-primary)]"
                                        onChange={(e) => {
                                          setForm((current) => {
                                            const list = [...current.service_teams];
                                            const currentTeam = list[index];
                                            const newIds = e.target.checked
                                              ? [...currentTeam.member_ids, m.id]
                                              : currentTeam.member_ids.filter((id) => id !== m.id);
                                            list[index] = { ...currentTeam, member_ids: newIds };
                                            return { ...current, service_teams: list };
                                          });
                                        }}
                                      />
                                      <span>{m.display_name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </FormField>
                          </div>
                        </div>
                      ))}
                      {form.service_teams.length === 0 && (
                        <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No service teams added yet.</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* STANDARD MEMBERS SELECT FOR GENERIC TYPES */}
              {form.type !== "class" && form.type !== "care_team" && form.type !== "praise_worship" && form.type !== "event_organizer" && (
                <FormField className="sm:col-span-2" htmlFor="church-unit-members" label={t("admin.churchUnits.members")}>
                  <div
                    className="grid max-h-60 gap-2 overflow-y-auto rounded-xl border border-[var(--border-subtle)] p-3 bg-[var(--bg-surface)]"
                    id="church-unit-members"
                  >
                    {(meta?.members ?? []).map((member) => {
                      const checked = form.class_member_ids.includes(member.id);
                      return (
                        <label
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-base)] cursor-pointer"
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
                                class_member_ids: event.target.checked
                                  ? [...current.class_member_ids, member.id]
                                  : current.class_member_ids.filter((id) => id !== member.id),
                              }))
                            }
                            type="checkbox"
                          />
                        </label>
                      );
                    })}
                  </div>
                </FormField>
              )}
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

      {/* Class Member Test Scores Modal */}
      {activeScoresUnit && (
        <ClassScoresModal
          unit={activeScoresUnit}
          onClose={() => setActiveScoresUnit(null)}
        />
      )}
    </>
  );

  if (hideLayout) {
    return content;
  }

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
      {content}
    </PageLayout>
  );
}

type ClassScoresModalProps = {
  unit: ChurchUnit;
  onClose: () => void;
};

function ClassScoresModal({ unit, onClose }: ClassScoresModalProps) {
  const { t } = useTranslation();
  const { data: scores, isLoading, error } = useClassScoresQuery(unit.id);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => unit.courses?.[0]?.id ?? "");

  const activeCourse = useMemo(() => {
    if (!unit.courses || unit.courses.length === 0) return null;
    return unit.courses.find((c) => c.id === selectedCourseId) || unit.courses[0];
  }, [unit.courses, selectedCourseId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
      <div className="flex flex-col max-h-[calc(100vh-3rem)] w-full max-w-5xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("admin.churchUnits.scores.title")}</h2>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{unit.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {unit.courses && unit.courses.length > 0 ? (
          unit.courses.length > 5 ? (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-base)]/50 p-3 rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] shrink-0">
                <BookOpen className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                <span>{t("admin.churchUnits.scores.selectCourse", { count: String(unit.courses.length) })}</span>
              </div>
              <div className="flex-1 max-w-lg">
                <Select
                  value={selectedCourseId || (unit.courses[0]?.id ?? "")}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full text-sm font-semibold"
                >
                  {unit.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title_vi}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {unit.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                    (selectedCourseId || unit.courses[0]?.id) === course.id
                      ? "bg-[var(--brand-primary)] text-white shadow-sm"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]",
                  )}
                >
                  {course.title_vi}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center border border-[var(--border-subtle)] rounded-xl p-8 bg-[var(--bg-base)]/30">
            <BookOpen className="h-10 w-10 text-[var(--text-tertiary)] opacity-30 mb-2" />
            <p className="text-sm font-bold text-[var(--text-secondary)]">{t("admin.churchUnits.scores.noCourses")}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t("admin.churchUnits.scores.noCoursesDesc")}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-[var(--brand-primary)] animate-spin" />
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-2">{t("admin.churchUnits.scores.loading")}</p>
          </div>
        ) : error ? (
          <div className="mt-4 p-4 rounded-xl border border-[var(--status-danger)]/20 bg-[var(--status-danger-bg)] text-sm text-[var(--status-danger)]">
            {mutationErrorMessage(error)}
          </div>
        ) : activeCourse ? (
          <div className="flex-1 mt-6 overflow-y-auto border border-[var(--border-subtle)] rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-base)]/50 border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t("admin.churchUnits.scores.student")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t("common.status")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t("admin.churchUnits.scores.overallGrade")}</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{t("admin.churchUnits.scores.quizAttempts")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
                {(scores ?? []).map((scoreItem: any) => {
                  const courseScore = scoreItem.course_scores.find((cs: any) => cs.course_id === activeCourse.id) || {
                    status: "not_started",
                    score: null,
                    quiz_attempts: [],
                  };

                  return (
                    <tr key={scoreItem.member_id} className="hover:bg-[var(--bg-base)]/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{scoreItem.display_name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">@{scoreItem.username}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                            courseScore.status === "completed" && "bg-[var(--status-success-bg)] text-[var(--status-success)]",
                            courseScore.status === "in_progress" && "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
                            courseScore.status === "enrolled" && "bg-[var(--brand-muted)] text-[var(--brand-primary)]",
                            courseScore.status === "not_started" && "bg-[var(--bg-base)] text-[var(--text-tertiary)]",
                          )}
                        >
                          {courseScore.status === "completed" && <CheckCircle className="h-3 w-3" />}
                          {courseScore.status === "in_progress" && <Clock className="h-3 w-3" />}
                          {courseScore.status === "enrolled" && <Clock className="h-3 w-3" />}
                          {courseScore.status === "not_started" && <AlertCircle className="h-3 w-3" />}
                          {courseScore.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {courseScore.score !== null ? (
                          <span className="text-sm font-extrabold text-[var(--brand-primary)] bg-[var(--brand-muted)] px-2.5 py-1 rounded-lg">
                            {courseScore.score_display ||
                              (courseScore.total_questions > 0
                                ? `${courseScore.score}/${courseScore.total_questions}`
                                : courseScore.score)}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {courseScore.quiz_attempts && courseScore.quiz_attempts.length > 0 ? (
                          courseScore.quiz_attempts.map((qa: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                              <span className="font-semibold text-[var(--text-secondary)] truncate max-w-[200px]">
                                {qa.quiz_title_vi || qa.quiz_title_en}
                              </span>
                              <span
                                className={cn(
                                  "font-bold",
                                  qa.is_completed ? "text-[var(--status-success)]" : "text-[var(--status-warning)]",
                                )}
                              >
                                {qa.score !== null
                                  ? (qa.score_display || (qa.total_questions > 0 ? `${qa.score}/${qa.total_questions}` : qa.score))
                                  : t("admin.churchUnits.scores.started")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)] font-medium">{t("admin.churchUnits.scores.noAttempts")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(scores ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-[var(--text-tertiary)]">
                      {t("admin.churchUnits.scores.noMembers")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
