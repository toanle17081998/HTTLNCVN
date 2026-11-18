"use client";

import { Text, Title, Button, Card, Input } from "@/components/ui";
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

const emptyForm = { address: "", name: "", note: "", phone: "" };

export function AdminHouseholds() {
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

  function submit(event: FormEvent) {
    event.preventDefault();
    const dto = {
        address: form.address.trim() || null,
        name: form.name.trim(),
        note: form.note.trim() || null,
        phone: form.phone.trim() || null,
      };
    const reset = () => { setForm(emptyForm); setEditingId(null); };
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
        <Text as="p" tone="inherit" variant="inherit" className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">Member administration</Text>
        <Title as="h1" className="mt-1" variant="pagePlain">Households</Title>
        <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-[var(--text-secondary)]">Manage families and connect member records to a household.</Text>
      </div>

      <Card className="p-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Input aria-label="Household name" onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Household name" required value={form.name} />
          <Input aria-label="Phone" onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" value={form.phone} />
          <Input aria-label="Address" onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Address" value={form.address} />
          <Input aria-label="Note" onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Note" value={form.note} />
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <Button disabled={createMutation.isPending || updateMutation.isPending} type="submit"><Plus className="mr-2 h-4 w-4" />{editingId ? "Save household" : "Create household"}</Button>
              {editingId ? <Button onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button" variant="secondary">Cancel</Button> : null}
            </div>
          </div>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {(householdsQuery.data?.items ?? []).map((household) => {
          const candidates = availableMembers(household);
          const selected = selectedMembers[household.id] ?? "";
          return (
            <Card className="p-6" key={household.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Title as="h2" variant="card">{household.name}</Title>
                  <Text className="mt-1" variant="small">{household.address || "No address"} · {household.phone || "No phone"}</Text>
                </div>
                <div className="flex gap-2">
                  <Button aria-label={`Edit ${household.name}`} onClick={() => { setEditingId(household.id); setForm({ address: household.address ?? "", name: household.name, note: household.note ?? "", phone: household.phone ?? "" }); }} size="sm" variant="secondary"><Pencil className="h-4 w-4" /></Button>
                  <Button aria-label={`Delete ${household.name}`} onClick={() => deleteMutation.mutate(household.id)} size="sm" variant="secondary"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {household.members.map((member) => (
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2" key={member.id}>
                    <div><Text as="p" tone="inherit" variant="inherit" className="font-medium">{member.name}</Text><Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-secondary)]">{member.role || "member"}</Text></div>
                    <button aria-label={`Remove ${member.name}`} onClick={() => removeMemberMutation.mutate({ householdId: household.id, userId: member.id })} type="button"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                {!household.members.length ? <Text variant="small">No members assigned.</Text> : null}
              </div>

              <div className="mt-4 flex gap-2">
                <select className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3" onChange={(event) => setSelectedMembers({ ...selectedMembers, [household.id]: event.target.value })} value={selected}>
                  <option value="">Select member</option>
                  {candidates.map((member) => <option key={member.id} value={member.id}>{member.profile ? `${member.profile.first_name} ${member.profile.last_name}`.trim() : member.username}</option>)}
                </select>
                <Button disabled={!selected} onClick={() => addMemberMutation.mutate({ householdId: household.id, userId: selected }, { onSuccess: () => setSelectedMembers({ ...selectedMembers, [household.id]: "" }) })} type="button"><UserPlus className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>

      {householdsQuery.isLoading ? <Text as="p" tone="inherit" variant="inherit">Loading households…</Text> : null}
      {householdsQuery.isError ? <Text as="p" tone="inherit" variant="inherit" className="text-[var(--status-danger)]">Unable to load households.</Text> : null}
    </div>
  );
}

