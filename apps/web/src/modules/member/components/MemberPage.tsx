"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Edit3, Mail, Plus, RefreshCw, Search, Shield, Trash2, UserRound, X } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
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

function statusClass(status: string) {
  if (status === "active") {
    return "bg-[var(--brand-muted)] text-[var(--brand-primary)]";
  }

  if (status === "pending") {
    return "bg-[color-mix(in_srgb,var(--status-warning)_18%,transparent)] text-[var(--status-warning)]";
  }

  return "bg-[color-mix(in_srgb,var(--status-danger)_14%,transparent)] text-[var(--status-danger)]";
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

export function MemberPage() {
  const { can, isAuthenticated, isLoading: authLoading } = useAuth();
  const canReadMembers = can(PERMISSIONS.manageChurchMembers);
  const canCreateMembers = can(PERMISSIONS.createChurchMembers) || canReadMembers;
  const canUpdateMembers = can(PERMISSIONS.updateChurchMembers);
  const canDeleteMembers = can(PERMISSIONS.deleteChurchMembers);
  const membersQuery = useMembersQuery({ take: 100 }, isAuthenticated && canReadMembers);
  const createMemberMutation = useCreateMemberMutation();
  const updateMemberMutation = useUpdateMemberMutation();
  const deleteMemberMutation = useDeleteMemberMutation();
  const members = membersQuery.data?.items ?? [];
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(() => createEmptyForm());

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) =>
      [
        displayName(member),
        member.email,
        member.username,
        member.role,
        member.status,
        member.profile?.phone ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [members, query]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const adminCount = members.filter((member) => member.role.includes("admin")).length;
  const pendingCount = members.filter((member) => member.status === "pending").length;
  const isSaving = createMemberMutation.isPending || updateMemberMutation.isPending;
  const mutationError =
    createMemberMutation.error ?? updateMemberMutation.error ?? deleteMemberMutation.error;

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
    if (!editingMember) {
      return;
    }

    deleteMemberMutation.mutate(editingMember.id, { onSuccess: closeModal });
  }

  return (
    <PageLayout
      actions={
        canCreateMembers ? (
          <Button onClick={openCreateModal}>
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add member
          </Button>
        ) : null
      }
      description="View and manage the church member directory from the live API."
      eyebrow="Directory"
      title="Members"
    >
      {!authLoading && !canReadMembers ? (
        <Card className="p-5">
          <p className="font-semibold text-[var(--text-primary)]">Access restricted</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your current role does not have permission to read member records.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                Active members
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {activeCount}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                Admin roles
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {adminCount}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                Pending review
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {pendingCount}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Member list
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {membersQuery.isLoading
                    ? "Loading members..."
                    : `${visibleMembers.length} of ${membersQuery.data?.total ?? 0} records`}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-72">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  />
                  <Input
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search members"
                    value={query}
                  />
                </div>
                <Button
                  aria-label="Refresh members"
                  onClick={() => membersQuery.refetch()}
                  variant="secondary"
                >
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {membersQuery.error ? (
              <div className="p-5 text-sm text-[var(--status-danger)]">
                {mutationErrorMessage(membersQuery.error)}
              </div>
            ) : null}

            <div className="grid divide-y divide-[var(--border-subtle)]">
              {visibleMembers.map((member) => (
                <div
                  className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_11rem_9rem_auto]"
                  key={member.id}
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                      <UserRound aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">
                        {displayName(member)}
                      </p>
                      <p className="truncate text-sm text-[var(--text-secondary)]">
                        @{member.username}
                      </p>
                      <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield
                      aria-hidden="true"
                      className="h-4 w-4 text-[var(--brand-primary)]"
                    />
                    <span className="text-sm font-semibold capitalize text-[var(--text-primary)]">
                      {roleLabel(member.role)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold uppercase",
                        statusClass(member.status),
                      )}
                    >
                      {member.status}
                    </span>
                  </div>

                  {canUpdateMembers ? (
                    <button
                      aria-label={`Edit ${displayName(member)}`}
                      className="justify-self-start rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] lg:justify-self-end"
                      onClick={() => openEditModal(member)}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}

              {!membersQuery.isLoading && visibleMembers.length === 0 ? (
                <div className="p-5 text-sm text-[var(--text-secondary)]">
                  No members match the current filters.
                </div>
              ) : null}
            </div>
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
                  RBAC protected
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {editingMember ? "Edit member" : "Add member"}
                </h2>
              </div>
              <button
                aria-label="Close"
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
              <FormField htmlFor="member-first-name" label="First name">
                <Input
                  id="member-first-name"
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  value={form.first_name}
                />
              </FormField>
              <FormField htmlFor="member-last-name" label="Last name">
                <Input
                  id="member-last-name"
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  value={form.last_name}
                />
              </FormField>
              <FormField htmlFor="member-username" label="Username">
                <Input
                  id="member-username"
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                  value={form.username}
                />
              </FormField>
              <FormField htmlFor="member-email" label="Email">
                <Input
                  id="member-email"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  type="email"
                  value={form.email}
                />
              </FormField>
              {!editingMember ? (
                <FormField htmlFor="member-password" label="Initial password">
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
              <FormField htmlFor="member-phone" label="Phone">
                <Input
                  id="member-phone"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  value={form.phone}
                />
              </FormField>
              <FormField htmlFor="member-role" label="Role">
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
              <FormField htmlFor="member-status" label="Status">
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
              <FormField htmlFor="member-gender" label="Gender">
                <Select
                  id="member-gender"
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  value={form.gender}
                >
                  <option value="">Unspecified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </Select>
              </FormField>
              <FormField htmlFor="member-date-of-birth" label="Date of birth">
                <Input
                  id="member-date-of-birth"
                  onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                  type="date"
                  value={form.date_of_birth}
                />
              </FormField>
              <FormField className="sm:col-span-2" htmlFor="member-address" label="Address">
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
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button onClick={closeModal} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={isSaving} type="submit">
                  {editingMember ? "Save changes" : "Create member"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
