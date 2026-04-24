"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  LayoutList,
  Calendar as CalendarIcon,
} from "lucide-react";
import { EventCalendar } from "./EventCalendar";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select, Textarea, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useCreateEventCategoryMutation,
  useCreateEventMutation,
  useDeleteEventCategoryMutation,
  useDeleteEventMutation,
  useEventMetaQuery,
  useEventsQuery,
  useUpdateEventMutation,
  type CreateEventDto,
  type EventAudience,
  type EventItem,
  type EventRepeat,
  type EventStatus,
} from "@services/event";

type EventForm = {
  audience: EventAudience;
  category_id: string;
  church_unit_ids: string[];
  color: string;
  cover_image_url: string;
  description: string;
  ends_at: string;
  location: string;
  repeat: EventRepeat;
  slug: string;
  starts_at: string;
  status: EventStatus;
  title: string;
  user_ids: string[];
};

type CategoryForm = {
  description: string;
  name: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function toLocalDateTimeInput(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function createEmptyForm(now = new Date()): EventForm {
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);
  startsAt.setHours(startsAt.getHours() + 1);
  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);

  return {
    audience: "public",
    category_id: "",
    church_unit_ids: [],
    color: "#5b8def",
    cover_image_url: "",
    description: "",
    ends_at: toLocalDateTimeInput(endsAt),
    location: "",
    repeat: "none",
    slug: "",
    starts_at: toLocalDateTimeInput(startsAt),
    status: "published",
    title: "",
    user_ids: [],
  };
}

function eventToForm(event: EventItem): EventForm {
  return {
    audience: event.audience,
    category_id: event.category ? String(event.category.id) : "",
    church_unit_ids: event.target_church_units.map((unit) => unit.id),
    color: event.color ?? "#5b8def",
    cover_image_url: event.cover_image_url ?? "",
    description: event.description ?? "",
    ends_at: toLocalDateTimeInput(event.ends_at),
    location: event.location ?? "",
    repeat: event.repeat,
    slug: event.slug,
    starts_at: toLocalDateTimeInput(event.starts_at),
    status: event.status,
    title: event.title,
    user_ids: event.target_users.map((user) => user.id),
  };
}

