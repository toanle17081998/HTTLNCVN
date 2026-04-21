"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Edit3, Mail, Plus, Search, Shield, Trash2, UserRound, X } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select, Textarea, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import {
  memberMockData,
  type ChurchMember,
  type MemberRole,
  type MemberStatus,
} from "@/mockData";
import { useAuth } from "@/providers/AuthProvider";

type MemberForm = {
  email: string;
  full_name: string;
  display_name: string;
  role: MemberRole;
  status: MemberStatus;
  bio: string;
};

const roleOptions: MemberRole[] = ["member", "editor", "instructor", "admin"];
const statusOptions: MemberStatus[] = ["pending", "active", "suspended"];

function createEmptyForm(): MemberForm {
  return {
    email: "",
    full_name: "",
    display_name: "",
    role: "member",
    status: "active",
    bio: "",
  };
}

function memberToForm(member: ChurchMember): MemberForm {
  return {
    email: member.email,
    full_name: member.full_name,
    display_name: member.display_name ?? "",
    role: member.role,
    status: member.status,
    bio: member.bio ?? "",
  };
}

function roleLabel(role: MemberRole) {
  return role[0].toUpperCase() + role.slice(1);
}

function statusClass(status: MemberStatus) {
  if (status === "active") {
    return "bg-[var(--brand-muted)] text-[var(--brand-primary)]";
  }

  if (status === "pending") {
    return "bg-[color-mix(in_srgb,var(--status-warning)_18%,transparent)] text-[var(--status-warning)]";
  }

  return "bg-[color-mix(in_srgb,var(--status-danger)_14%,transparent)] text-[var(--status-danger)]";
}

function nowIso() {
  return new Date().toISOString();
}

export function MemberPage() {
  const { can } = useAuth();
  const canManageMembers = can(PERMISSIONS.manageChurchMembers);
  const [members, setMembers] = useState<ChurchMember[]>(memberMockData);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(() => createEmptyForm());

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members
      .filter((member) => !member.deleted_at)
      .filter((member) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          member.full_name,
          member.display_name ?? "",
          member.email,
          member.role,
          member.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      });
  }, [members, query]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const adminCount = members.filter((member) => member.role === "admin").length;
  const pendingCount = members.filter((member) => member.status === "pending").length;

  function openCreateModal() {
    setEditingMemberId(null);
    setForm(createEmptyForm());
    setModalOpen(true);
  }

  function openEditModal(member: ChurchMember) {
    setEditingMemberId(member.id);
    setForm(memberToForm(member));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingMemberId(null);
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentMember = members.find((member) => member.id === editingMemberId);
    const nextMember: ChurchMember = {
      id: editingMemberId ?? crypto.randomUUID(),
      email: form.email,
      full_name: form.full_name,
      display_name: form.display_name.trim() || null,
      role: form.role,
      status: form.status,
      avatar_url: currentMember?.avatar_url ?? null,
      bio: form.bio.trim() || null,
      email_verified_at:
        currentMember?.email_verified_at ??
        (form.status === "active" ? nowIso() : null),
      last_login_at: currentMember?.last_login_at ?? null,
      created_at: currentMember?.created_at ?? nowIso(),
      updated_at: nowIso(),
      deleted_at: null,
    };

    setMembers((currentMembers) => {
      if (!editingMemberId) {
        return [nextMember, ...currentMembers];
      }

      return currentMembers.map((member) =>
        member.id === editingMemberId ? nextMember : member,
      );
    });
    closeModal();
  }

  function deleteMember() {
    if (!editingMemberId) {
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === editingMemberId
          ? { ...member, deleted_at: nowIso(), updated_at: nowIso() }
          : member,
      ),
    );
    closeModal();
  }

  return (
    <PageLayout
      actions={
        canManageMembers ? (
          <Button onClick={openCreateModal}>
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add member
          </Button>
        ) : null
      }
      description="View the church member directory. Church admins can add, edit, suspend, and remove local member records."
      eyebrow="Directory"
      title="Members"
    >
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
            Church admins
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
              Based on the current users database table shape.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
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
        </div>

        <div className="grid divide-y divide-[var(--border-subtle)]">
          {visibleMembers.map((member) => (
            <div
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_10rem_9rem_auto]"
              key={member.id}
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                  <UserRound aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">
                    {member.display_name ?? member.full_name}
                  </p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">
                    {member.full_name}
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
                <span className="text-sm font-semibold text-[var(--text-primary)]">
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

              {canManageMembers ? (
                <button
                  aria-label={`Edit ${member.full_name}`}
                  className="justify-self-start rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] lg:justify-self-end"
                  onClick={() => openEditModal(member)}
                  type="button"
                >
                  <Edit3 aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
          <form
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitMember}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  User config
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {editingMemberId ? "Edit member" : "Add member"}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="member-full-name" label="Full name">
                <Input
                  id="member-full-name"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  required
                  value={form.full_name}
                />
              </FormField>
              <FormField htmlFor="member-display-name" label="Display name">
                <Input
                  id="member-display-name"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      display_name: event.target.value,
                    }))
                  }
                  value={form.display_name}
                />
              </FormField>
              <FormField htmlFor="member-email" label="Email">
                <Input
                  id="member-email"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                  type="email"
                  value={form.email}
                />
              </FormField>
              <FormField htmlFor="member-role" label="Role">
                <Select
                  id="member-role"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as MemberRole,
                    }))
                  }
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as MemberStatus,
                    }))
                  }
                  value={form.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField className="sm:col-span-2" htmlFor="member-bio" label="Bio">
                <Textarea
                  id="member-bio"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  rows={3}
                  value={form.bio}
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {editingMemberId ? (
                <Button onClick={deleteMember} type="button" variant="danger">
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
                <Button type="submit">
                  {editingMemberId ? "Save changes" : "Create member"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
