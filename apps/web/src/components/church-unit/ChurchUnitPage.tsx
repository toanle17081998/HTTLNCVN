"use client";

import { Text, Title, Button, Card, FormField, Input, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Dropdown, Textarea, cn, Label } from "@/components/ui";
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
} from "@/hooks/church-unit";
import { notFound } from "next/navigation";
import { useCoursesQuery } from "@/hooks/course";
import { useUrlPagination } from "@/hooks/useUrlPagination";

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
  const { t, localize } = useTranslation();
  const { can, isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { confirm, toast } = useFeedback();

  const canReadUnits = can(PERMISSIONS.manageChurchUnits);
  const canCreateUnits = can(PERMISSIONS.createChurchUnits) || canReadUnits;
  const canUpdateUnits = can(PERMISSIONS.updateChurchUnits);
  const canDeleteUnits = can(PERMISSIONS.deleteChurchUnits);

  const { isInvalidParams, isPageOutOfRange, page, pageSize, searchParams, setPage, setPageSize, updateParams } =
    useUrlPagination({
      defaultPageSize: 20,
    });

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

  const query = searchParams.get("q") ?? "";
  const rawType = searchParams.get("type");
  const rawStatus = searchParams.get("status");
  const typeFilter = rawType ?? "all";
  const statusFilter = rawStatus ?? "all";
  const setQuery = (next: string) => updateParams({ page: null, q: next || null });
  const setTypeFilter = (next: string) => updateParams({ page: null, type: next === "all" ? null : next });
  const setStatusFilter = (next: string) => updateParams({ page: null, status: next === "all" ? null : next });

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

  const accessibleUnits = canReadUnits ? units : units.filter(isClassAdmin);
  const hasPageAccess = canReadUnits || accessibleUnits.length > 0;
  const isLoadingUnits = authLoading || unitsQuery.isLoading;
  const filterTypes = (canReadUnits ? meta?.types : undefined) ?? [...new Set(accessibleUnits.map((unit) => unit.type))];
  const isInvalidStatus = rawStatus !== null && !["active", "inactive"].includes(rawStatus);
  const isInvalidType =
    rawType !== null &&
    (rawType.trim() === "" || ((metaQuery.isSuccess || unitsQuery.isSuccess) && !filterTypes.includes(rawType)));
  if (
    isInvalidParams ||
    isInvalidStatus ||
    isInvalidType ||
    isPageOutOfRange(unitsQuery.data?.total ?? 0, unitsQuery.isSuccess)
  ) {
    notFound();
  }
  const normalizedQuery = query.trim().toLowerCase();
  const visibleUnits = accessibleUnits.filter((unit) => {
    if (typeFilter !== "all" && unit.type !== typeFilter) {
      return false;
    }

    if (statusFilter !== "all" && unit.is_active !== (statusFilter === "active")) {
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
      {!isLoadingUnits && !hasPageAccess ? (
        <Card className="p-5">
          <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">{t("admin.members.restrictedTitle")}</Text>
          <Text className="mt-1" variant="small">
            {t("admin.members.restrictedDescription")}
          </Text>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:flex sm:items-end">
            <Title as="h2" className="self-center sm:hidden" variant="labelStrong">
              {t("church.tab.unit")}
            </Title>
            <div className="order-2 col-span-2 flex min-w-0 flex-1 flex-col gap-1 sm:order-none">
              <Label variant="caption"  htmlFor="church-unit-search">
                {t("common.search")}
              </Label>
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

            <div className="order-3 col-span-2 grid min-w-0 grid-cols-2 items-end gap-2 sm:order-none sm:flex sm:shrink-0">
              <div className="flex min-w-0 flex-col gap-1 sm:w-40">
                <Label variant="caption"  htmlFor="church-unit-type-filter">
                  {t("common.type")}
                </Label>
                <Dropdown
                  id="church-unit-type-filter"
                  aria-label={t("admin.churchUnits.type")}
                  className="h-9 text-sm"
                  onChange={(event) => setTypeFilter(event.target.value)}
                  value={typeFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  {filterTypes.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </Dropdown>
              </div>

              <div className="flex min-w-0 flex-col gap-1 sm:w-36">
                <Label variant="caption"  htmlFor="church-unit-status-filter">
                  {t("common.status")}
                </Label>
                <Dropdown
                  id="church-unit-status-filter"
                  aria-label={t("course.form.status")}
                  className="h-9 text-sm"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  <option value="active">{t("admin.churchUnits.status.active")}</option>
                  <option value="inactive">{t("admin.churchUnits.status.inactive")}</option>
                </Dropdown>
              </div>

            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="unstyled"
                aria-label={t("admin.members.refresh")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--brand-muted)] transition duration-200"
                onClick={() => {
                  void unitsQuery.refetch();
                  if (canReadUnits) void metaQuery.refetch();
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
              </Button>
              {hideLayout && canCreateUnits ? (
                <Button aria-label={t("admin.churchUnits.add")} className="sm:w-auto sm:px-4" variant="primary" onClick={openCreateModal} size="icon">
                  <Plus aria-hidden="true" className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("admin.churchUnits.add")}</span>
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
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 px-4 py-4 transition-colors hover:bg-[var(--bg-surface)]/50 sm:flex sm:items-center sm:gap-4 sm:px-6 sm:py-5"
                  key={unit.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)] sm:h-12 sm:w-12">
                      <Building2 aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Text as="p" tone="inherit" variant="inherit" className="truncate text-base font-bold text-[var(--text-primary)]">
                          {unit.name}
                        </Text>
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
                      <Text as="p" tone="inherit" variant="inherit" className="truncate text-sm font-medium capitalize text-[var(--text-tertiary)]">
                        {typeLabel(unit.type)}
                        {unit.parent ? ` · ${unit.parent.name}` : ""}
                        {unit.leader ? ` · ${unit.leader.display_name}` : ""}
                        {unit.leader_position ? ` (${unit.leader_position})` : ""}
                      </Text>
                    </div>
                  </div>

                  <div className="contents sm:flex sm:items-center sm:justify-end sm:gap-3">
                    <div className="col-span-2 ml-[3.25rem] flex flex-wrap items-center gap-2 sm:ml-0 sm:gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                        <Users aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        <span>{unit.member_count}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                        <FolderTree aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        <span>{unit.children_count}</span>
                      </div>
                    </div>
                    <div className="col-start-2 row-start-1 flex gap-1 sm:gap-2">
                      {isClassAdmin(unit) && (
                        <Button
                          aria-label={t("admin.churchUnits.scores.title")}
                          className="sm:w-auto sm:px-4"
                          onClick={() => setActiveScoresUnit(unit)}
                          size="icon"
                          variant="secondary"
                        >
                          <Trophy aria-hidden="true" className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Scores</span>
                        </Button>
                      )}
                      {canUpdateUnits ? (
                        <Button
                          variant="unstyled"
                          aria-label={t("admin.churchUnits.editNamed", { name: unit.name })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                          onClick={() => openEditModal(unit)}
                          type="button"
                        >
                          <Edit3 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canDeleteUnits ? (
                        <Button
                          variant="unstyled"
                          aria-label={t("admin.churchUnits.deleteNamed", { name: unit.name })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--status-danger)] transition-all hover:bg-[var(--status-danger-bg)]"
                          onClick={() => void handleDelete(unit)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {isLoadingUnits && visibleUnits.length === 0 ? (
                <Text as="p" role="status" className="p-5 text-center" variant="small">
                  {t("admin.churchUnits.loading")}
                </Text>
              ) : !isLoadingUnits && visibleUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Building2 className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
                  <Text as="p" tone="inherit" variant="inherit" className="text-base font-medium text-[var(--text-secondary)]">
                    {t("admin.churchUnits.empty")}
                  </Text>
                </div>
              ) : null}
            </div>
          </div>

          {/* Pagination */}
          {(unitsQuery.data?.total ?? 0) > 0 ? (
            <Pagination
              className="mt-4"
              page={page}
              pageSize={pageSize}
              total={unitsQuery.data?.total ?? 0}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onPageSizeChange={(s) => {
                setPageSize(s);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : null}
        </div>
      )}

      {/* Creation and Edit Modal */}
      {modalOpen ? (
          <Modal
            className="max-w-4xl animate-in fade-in duration-200"
            labelledBy="church-unit-modal-title"
            onClose={closeModal}
            onSubmit={submitChurchUnit}
          >
            <ModalHeader className="flex items-start justify-between gap-4">
              <div>
                <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  {t("admin.churchUnits.eyebrow")}
                </Text>
                <Title as="h2" id="church-unit-modal-title" variant="cardSoft">
                  {editingUnit ? t("admin.churchUnits.edit") : t("admin.churchUnits.add")}
                </Title>
              </div>
              <Button
                variant="unstyled"
                aria-label={t("action.close")}
                className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                onClick={closeModal}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </ModalHeader>

            <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
              {mutationError ? (
                <div className="rounded-md border border-[var(--status-danger)]/30 bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--status-danger)] sm:col-span-2">
                  {mutationErrorMessage(mutationError)}
                </div>
              ) : null}
              <FormField htmlFor="church-unit-name" label={t("admin.churchUnits.name")}>
                <Input
                  id="church-unit-name"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  value={form.name}
                />
              </FormField>

              <FormField htmlFor="church-unit-type" label={t("admin.churchUnits.type")}>
                <Dropdown
                  id="church-unit-type"
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  value={form.type}
                >
                  {(meta?.types ?? []).map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </Dropdown>
              </FormField>

              <FormField htmlFor="church-unit-parent" label={t("admin.churchUnits.parent")}>
                <Dropdown
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
                </Dropdown>
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
                <Dropdown
                  id="church-unit-status"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.value === "active" }))
                  }
                  value={form.is_active ? "active" : "inactive"}
                >
                  <option value="active">{t("admin.churchUnits.status.active")}</option>
                  <option value="inactive">{t("admin.churchUnits.status.inactive")}</option>
                </Dropdown>
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
                    <Dropdown
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
                    </Dropdown>
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
                <div className="space-y-4 sm:col-span-2">
                  <Title as="h3" tone="brand" variant="micro">{t("admin.churchUnits.classConfiguration")}</Title>

                  <FormField htmlFor="class-assigned-courses" label={t("admin.churchUnits.assignCourses")}>
                    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                      {courses.map((course) => {
                        const checked = form.assigned_course_ids.includes(course.id);
                        return (
                          <Label variant="inherit" key={course.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                            <Input
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
                            <span>{localize(course, "title")}</span>
                          </Label>
                        );
                      })}
                      {courses.length === 0 && (
                        <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-tertiary)] p-2">{t("admin.churchUnits.noCourses")}</Text>
                      )}
                    </div>
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="class-admins-select" label={t("admin.churchUnits.classAdmins")}>
                      <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.class_admin_ids.includes(member.id);
                          return (
                            <Label variant="inherit" key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <Input
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
                            </Label>
                          );
                        })}
                      </div>
                    </FormField>

                    <FormField htmlFor="class-members-select" label={t("admin.churchUnits.classMembers")}>
                      <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.class_member_ids.includes(member.id);
                          return (
                            <Label variant="inherit" key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <Input
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
                            </Label>
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
                  <Title as="h3" tone="brand" variant="micro">Team Configuration</Title>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="team-admins-select" label="Team Admins">
                      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2">
                        {(meta?.members ?? []).map((member) => {
                          const checked = form.team_admin_ids.includes(member.id);
                          return (
                            <Label variant="inherit" key={member.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-sm">
                              <Input
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
                            </Label>
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
                              <Label variant="inherit" className="flex items-center gap-3 flex-1 cursor-pointer">
                                <Input
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
                              </Label>

                              {checked && (
                                <Label variant="inherit" className="flex items-center gap-1.5 text-xs text-[var(--brand-primary)] bg-[var(--brand-muted)] px-2 py-0.5 rounded cursor-pointer transition-all hover:bg-[var(--brand-primary)] hover:text-white">
                                  <Input
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
                                </Label>
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
                    <Dropdown
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
                    </Dropdown>
                  </FormField>

                  <div className="sm:col-span-2 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/30 p-4">
                    <div className="flex justify-between items-center">
                      <Title as="h3" tone="brand" variant="micro">Service Teams Configuration</Title>
                      <Button
                        variant="primary"
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
                          <Button
                            variant="unstyled"
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
                          </Button>

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
                              <Dropdown
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
                              </Dropdown>
                            </FormField>

                            <FormField label="Team Members">
                              <div className="grid max-h-32 gap-1 overflow-y-auto rounded border border-[var(--border-subtle)] p-2">
                                {(meta?.members ?? []).map((m) => {
                                  const checked = team.member_ids.includes(m.id);
                                  return (
                                    <Label variant="inherit" key={m.id} className="flex items-center gap-2 px-1 rounded hover:bg-[var(--bg-base)] cursor-pointer text-xs">
                                      <Input
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
                                    </Label>
                                  );
                                })}
                              </div>
                            </FormField>
                          </div>
                        </div>
                      ))}
                      {form.service_teams.length === 0 && (
                        <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-tertiary)] text-center py-4">No service teams added yet.</Text>
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
                        <Label variant="inherit"
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
                          <Input
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
                        </Label>
                      );
                    })}
                  </div>
                </FormField>
              )}
            </ModalBody>

            <ModalFooter className="flex flex-wrap items-center justify-between gap-3">
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
                <Button variant="primary" isLoading={isSaving} type="submit">
                  {editingUnit ? t("admin.churchUnits.saveChanges") : t("admin.churchUnits.create")}
                </Button>
              </div>
            </ModalFooter>
          </Modal>
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
          <Button variant="primary" onClick={openCreateModal}>
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
  const { t, localize } = useTranslation();
  const { data: scores, isLoading, error } = useClassScoresQuery(unit.id);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => unit.courses?.[0]?.id ?? "");

  const activeCourse = useMemo(() => {
    if (!unit.courses || unit.courses.length === 0) return null;
    return unit.courses.find((c) => c.id === selectedCourseId) || unit.courses[0];
  }, [unit.courses, selectedCourseId]);

  const orderedScores = useMemo(() => {
    if (!activeCourse) return scores ?? [];
    const latestActivity = (scoreItem: any) => {
      const courseScore = scoreItem.course_scores.find((item: any) => item.course_id === activeCourse.id);
      if (!courseScore) return 0;
      const dates = [
        courseScore.completed_at,
        ...(courseScore.quiz_attempts ?? []).map((attempt: any) => attempt.completed_at ?? attempt.started_at),
      ].filter(Boolean);
      return dates.reduce((latest: number, date: string) => Math.max(latest, new Date(date).getTime()), 0);
    };

    return [...(scores ?? [])].sort((a: any, b: any) => latestActivity(b) - latestActivity(a));
  }, [activeCourse, scores]);

  return (
      <Modal className="max-w-5xl animate-in fade-in zoom-in duration-200" labelledBy="class-scores-modal-title" onClose={onClose}>
        <ModalHeader className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <Title as="h2" id="class-scores-modal-title" variant="card">{t("admin.churchUnits.scores.title")}</Title>
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-medium text-[var(--text-secondary)]">{unit.name}</Text>
            </div>
          </div>
          <Button
            variant="unstyled"
            aria-label={t("action.close")}
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] transition-all"
            type="button"
          >
            <X className="h-5 w-5" />
          </Button>
        </ModalHeader>

        <ModalBody>
        {unit.courses && unit.courses.length > 0 ? (
          unit.courses.length > 5 ? (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-base)]/50 p-3 rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] shrink-0">
                <BookOpen className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                <span>{t("admin.churchUnits.scores.selectCourse", { count: String(unit.courses.length) })}</span>
              </div>
              <div className="flex-1 max-w-lg">
                <Dropdown
                  value={selectedCourseId || (unit.courses[0]?.id ?? "")}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full text-sm font-semibold"
                >
                  {unit.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {localize(course, "title")}
                    </option>
                  ))}
                </Dropdown>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {unit.courses.map((course) => (
                <Button
                  variant="unstyled"
                  type="submit"
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                    (selectedCourseId || unit.courses[0]?.id) === course.id
                      ? "bg-[var(--brand-primary)] text-white shadow-sm"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]",
                  )}
                >
                  {localize(course, "title")}
                </Button>
              ))}
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center border border-[var(--border-subtle)] rounded-xl p-8 bg-[var(--bg-base)]/30">
            <BookOpen className="h-10 w-10 text-[var(--text-tertiary)] opacity-30 mb-2" />
            <Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold text-[var(--text-secondary)]">{t("admin.churchUnits.scores.noCourses")}</Text>
            <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-tertiary)] mt-1">{t("admin.churchUnits.scores.noCoursesDesc")}</Text>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-[var(--brand-primary)] animate-spin" />
            <Text as="p" tone="inherit" variant="inherit" className="text-sm font-medium text-[var(--text-secondary)] mt-2">{t("admin.churchUnits.scores.loading")}</Text>
          </div>
        ) : error ? (
          <div className="mt-4 p-4 rounded-xl border border-[var(--status-danger)]/20 bg-[var(--status-danger-bg)] text-sm text-[var(--status-danger)]">
            {mutationErrorMessage(error)}
          </div>
        ) : activeCourse ? (
          <div className="mt-6 overflow-x-auto border border-[var(--border-subtle)] rounded-xl shadow-sm">
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
                {orderedScores.map((scoreItem: any) => {
                  const courseScore = scoreItem.course_scores.find((cs: any) => cs.course_id === activeCourse.id) || {
                    status: "not_started",
                    score: null,
                    quiz_attempts: [],
                  };

                  return (
                    <tr key={scoreItem.member_id} className="hover:bg-[var(--bg-base)]/20 transition-colors">
                      <td className="px-6 py-4">
                        <Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold text-[var(--text-primary)]">{scoreItem.display_name}</Text>
                        <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-tertiary)]">@{scoreItem.username}</Text>
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
                                {localize(qa, "quiz_title")}
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
                {orderedScores.length === 0 && (
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

        </ModalBody>

        <ModalFooter className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            {t("common.close")}
          </Button>
        </ModalFooter>
      </Modal>
  );
}
