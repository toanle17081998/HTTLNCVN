"use client";

import { Text, Button, Card, FormField, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Dropdown, cn, Title } from "@/components/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Edit3, ListFilter, Plus, RefreshCw, Search, Shield, Trash2, Upload, UserRound, X } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import {
  useCreateMemberMutation,
  useDeleteMemberMutation,
  useMembersQuery,
  useUpdateMemberMutation,
  type Member,
} from "@/hooks/member";
import { notFound } from "next/navigation";
import { useUrlPagination } from "@/hooks/useUrlPagination";

type MemberForm = {
  address: string;
  date_of_birth: string;
  email: string;
  first_name: string;
  gender: string;
  last_name: string;
  password: string;
  phone: string;
  role: string;
  status: string;
  username: string;
};

const roleOptions = ["church_member", "church_admin", "system_admin"] as const;
const statusOptions = ["active", "pending", "suspended"];

function createEmptyForm(): MemberForm {
  return {
    address: "",
    date_of_birth: "",
    email: "",
    first_name: "",
    gender: "",
    last_name: "",
    password: "",
    phone: "",
    role: "church_member",
    status: "active",
    username: "",
  };
}

function memberToForm(member: Member): MemberForm {
  return {
    address: member.profile?.address ?? "",
    date_of_birth: member.profile?.date_of_birth ?? "",
    email: member.email,
    first_name: member.profile?.first_name ?? "",
    gender: member.profile?.gender ?? "",
    last_name: member.profile?.last_name ?? "",
    password: "",
    phone: member.profile?.phone ?? "",
    role: member.role,
    status: member.status,
    username: member.username,
  };
}