function localInputToIso(value: string) {
  return new Date(value).toISOString();
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function audienceLabel(audience: EventAudience, t: (key: any, params?: any) => string) {
  switch (audience) {
    case "church":
      return t("event.form.audience.church");
    case "church_unit":
      return t("event.form.audience.churchUnit");
    case "people":
      return t("event.form.audience.people");
    default:
      return t("event.form.audience.public");
  }
}

function repeatLabel(repeat: EventRepeat, t: (key: any, params?: any) => string) {
  switch (repeat) {
    case "daily":
      return t("event.form.repeat.daily");
    case "weekly":
      return t("event.form.repeat.weekly");
    case "monthly":
      return t("event.form.repeat.monthly");
    case "weekdays":
      return t("event.form.repeat.weekdays");
    default:
      return t("event.form.repeat.none");
  }
}

function statusLabel(status: EventStatus, t: (key: any, params?: any) => string) {
  return status === "draft" ? t("event.form.status.draft") : t("event.form.status.published");
}

function formatEventDateRange(
  locale: string,
  startsAt: string,
  endsAt: string,
) {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

function assignmentSummary(event: EventItem, t: (key: any, params?: any) => string) {
  if (event.audience === "church_unit") {
    return t("event.list.assignedUnits", {
      count: String(event.target_church_units.length),
    });
  }

  if (event.audience === "people") {
    return t("event.list.assignedPeople", {
      count: String(event.target_users.length),
    });
  }

  return event.audience === "church"
    ? t("event.list.churchAudience")
    : t("event.list.publicAudience");
}

export function EventPage() {
  const { can, isAuthenticated } = useAuth();
  const { confirm, toast } = useFeedback();
  const { locale, t } = useTranslation();
  const canManageEvents = can(PERMISSIONS.manageEvents);
  const canReadMeta = isAuthenticated && (can(PERMISSIONS.viewEvents) || canManageEvents);
  const eventsQuery = useEventsQuery({ take: 100 }, true);
  const metaQuery = useEventMetaQuery(canReadMeta);
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();
  const createCategoryMutation = useCreateEventCategoryMutation();
  const deleteCategoryMutation = useDeleteEventCategoryMutation();
  const events = eventsQuery.data?.items ?? [];
  const meta = metaQuery.data;
  const [query, setQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState<EventForm>(() => createEmptyForm());
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ description: "", name: "" });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      if (audienceFilter !== "all" && event.audience !== audienceFilter) {
        return false;
      }

      if (statusFilter !== "all" && event.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all" && String(event.category?.id ?? "") !== categoryFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        event.title,
        event.slug,
        event.location ?? "",
        event.description ?? "",
        event.category?.name ?? "",
        ...event.target_church_units.map((unit) => unit.name),
        ...event.target_users.map((user) => user.display_name),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [audienceFilter, categoryFilter, events, query, statusFilter]);

  const upcomingCount = events.filter((event) => new Date(event.starts_at) > new Date()).length;
  const targetedCount = events.filter(
    (event) => event.audience === "church_unit" || event.audience === "people",
  ).length;
  const publishedCount = events.filter((event) => event.status === "published").length;
  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    createCategoryMutation.error ??
    deleteCategoryMutation.error;

  function openCreateModal() {
    setEditingEvent(null);
    setSlugTouched(false);
    setForm(createEmptyForm());
    setModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setEditingEvent(event);
    setSlugTouched(true);
    setForm(eventToForm(event));
    setModalOpen(true);
  }

  function closeModal() {
    setEditingEvent(null);
    setModalOpen(false);
  }

  function toggleCheckboxValue(field: "church_unit_ids" | "user_ids", value: string) {
    setForm((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  }

  function handleTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  function buildEventPayload(): CreateEventDto {
    return {
      audience: form.audience,
      category_id: form.category_id ? Number(form.category_id) : null,
      church_unit_ids: form.audience === "church_unit" ? form.church_unit_ids : [],
      color: form.color.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      description: form.description.trim() || null,
      ends_at: localInputToIso(form.ends_at),
      location: form.location.trim() || null,
      repeat: form.repeat,
      slug: form.slug.trim(),
      starts_at: localInputToIso(form.starts_at),
      status: form.status,
      title: form.title.trim(),
      user_ids: form.audience === "people" ? form.user_ids : [],
    };
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildEventPayload();

    if (editingEvent) {
      updateMutation.mutate(
        { dto: payload, slug: editingEvent.slug },
        {
          onSuccess() {
            toast({ title: t("event.toast.saved"), variant: "success" });
            closeModal();
          },
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess() {
        toast({ title: t("event.toast.created"), variant: "success" });
        closeModal();
      },
    });
  }

  async function handleDeleteEvent(event: EventItem) {
    const ok = await confirm({
      title: t("event.deleteConfirm", { title: event.title }),
      variant: "delete",
    });

    if (!ok) {
      return;
    }

    deleteMutation.mutate(event.slug, {
      onSuccess() {
        toast({ title: t("event.toast.deleted"), variant: "success" });
        if (editingEvent?.id === event.id) {
          closeModal();
        }
      },
    });
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createCategoryMutation.mutate(
      {
        description: categoryForm.description.trim() || null,
        name: categoryForm.name.trim(),
      },
      {
        onSuccess() {
          toast({ title: t("event.category.toast.created"), variant: "success" });
          setCategoryForm({ description: "", name: "" });
        },
      },
    );
  }

  async function handleDeleteCategory(id: number, name: string) {
    const ok = await confirm({
      title: t("event.category.deleteConfirm", { name }),
      variant: "delete",
    });

    if (!ok) {
      return;
    }

    deleteCategoryMutation.mutate(id, {
      onSuccess() {
        toast({ title: t("event.category.toast.deleted"), variant: "success" });
        if (form.category_id === String(id)) {
          setForm((current) => ({ ...current, category_id: "" }));
        }
      },
    });
  }

  return (
    <PageLayout
      description={t("page.event.description")}
      eyebrow={t("page.event.eyebrow")}
      title={t("page.event.title")}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {t("event.stats.total")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{events.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {t("event.stats.upcoming")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{upcomingCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {t("event.stats.targeted")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{targetedCount}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("event.stats.published", { count: String(publishedCount) })}
          </p>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card className="overflow-hidden rounded-2xl border-[var(--border-subtle)] shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                {canManageEvents ? (
                  <div className="flex items-center gap-2 mr-auto lg:mr-2">
                    <Button onClick={() => setCategoryModalOpen(true)} variant="secondary" className="h-11 rounded-xl px-4 hidden sm:flex">
                      <LayoutList aria-hidden="true" className="mr-2 h-4 w-4" />
                      {t("event.category.title")}
                    </Button>
                    <Button onClick={openCreateModal} className="h-11 rounded-xl px-4">
                      <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                      {t("event.action.add")}
                    </Button>
                  </div>
                ) : null}
                <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-subtle)]">
                  <Button
                    variant={viewMode === "calendar" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9 px-3 rounded-lg"
                    onClick={() => setViewMode("calendar")}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {t("event.calendar.view")}
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9 px-3 rounded-lg"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="h-4 w-4 mr-2" />
                    {t("event.list.view")}
                  </Button>
                </div>

                <div className="relative min-w-0 flex-1 lg:w-80">
                  <Search
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
                  />
                  <Input
                    className="h-11 rounded-xl pl-11"
                    onChange={(target) => setQuery(target.target.value)}
                    placeholder={t("event.list.search")}
                    value={query}
                  />
                </div>
                <Button
                  aria-label={t("admin.members.refresh")}
                  className="h-11 w-11 shrink-0 rounded-xl"
                  onClick={() => {
                    void eventsQuery.refetch();
                    if (canReadMeta) {
                      void metaQuery.refetch();
                    }
                  }}
                  variant="secondary"
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4",
                      eventsQuery.isFetching || metaQuery.isFetching ? "animate-spin" : "",
                    )}
                  />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <FormField htmlFor="event-status-filter" label={t("event.form.status")}>
                <Select
                  id="event-status-filter"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  <option value="published">{t("event.form.status.published")}</option>
                  <option value="draft">{t("event.form.status.draft")}</option>
                </Select>
              </FormField>
              <FormField htmlFor="event-audience-filter" label={t("event.form.audience")}>
                <Select
                  id="event-audience-filter"
                  onChange={(event) => setAudienceFilter(event.target.value)}
                  value={audienceFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  <option value="public">{t("event.form.audience.public")}</option>
                  <option value="church">{t("event.form.audience.church")}</option>
                  <option value="church_unit">{t("event.form.audience.churchUnit")}</option>
                  <option value="people">{t("event.form.audience.people")}</option>
                </Select>
              </FormField>
              <FormField htmlFor="event-category-filter" label={t("event.form.category")}>
                <Select
                  id="event-category-filter"
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  value={categoryFilter}
                >
                  <option value="all">{t("prayer.filter.all")}</option>
                  {(meta?.categories ?? []).map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          {eventsQuery.error || mutationError || metaQuery.error ? (
            <div
              className="m-6 rounded-xl border p-4 text-sm font-medium"
              style={{
                backgroundColor: "var(--status-danger-bg)",
                borderColor: "color-mix(in srgb, var(--status-danger) 24%, var(--border-subtle))",
                color: "var(--status-danger)",
              }}
            >
              {mutationErrorMessage(eventsQuery.error ?? mutationError ?? metaQuery.error)}
            </div>
          ) : null}

          {viewMode === "list" ? (
            <div className="grid divide-y divide-[var(--border-subtle)]">
              {visibleEvents.map((event) => (
                <div className="px-6 py-5" key={event.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-bold text-[var(--text-primary)]">
                          {event.title}
                        </p>
                        <span className="rounded-full bg-[var(--brand-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
                          {audienceLabel(event.audience, t)}
                        </span>
                        <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          {statusLabel(event.status, t)}
                        </span>
                        {event.category ? (
                          <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            {event.category.name}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Clock3 aria-hidden="true" className="h-4 w-4" />
                          <span>{formatEventDateRange(locale, event.starts_at, event.ends_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users aria-hidden="true" className="h-4 w-4" />
                          <span>{assignmentSummary(event, t)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays aria-hidden="true" className="h-4 w-4" />
                          <span>{repeatLabel(event.repeat, t)}</span>
                        </div>
                        {event.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin aria-hidden="true" className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        ) : null}
                      </div>

                      {event.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {event.description}
                        </p>
                      ) : null}
                    </div>

                    {canManageEvents ? (
                      <div className="flex shrink-0 gap-2">
                        <Button onClick={() => openEditModal(event)} size="sm" variant="secondary">
                          <Edit3 aria-hidden="true" className="mr-2 h-4 w-4" />
                          {t("action.edit")}
                        </Button>
                        <Button
                          onClick={() => handleDeleteEvent(event)}
                          size="sm"
                          variant="danger"
                        >
                          <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                          {t("event.action.delete")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {!eventsQuery.isLoading && visibleEvents.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {t("event.list.emptyTitle")}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("event.list.emptyDescription")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-6">
              <EventCalendar events={visibleEvents} onEventClick={openEditModal} />
            </div>
          )}
        </Card>


      </div>

      {modalOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-[var(--bg-scrim)]/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
                  {t("event.config.eyebrow")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                  {editingEvent ? t("event.config.title.edit") : t("event.config.title.add")}
                </h2>
              </div>
              <Button className="h-10 w-10 rounded-xl p-0" onClick={closeModal} variant="ghost">
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>

            <form className="space-y-6 px-6 py-6" onSubmit={submitEvent}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField htmlFor="event-title" label={t("event.form.title")}>
                  <Input
                    id="event-title"
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder={t("event.form.titlePlaceholder")}
                    value={form.title}
                  />
                </FormField>
                <FormField htmlFor="event-slug" label={t("event.form.slug")}>
                  <Input
                    id="event-slug"
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
                    }}
                    placeholder={t("event.form.slugPlaceholder")}
                    value={form.slug}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField htmlFor="event-category" label={t("event.form.category")}>
                  <Select
                    id="event-category"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category_id: event.target.value }))
                    }
                    value={form.category_id}
                  >
                    <option value="">{t("event.form.categoryNone")}</option>
                    {(meta?.categories ?? []).map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField htmlFor="event-status" label={t("event.form.status")}>
                  <Select
                    id="event-status"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as EventStatus,
                      }))
                    }
                    value={form.status}
                  >
                    <option value="published">{t("event.form.status.published")}</option>
                    <option value="draft">{t("event.form.status.draft")}</option>
                  </Select>
                </FormField>
                <FormField htmlFor="event-repeat" label={t("event.form.repeat")}>
                  <Select
                    id="event-repeat"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        repeat: event.target.value as EventRepeat,
                      }))
                    }
                    value={form.repeat}
                  >
                    <option value="none">{t("event.form.repeat.none")}</option>
                    <option value="daily">{t("event.form.repeat.daily")}</option>
                    <option value="weekly">{t("event.form.repeat.weekly")}</option>
                    <option value="monthly">{t("event.form.repeat.monthly")}</option>
                    <option value="weekdays">{t("event.form.repeat.weekdays")}</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField htmlFor="event-starts-at" label={t("event.form.starts")}>
                  <Input
                    id="event-starts-at"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, starts_at: event.target.value }))
                    }
                    type="datetime-local"
                    value={form.starts_at}
                  />
                </FormField>
                <FormField htmlFor="event-ends-at" label={t("event.form.ends")}>
                  <Input
                    id="event-ends-at"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ends_at: event.target.value }))
                    }
                    type="datetime-local"
                    value={form.ends_at}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField htmlFor="event-location" label={t("event.form.location")}>
                  <Input
                    id="event-location"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder={t("event.form.locationPlaceholder")}
                    value={form.location}
                  />
                </FormField>
                <FormField htmlFor="event-cover-image" label={t("event.form.coverImage")}>
                  <Input
                    id="event-cover-image"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cover_image_url: event.target.value,
                      }))
                    }
                    placeholder={t("event.form.coverImagePlaceholder")}
                    value={form.cover_image_url}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_9rem]">
                <FormField htmlFor="event-description" label={t("event.form.description")}>
                  <Textarea
                    id="event-description"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder={t("event.form.descriptionPlaceholder")}
                    rows={4}
                    value={form.description}
                  />
                </FormField>
                <FormField htmlFor="event-color" label={t("event.form.color")}>
                  <Input
                    id="event-color"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, color: event.target.value }))
                    }
                    type="color"
                    value={form.color}
                  />
                </FormField>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t("event.form.assignment")}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("event.form.assignmentHelp")}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <FormField htmlFor="event-audience" label={t("event.form.audience")}>
                    <Select
                      id="event-audience"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          audience: event.target.value as EventAudience,
                        }))
                      }
                      value={form.audience}
                    >
                      <option value="public">{t("event.form.audience.public")}</option>
                      <option value="church">{t("event.form.audience.church")}</option>
                      <option value="church_unit">{t("event.form.audience.churchUnit")}</option>
                      <option value="people">{t("event.form.audience.people")}</option>
                    </Select>
                  </FormField>
                  <div className="md:col-span-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {t("event.utc.description")}
                  </div>
                </div>

                {form.audience === "church_unit" ? (
                  <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("event.form.assignChurchUnits")}
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {(meta?.church_units ?? []).map((unit) => (
                        <label
                          className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)]"
                          key={unit.id}
                        >
                          <input
                            checked={form.church_unit_ids.includes(unit.id)}
                            onChange={() => toggleCheckboxValue("church_unit_ids", unit.id)}
                            type="checkbox"
                          />
                          <span>{unit.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {form.audience === "people" ? (
                  <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("event.form.assignPeople")}
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {(meta?.members ?? []).map((member) => (
                        <label
                          className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)]"
                          key={member.id}
                        >
                          <input
                            checked={form.user_ids.includes(member.id)}
                            onChange={() => toggleCheckboxValue("user_ids", member.id)}
                            type="checkbox"
                          />
                          <span>{member.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:justify-end">
                {editingEvent ? (
                  <Button
                    onClick={() => handleDeleteEvent(editingEvent)}
                    type="button"
                    variant="danger"
                  >
                    <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t("event.action.delete")}
                  </Button>
                ) : null}
                <Button onClick={closeModal} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
                <Button
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  type="submit"
                >
                  {editingEvent ? t("event.action.saveChanges") : t("event.action.add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {categoryModalOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-[var(--bg-scrim)]/80 backdrop-blur-sm"
            onClick={() => setCategoryModalOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
                  {t("event.category.eyebrow")}
                </p>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                  {t("event.category.title")}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {t("event.category.description")}
                </p>
              </div>
              <Button className="h-10 w-10 rounded-xl p-0" onClick={() => setCategoryModalOpen(false)} variant="ghost">
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {canManageEvents ? (
                <form className="space-y-4" onSubmit={submitCategory}>
                  <FormField htmlFor="event-category-name" label={t("event.category.name")}>
                    <Input
                      id="event-category-name"
                      onChange={(event) =>
                        setCategoryForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder={t("event.category.namePlaceholder")}
                      value={categoryForm.name}
                    />
                  </FormField>
                  <FormField
                    htmlFor="event-category-description"
                    label={t("event.category.descriptionLabel")}
                  >
                    <Textarea
                      id="event-category-description"
                      onChange={(event) =>
                        setCategoryForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder={t("event.category.descriptionPlaceholder")}
                      rows={3}
                      value={categoryForm.description}
                    />
                  </FormField>
                  <Button isLoading={createCategoryMutation.isPending} type="submit">
                    <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t("event.category.add")}
                  </Button>
                </form>
              ) : null}

              <div className="space-y-3">
                {(meta?.categories ?? []).map((category) => (
                  <div
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4"
                    key={category.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{category.name}</p>
                        {category.description ? (
                          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                      {canManageEvents ? (
                        <Button
                          className="h-9 w-9 rounded-xl p-0"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-4 text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">{t("event.utc.title")}</p>
                <p className="mt-2 leading-6">{t("event.utc.description")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
