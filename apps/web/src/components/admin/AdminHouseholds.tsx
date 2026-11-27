"use client";

import { Dropdown, Text, Title, Button, Card, Input, Pagination } from "@/components/ui";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";

import {
  useAddHouseholdMemberMutation,
  useCreateHouseholdMutation,
  useDeleteHouseholdMutation,
  useHouseholdsQuery,
  useRemoveHouseholdMemberMutation,
  useUpdateHouseholdMutation,
  type Household,
} from "@/hooks/household";
import { useMembersQuery } from "@/hooks/member";
import { useTranslation } from "@/providers/I18nProvider";

const emptyForm = { address: "", name: "", note: "", phone: "" };

export function AdminHouseholds() {
  const { t } = useTranslation();
  const householdsQuery = useHouseholdsQuery();
  const membersQuery = useMembersQuery({ take: 100 });
  const createMutation = useCreateHouseholdMutation();
  const deleteMutation = useDeleteHouseholdMutation();
  const updateMutation = useUpdateHouseholdMutation();
  const addMemberMutation = useAddHouseholdMemberMutation();
  const removeMemberMutation = useRemoveHouseholdMemberMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const allHouseholds = householdsQuery.data?.items ?? [];
  const safePage = Math.min(page, Math.max(0, Math.ceil(allHouseholds.length / pageSize) - 1));
  const pagedHouseholds = allHouseholds.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function submit(event: FormEvent) {
    event.preventDefault();
    const dto = {
      address: form.address.trim() || null,
      name: form.name.trim(),
      note: form.note.trim() || null,
      phone: form.phone.trim() || null,
    };
    const reset = () => {
      setForm(emptyForm);
      setEditingId(null);
    };
    if (editingId) {
      updateMutation.mutate({ dto, id: editingId }, { onSuccess: reset });
    } else {
      createMutation.mutate(dto, { onSuccess: reset });
    }
  }

  function availableMembers(household: Household) {
    const assigned = new Set(household.members.map((member) => member.id));
    return (membersQuery.data?.items ?? []).filter((member) => !assigned.has(member.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
          {t("admin.households.eyebrow")}
        </Text>
        <Title as="h1" className="mt-1" variant="pagePlain">
          {t("admin.households.title")}
        </Title>
        <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-[var(--text-secondary)]">
          {t("admin.households.description")}
        </Text>
      </div>

      <Card className="p-5 sm:p-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Input aria-label={t("admin.households.name")} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t("admin.households.name")} required value={form.name} />
          <Input aria-label={t("admin.households.phone")} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={t("admin.households.phone")} value={form.phone} />
          <Input aria-label={t("admin.households.address")} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder={t("admin.households.address")} value={form.address} />
          <Input aria-label={t("admin.households.note")} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder={t("admin.households.note")} value={form.note} />
          <div className="md:col-span-2">
            <div className="flex justify-end gap-2 md:justify-start">
              <Button variant="primary" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? t("admin.households.save") : t("admin.households.create")}
              </Button>
              {editingId ? (
                <Button onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {pagedHouseholds.map((household) => {
          const candidates = availableMembers(household);
          const selected = selectedMembers[household.id] ?? "";
          return (
            <Card className="p-5 sm:p-6" key={household.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Title as="h2" variant="card">{household.name}</Title>
                  <Text className="mt-1" variant="small">
                    {household.address || t("admin.households.noAddress")} · {household.phone || t("admin.households.noPhone")}
                  </Text>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    aria-label={t("admin.common.edit")}
                    onClick={() => {
                      setEditingId(household.id);
                      setForm({ address: household.address ?? "", name: household.name, note: household.note ?? "", phone: household.phone ?? "" });
                    }}
                    size="icon"
                    title={t("admin.common.edit")}
                    variant="secondary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label={t("admin.common.delete")}
                    onClick={() => deleteMutation.mutate(household.id)}
                    size="icon"
                    title={t("admin.common.delete")}
                    variant="danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {household.members.map((member) => (
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2" key={member.id}>
                    <div>
                      <Text as="p" tone="inherit" variant="inherit" className="font-medium">{member.name}</Text>
                      <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-secondary)]">{member.role || "member"}</Text>
                    </div>
                    <Button
                      variant="unstyled"
                      aria-label={t("admin.common.delete")}
                      onClick={() => removeMemberMutation.mutate({ householdId: household.id, userId: member.id })}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {!household.members.length ? <Text variant="small">{t("admin.households.noMembers")}</Text> : null}
              </div>

              <div className="mt-4 flex gap-2">
                <Dropdown
                  className="min-w-0 flex-1"
                  onChange={(event) => setSelectedMembers({ ...selectedMembers, [household.id]: event.target.value })}
                  value={selected}
                >
                  <option value="">{t("admin.households.selectMember")}</option>
                  {candidates.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.profile ? `${member.profile.first_name} ${member.profile.last_name}`.trim() : member.username}
                    </option>
                  ))}
                </Dropdown>
                <Button
                  variant="primary"
                  aria-label={t("admin.households.addMember")}
                  disabled={!selected}
                  onClick={() =>
                    addMemberMutation.mutate(
                      { householdId: household.id, userId: selected },
                      { onSuccess: () => setSelectedMembers({ ...selectedMembers, [household.id]: "" }) },
                    )
                  }
                  size="icon"
                  title={t("admin.households.addMember")}
                  type="button"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {allHouseholds.length > 0 ? (
        <Pagination
          onPageChange={(nextPage) => {
            setPage(nextPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          page={safePage}
          pageSize={pageSize}
          total={allHouseholds.length}
        />
      ) : null}

      {householdsQuery.isLoading ? <Text as="p" tone="inherit" variant="inherit">{t("admin.households.loading")}</Text> : null}
      {householdsQuery.isError ? <Text as="p" tone="inherit" variant="inherit" className="text-[var(--status-danger)]">{t("admin.households.error")}</Text> : null}
    </div>
  );
}