function displayName(member: Member) {
  const fullName = [member.profile?.first_name, member.profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || member.username;
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

type MemberPageProps = {
  admin?: boolean;
  hideLayout?: boolean;
};

export function MemberPage({ admin = false, hideLayout = false }: MemberPageProps) {
  const { t } = useTranslation();
  const { confirm } = useFeedback();
  const { can, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const canReadMembers = can(PERMISSIONS.manageChurchMembers);
  const canCreateMembers = can(PERMISSIONS.createChurchMembers) || canReadMembers;
  const canUpdateMembers = can(PERMISSIONS.updateChurchMembers);
  const canDeleteMembers = can(PERMISSIONS.deleteChurchMembers);
  const isSystemAdmin = user?.role === "system_admin";

  const { isInvalidParams, isPageOutOfRange, page, pageSize, searchParams, setPage, setPageSize, updateParams } =
    useUrlPagination({
      defaultPageSize: 10,
    });
  const q = searchParams.get("q") ?? "";
  const rawRole = searchParams.get("role");
  const isInvalidRole =
    rawRole !== null && !(roleOptions as readonly string[]).includes(rawRole);
  const roleFilter = rawRole ?? "";
  const [queryInput, setQueryInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setQueryInput(q);
  }

  useEffect(() => {
    const nextQuery = queryInput.trim();
    if (nextQuery === q) return;
    const timer = window.setTimeout(() => {
      updateParams({ page: null, q: nextQuery || null });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, queryInput, updateParams]);

  const membersQuery = useMembersQuery(
    { take: pageSize, skip: page * pageSize, q: q || undefined, role: roleFilter || undefined },
    isAuthenticated && canReadMembers,
  );
  const createMemberMutation = useCreateMemberMutation();
  const updateMemberMutation = useUpdateMemberMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const members = membersQuery.data?.items ?? [];
  const total = membersQuery.data?.total ?? 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(() => createEmptyForm());
  const importInputRef = useRef<HTMLInputElement>(null);

  if (isInvalidParams || isInvalidRole || isPageOutOfRange(total, membersQuery.isSuccess)) {
    notFound();
  }

  const visibleMembers = members;

  const mutationError =
    createMemberMutation.error ?? updateMemberMutation.error ?? deleteMemberMutation.error;

  const isSaving = createMemberMutation.isPending || updateMemberMutation.isPending;

  function openCreateModal() {
    setEditingMember(null);
    setForm(createEmptyForm());
    setModalOpen(true);
    createMemberMutation.reset();
    updateMemberMutation.reset();
    deleteMemberMutation.reset();
  }

  function openEditModal(member: Member) {
    setEditingMember(member);
    setForm(memberToForm(member));
    setModalOpen(true);
    createMemberMutation.reset();
    updateMemberMutation.reset();
    deleteMemberMutation.reset();
  }

  function closeModal() {
    setModalOpen(false);
    setEditingMember(null);
    setForm((current) => ({ ...current, password: "" }));
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const profile = {
      address: form.address.trim() || null,
      date_of_birth: form.date_of_birth || null,
      first_name: form.first_name.trim(),
      gender: form.gender || null,
      last_name: form.last_name.trim(),
      phone: form.phone.trim() || null,
    };

    if (editingMember) {
      updateMemberMutation.mutate(
        {
          id: editingMember.id,
          dto: {
            email: form.email.trim(),
            profile,
            ...(form.role !== editingMember.role && { role: form.role }),
            ...(isSystemAdmin && form.password !== "" && { password: form.password }),
            status: form.status,
            username: form.username.trim(),
          },
        },
        { onSuccess: closeModal },
      );
      return;
    }

    createMemberMutation.mutate(
      {
        email: form.email.trim(),
        password: form.password,
        profile,
        role: form.role,
        status: form.status,
        username: form.username.trim(),
      },
      { onSuccess: closeModal },
    );
  }

  function deleteMember() {
    if (!editingMember) return;
    deleteMemberMutation.mutate(editingMember.id, { onSuccess: closeModal });
  }

  function handleImportFile(file: File | undefined) {
    if (!file) return;
    window.alert(t("admin.members.importPending", { name: file.name }));
  }

  const content = (
    <>
      {!authLoading && !canReadMembers ? (
        <Card className="p-5">
          <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">{t("admin.members.restrictedTitle")}</Text>
          <Text className="mt-1" variant="small">
            {t("admin.members.restrictedDescription")}
          </Text>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <Title as="h2" className="self-center sm:hidden" variant="labelStrong">
              {t("church.tab.member")}
            </Title>
            <div className="order-last col-span-2 flex min-w-0 flex-col gap-1 sm:order-none sm:col-span-1">
              <Label htmlFor="member-search" variant="caption">{t("common.search")}</Label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  id="member-search"
                  className="h-9 pl-10 text-sm"
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder={t("admin.members.search")}
                  type="search"
                  value={queryInput}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-end justify-end gap-1.5 sm:gap-2">
              <div className="flex flex-col gap-1 sm:w-44">
                <Label className="sr-only sm:not-sr-only" htmlFor="member-role-filter" variant="caption">
                  {t("admin.members.role")}
                </Label>
                <div className={cn(
                  "relative grid h-9 w-9 place-items-center rounded-lg border border-[var(--border-subtle)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)] sm:block sm:h-auto sm:w-auto sm:border-0 sm:focus-within:ring-0",
                  roleFilter && "bg-[var(--brand-muted)] text-[var(--brand-primary)]",
                )}>
                  <ListFilter aria-hidden="true" className="h-4 w-4 sm:hidden" />
                  <Dropdown
                    id="member-role-filter"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 sm:static sm:h-9 sm:text-sm sm:opacity-100"
                    onChange={(event) => {
                      updateParams({ page: null, role: event.target.value || null });
                    }}
                    value={roleFilter}
                  >
                    <option value="">{t("admin.members.allRoles")}</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{t(`admin.members.role.${role}`)}</option>
                    ))}
                  </Dropdown>
                </div>
              </div>
              <Button aria-label={t("admin.members.refresh")} onClick={() => void membersQuery.refetch()} size="icon" variant="secondary">
                <RefreshCw aria-hidden="true" className={cn("h-4 w-4", membersQuery.isFetching && "animate-spin")} />
              </Button>
              {hideLayout && admin ? (
                <>
                  <Input
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(event) => handleImportFile(event.target.files?.[0])}
                    ref={importInputRef}
                    type="file"
                  />
                  <Button aria-label={t("action.importData")} onClick={() => importInputRef.current?.click()} size="icon" variant="secondary">
                    <Upload aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
              {hideLayout && canCreateMembers ? (
                <Button aria-label={t("action.inviteMember")} className="sm:w-auto sm:px-4" onClick={openCreateModal} size="icon" variant="primary">
                  <Plus aria-hidden="true" className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("action.inviteMember")}</span>
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="overflow-hidden rounded-xl shadow-none">
            {membersQuery.error ? (
              <div
                className="m-6 rounded-xl border p-4 text-sm font-medium"
                style={{
                  backgroundColor: "var(--status-danger-bg)",
                  borderColor: "color-mix(in srgb, var(--status-danger) 24%, var(--border-subtle))",
                  color: "var(--status-danger)",
                }}
              >
                {mutationErrorMessage(membersQuery.error)}
              </div>
            ) : null}

            <div className="grid divide-y divide-[var(--border-subtle)]">
              {visibleMembers.map((member) => (
                <div
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 px-4 py-4 transition-colors hover:bg-[var(--bg-surface)]/50 sm:flex sm:items-center sm:gap-4 sm:px-6 sm:py-5"
                  key={member.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)] sm:h-12 sm:w-12">
                      <UserRound aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Text as="p" tone="inherit" variant="inherit" className="truncate text-base font-bold text-[var(--text-primary)]">
                          {displayName(member)}
                        </Text>
                        <span className={cn(
                          "inline-flex h-2 w-2 shrink-0 rounded-full",
                          member.status === "active"
                            ? "bg-[var(--status-success)]"
                            : member.status === "pending"
                              ? "bg-[var(--status-warning)]"
                              : "bg-[var(--status-danger)]"
                        )} />
                      </div>
                      <Text as="p" tone="inherit" variant="inherit" className="truncate text-sm font-medium text-[var(--text-tertiary)]">
                        @{member.username} • {member.email}
                      </Text>
                    </div>
                  </div>

                  <div className="contents sm:flex sm:w-72 sm:items-center sm:justify-end sm:gap-3">
                    <div className="col-span-2 ml-[3.25rem] flex w-fit items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] sm:ml-0">
                      <Shield aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      <span className="capitalize">{roleLabel(member.role)}</span>
                    </div>

                    <div className="col-start-2 row-start-1 flex gap-1 sm:gap-2">
                      {canUpdateMembers ? (
                        <Button
                          variant="unstyled"
                          aria-label={t("admin.members.editNamed", { name: displayName(member) })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                          onClick={() => openEditModal(member)}
                          type="button"
                        >
                          <Edit3 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {canDeleteMembers ? (
                        <Button
                          variant="unstyled"
                          aria-label={t("admin.members.deleteNamed", { name: displayName(member) })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--status-danger)] transition-all hover:bg-[var(--status-danger-bg)]"
                          onClick={async () => {
                            const ok = await confirm({
                              variant: "delete",
                              title: t("admin.members.deleteConfirm", { name: displayName(member) }),
                            });
                            if (ok) {
                              deleteMemberMutation.mutate(member.id);
                            }
                          }}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {!membersQuery.isLoading && visibleMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <UserRound className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
                  <Text as="p" tone="inherit" variant="inherit" className="text-base font-medium text-[var(--text-secondary)]">
                    {t("admin.members.empty")}
                  </Text>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Pagination */}
          {total > 0 ? (
            <Pagination
              className="mt-4"
              page={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              total={total}
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

      {modalOpen ? (
          <Modal
            className="max-w-3xl"
            labelledBy="member-modal-title"
            onClose={closeModal}
            onSubmit={submitMember}
          >
            <ModalHeader className="flex items-start justify-between gap-4">
              <div>
                <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  {t("admin.members.rbac")}
                </Text>
                <Title as="h2" id="member-modal-title" variant="cardSoft">
                  {editingMember ? t("admin.members.edit") : t("admin.members.add")}
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
              <FormField htmlFor="member-first-name" label={t("admin.members.firstName")}>
                <Input
                  id="member-first-name"
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  value={form.first_name}
                />
              </FormField>
              <FormField htmlFor="member-last-name" label={t("admin.members.lastName")}>
                <Input
                  id="member-last-name"
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  value={form.last_name}
                />
              </FormField>
              <FormField htmlFor="member-username" label={t("admin.members.username")}>
                <Input
                  id="member-username"
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                  value={form.username}
                />
              </FormField>
              <FormField htmlFor="member-email" label={t("admin.members.email")}>
                <Input
                  id="member-email"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  type="email"
                  value={form.email}
                />
              </FormField>
              {!editingMember || isSystemAdmin ? (
                <FormField htmlFor="member-password" label={t(editingMember ? "admin.members.newPasswordOptional" : "admin.members.initialPassword")}>
                  <Input
                    autoComplete="new-password"
                    id="member-password"
                    minLength={8}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required={!editingMember}
                    type="password"
                    value={form.password}
                  />
                </FormField>
              ) : null}
              <FormField htmlFor="member-phone" label={t("admin.members.phone")}>
                <Input
                  id="member-phone"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  value={form.phone}
                />
              </FormField>
              <FormField htmlFor="member-role" label={t("admin.members.role")}>
                <Dropdown
                  id="member-role"
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  value={form.role}
                >
                  {roleOptions.filter((role) => role !== "system_admin" || isSystemAdmin || editingMember?.role === role).map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </Dropdown>
              </FormField>
              <FormField htmlFor="member-status" label={t("course.form.status")}>
                <Dropdown
                  id="member-status"
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  value={form.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Dropdown>
              </FormField>
              <FormField htmlFor="member-gender" label={t("admin.members.gender")}>
                <Dropdown
                  id="member-gender"
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  value={form.gender}
                >
                  <option value="">{t("admin.members.genderUnspecified")}</option>
                  <option value="female">{t("admin.members.genderFemale")}</option>
                  <option value="male">{t("admin.members.genderMale")}</option>
                </Dropdown>
              </FormField>
              <FormField htmlFor="member-date-of-birth" label={t("admin.members.dateOfBirth")}>
                <Input
                  id="member-date-of-birth"
                  onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                  type="date"
                  value={form.date_of_birth}
                />
              </FormField>
              <FormField className="sm:col-span-2" htmlFor="member-address" label={t("admin.members.address")}>
                <Input
                  id="member-address"
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  value={form.address}
                />
              </FormField>
            </ModalBody>

            <ModalFooter className="flex flex-wrap items-center justify-between gap-3">
              {editingMember && canDeleteMembers ? (
                <Button
                  isLoading={deleteMemberMutation.isPending}
                  onClick={deleteMember}
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
                  {editingMember ? t("admin.members.saveChanges") : t("admin.members.create")}
                </Button>
              </div>
            </ModalFooter>
          </Modal>
      ) : null}
    </>
  );

  if (hideLayout) {
    return content;
  }

  return (
    <PageLayout
      actions={
        <div className="flex flex-wrap gap-2">
          {admin ? (
            <>
              <Input
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={(event) => handleImportFile(event.target.files?.[0])}
                ref={importInputRef}
                type="file"
              />
              <Button onClick={() => importInputRef.current?.click()} variant="secondary">
                <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
                {t("action.importData")}
              </Button>
            </>
          ) : null}
          {canCreateMembers ? (
            <Button variant="primary" onClick={openCreateModal}>
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("action.inviteMember")}
            </Button>
          ) : null}
        </div>
      }
      description={admin ? t("admin.members.description") : t("page.member.description")}
      eyebrow={admin ? t("admin.common.admin") : t("page.member.eyebrow")}
      title={t("nav.member.label")}
    >
      {content}
    </PageLayout>
  );
}
