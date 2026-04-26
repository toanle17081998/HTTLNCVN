"use client";

import { useRef, useState, type FormEvent } from "react";
import { Edit3, Plus, RefreshCw, Search, Shield, Trash2, Upload, UserRound, X } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Pagination, Select, cn } from "@/components/ui";
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
} from "@services/member";

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

const roleOptions = ["church_member", "church_admin", "system_admin"];
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
};

export function MemberPage({ admin = false }: MemberPageProps) {
  const { t } = useTranslation();
  const { confirm } = useFeedback();
  const { can, isAuthenticated, isLoading: authLoading } = useAuth();

  const canReadMembers = can(PERMISSIONS.manageChurchMembers);
  const canCreateMembers = can(PERMISSIONS.createChurchMembers) || canReadMembers;
  const canUpdateMembers = can(PERMISSIONS.updateChurchMembers);
  const canDeleteMembers = can(PERMISSIONS.deleteChurchMembers);

  const [q, setQ] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const membersQuery = useMembersQuery(
    { take: pageSize, skip: page * pageSize, q: q || undefined },
    isAuthenticated && canReadMembers,
  );
  const createMemberMutation = useCreateMemberMutation();
  const updateMemberMutation = useUpdateMemberMutation();
  const deleteMemberMutation = useDeleteMemberMutation();

  const members = membersQuery.data?.items ?? [];
  const total = membersQuery.data?.total ?? 0;
  const activeCount = members.filter((member) => member.status === "active").length;
  const adminCount = members.filter((member) => member.role.includes("admin")).length;
  const pendingCount = members.filter((member) => member.status === "pending").length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(() => createEmptyForm());
  const importInputRef = useRef<HTMLInputElement>(null);

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
            role: form.role,
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

  return (
    <PageLayout
      actions={
        <div className="flex flex-wrap gap-2">
          {admin ? (
            <>
              <input
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
            <Button onClick={openCreateModal}>
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
      {!authLoading && !canReadMembers ? (
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
                {t("admin.members.active")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {activeCount}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("admin.members.adminRoles")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {adminCount}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {t("admin.members.pendingReview")}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {pendingCount}
              </p>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden rounded-2xl border-[var(--border-subtle)] shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {t("admin.members.list")}
                </h2>
                <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                  {membersQuery.isLoading
                    ? t("admin.members.loading")
                    : t("admin.members.records", {
                        count: String(visibleMembers.length),
                        total: String(membersQuery.data?.total ?? 0),
                      })}
                </p>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-80">
                  <Search
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  />
                  <Input
                    className="h-11 rounded-xl pl-11 shadow-sm"
                    onChange={(event) => setQueryInput(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { setQ(queryInput.trim()); setPage(0); }
                    }}
                    placeholder={t("admin.members.search")}
                    value={queryInput}
                  />
                </div>
                <Button
                  className="h-11 shrink-0 rounded-xl"
                  onClick={() => { setQ(queryInput.trim()); setPage(0); }}
                  variant="secondary"
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                  className="group flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-[var(--bg-surface)]/50 sm:flex-row sm:items-center"
                  key={member.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                      <UserRound aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-bold text-[var(--text-primary)]">
                          {displayName(member)}
                        </p>
                        <span className={cn(
                          "inline-flex h-2 w-2 shrink-0 rounded-full",
                          member.status === "active"
                            ? "bg-[var(--status-success)]"
                            : member.status === "pending"
                              ? "bg-[var(--status-warning)]"
                              : "bg-[var(--status-danger)]"
                        )} />
                      </div>
                      <p className="truncate text-sm font-medium text-[var(--text-tertiary)]">
                        @{member.username} • {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:w-72 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-base)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
                      <Shield aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      <span className="capitalize">{roleLabel(member.role)}</span>
                    </div>

                    <div className="flex gap-2">
                      {canUpdateMembers ? (
                        <button
                          aria-label={t("admin.members.editNamed", { name: displayName(member) })}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                          onClick={() => openEditModal(member)}
                          type="button"
                        >
                          <Edit3 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {canDeleteMembers ? (
                        <button
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
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {!membersQuery.isLoading && visibleMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <UserRound className="mb-4 h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
                  <p className="text-base font-medium text-[var(--text-secondary)]">
                    {t("admin.members.empty")}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            {total > 0 ? (
              <Pagination
                className="rounded-none border-x-0 border-b-0"
                page={page}
                pageSize={pageSize}
                total={total}
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
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-3xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitMember}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  {t("admin.members.rbac")}
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {editingMember ? t("admin.members.edit") : t("admin.members.add")}
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
              {!editingMember ? (
                <FormField htmlFor="member-password" label={t("admin.members.initialPassword")}>
                  <Input
                    id="member-password"
                    minLength={8}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
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
                <Select
                  id="member-role"
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  value={form.role}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="member-status" label={t("course.form.status")}>
                <Select
                  id="member-status"
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  value={form.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="member-gender" label={t("admin.members.gender")}>
                <Select
                  id="member-gender"
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  value={form.gender}
                >
                  <option value="">{t("admin.members.genderUnspecified")}</option>
                  <option value="female">{t("admin.members.genderFemale")}</option>
                  <option value="male">{t("admin.members.genderMale")}</option>
                </Select>
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
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
                <Button isLoading={isSaving} type="submit">
                  {editingMember ? t("admin.members.saveChanges") : t("admin.members.create")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
