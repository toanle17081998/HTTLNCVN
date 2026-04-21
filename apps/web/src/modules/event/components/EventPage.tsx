"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select, Textarea, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import {
  eventColors,
  eventMockData,
  type ChurchEvent,
  type EventAudience,
  type EventRepeat,
} from "@/mockData";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";

type EventForm = {
  title: string;
  audience: EventAudience;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  color: string;
  repeat: EventRepeat;
};


const weekdaysKeys = [
  "event.days.sun",
  "event.days.mon",
  "event.days.tue",
  "event.days.wed",
  "event.days.thu",
  "event.days.fri",
  "event.days.sat",
] as const;

const monthNamesKeys = [
  "event.months.jan",
  "event.months.feb",
  "event.months.mar",
  "event.months.apr",
  "event.months.may",
  "event.months.jun",
  "event.months.jul",
  "event.months.aug",
  "event.months.sep",
  "event.months.oct",
  "event.months.nov",
  "event.months.dec",
] as const;

function createEmptyForm(monthDate: Date): EventForm {
  const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 18, 0);
  const endDate = new Date(date);
  endDate.setHours(date.getHours() + 1);

  return {
    title: "",
    audience: "public",
    startsAt: toInputDateTime(date),
    endsAt: toInputDateTime(endDate),
    location: "",
    description: "",
    color: eventColors[0],
    repeat: "none",
  };
}

function toInputDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatEventDate(value: string, t: (key: any, params?: any) => string) {
  const date = new Date(value);

  return `${t(monthNamesKeys[date.getMonth()])} ${date.getDate()}`;
}

function formatEventTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameMonth(value: string, monthDate: Date) {
  const date = new Date(value);

  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = leadingDays; index > 0; index -= 1) {
    cells.push({
      date: new Date(year, month, 1 - index),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, month, daysInMonth + (cells.length % 7) + 1),
      inMonth: false,
    });
  }

  return cells;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function eventToForm(event: ChurchEvent): EventForm {
  return {
    title: event.title,
    audience: event.audience,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    description: event.description,
    color: event.color,
    repeat: event.repeat,
  };
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
    case "none":
      return t("event.form.repeat.none");
  }
}

function occursOnDate(event: ChurchEvent, date: Date) {
  const startDate = new Date(event.startsAt);

  if (date < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) {
    return false;
  }

  if (event.repeat === "none") {
    return dateKey(startDate) === dateKey(date);
  }

  if (event.repeat === "daily") {
    return true;
  }

  if (event.repeat === "weekdays") {
    const day = date.getDay();

    return day >= 1 && day <= 5;
  }

  if (event.repeat === "weekly") {
    return startDate.getDay() === date.getDay();
  }

  return startDate.getDate() === date.getDate();
}

function occurrenceForDate(event: ChurchEvent, date: Date) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const occurrenceStart = new Date(date);
  const occurrenceEnd = new Date(date);

  occurrenceStart.setHours(startsAt.getHours(), startsAt.getMinutes(), 0, 0);
  occurrenceEnd.setHours(endsAt.getHours(), endsAt.getMinutes(), 0, 0);

  return {
    ...event,
    startsAt: toInputDateTime(occurrenceStart),
    endsAt: toInputDateTime(occurrenceEnd),
  };
}

function expandEventsForMonth(events: ChurchEvent[], monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const occurrences: ChurchEvent[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);

    events.forEach((event) => {
      if (occursOnDate(event, date)) {
        occurrences.push(occurrenceForDate(event, date));
      }
    });
  }

  return occurrences.sort(
    (first, second) =>
      new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
  );
}

export function EventPage() {
  const { can, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const canManageEvents = can(PERMISSIONS.manageEvents);
  const [monthDate, setMonthDate] = useState(new Date(2026, 3, 1));
  const [events, setEvents] = useState<ChurchEvent[]>(eventMockData);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<ChurchEvent | null>(null);
  const [form, setForm] = useState<EventForm>(() => createEmptyForm(monthDate));
  const [modalOpen, setModalOpen] = useState(false);

  const visibleEvents = useMemo(() => {
    return events
      .filter((event) => isAuthenticated || event.audience === "public")
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
      );
  }, [events, isAuthenticated]);
  const monthEvents = expandEventsForMonth(visibleEvents, monthDate);
  const calendarDays = buildCalendarDays(monthDate);

  function shiftMonth(offset: number) {
    setMonthDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function openCreateModal() {
    setEditingEventId(null);
    setForm(createEmptyForm(monthDate));
    setModalOpen(true);
  }

  function openEditModal(event: ChurchEvent) {
    setViewingEvent(null);
    setEditingEventId(event.id);
    setForm(eventToForm(event));
    setModalOpen(true);
  }

  function openViewModal(event: ChurchEvent) {
    setEditingEventId(null);
    setViewingEvent(event);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEventId(null);
    setViewingEvent(null);
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEvent: ChurchEvent = {
      id: editingEventId ?? crypto.randomUUID(),
      ...form,
    };

    setEvents((currentEvents) => {
      if (!editingEventId) {
        return [...currentEvents, nextEvent];
      }

      return currentEvents.map((item) =>
        item.id === editingEventId ? nextEvent : item,
      );
    });
    closeModal();
  }

  function deleteEvent() {
    if (!editingEventId) {
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== editingEventId),
    );
    closeModal();
  }

  return (
    <PageLayout
      actions={
        canManageEvents ? (
          <Button onClick={openCreateModal}>
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("event.action.add")}
          </Button>
        ) : null
      }
      description={t("page.event.description")}
      eyebrow={t("page.event.eyebrow")}
      title={t("page.event.title")}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-primary)]">
                {t("event.calendar.view")}
              </p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                {t(monthNamesKeys[monthDate.getMonth()])} {monthDate.getFullYear()}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                size="sm"
                variant="secondary"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                size="sm"
                variant="secondary"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[42rem] md:min-w-0">
              <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                {weekdaysKeys.map((key) => (
                  <div
                    className="px-2 py-3 text-center text-xs font-semibold uppercase text-[var(--text-secondary)]"
                    key={key}
                  >
                    {t(key)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayEvents = monthEvents.filter(
                    (event) =>
                      dateKey(new Date(event.startsAt)) === dateKey(day.date),
                  );

                  return (
                    <div
                      className={cn(
                        "min-h-28 border-b border-r border-[var(--border-subtle)] p-2",
                        !day.inMonth &&
                          "bg-[var(--bg-base)] text-[var(--text-tertiary)]",
                      )}
                      key={day.date.toISOString()}
                    >
                      <div className="text-sm font-semibold">
                        {day.date.getDate()}
                      </div>
                      <div className="mt-2 grid gap-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            className="min-w-0 rounded-md px-2 py-1 text-left text-xs font-semibold text-white shadow-sm"
                            key={`${event.id}-${event.startsAt}`}
                            onClick={() => openViewModal(event)}
                            style={{ backgroundColor: event.color }}
                            type="button"
                          >
                            <span className="block truncate">{event.title}</span>
                          </button>
                        ))}
                        {dayEvents.length > 3 ? (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {t("event.list.more", {
                              count: (dayEvents.length - 3).toString(),
                            })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card className="h-max p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-primary)]">
                {t("event.list.title")}
              </p>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("event.list.currentMonth")}
              </h2>
            </div>
            <CalendarDays
              aria-hidden="true"
              className="h-5 w-5 text-[var(--brand-primary)]"
            />
          </div>

          <div className="mt-5 grid gap-3">
            {monthEvents.map((event) => (
              <div
                className="group relative cursor-pointer rounded-md border border-[var(--border-subtle)] p-4 transition-colors hover:bg-[var(--bg-base)]"
                key={`${event.id}-${event.startsAt}`}
                onClick={() => openViewModal(event)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                        {event.audience === "public"
                          ? t("event.form.audience.public")
                          : t("event.form.audience.church")}
                      </span>
                      <span className="rounded-md bg-[var(--brand-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
                        {repeatLabel(event.repeat, t)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)]">
                      {event.title}
                    </h3>
                  </div>
                  {canManageEvents ? (
                    <button
                      aria-label={`Edit ${event.title}`}
                      className="relative z-10 rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(event);
                      }}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
                  <p className="flex items-center gap-2">
                    <Clock aria-hidden="true" className="h-4 w-4" />
                    {formatEventDate(event.startsAt, t)} -{" "}
                    {formatEventTime(event.startsAt)} -{" "}
                    {formatEventTime(event.endsAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                    {event.location}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
          <form
            className="grid max-h-[calc(100vh-3rem)] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitEvent}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                  {t("event.config.eyebrow")}
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {viewingEvent
                    ? viewingEvent.title
                    : editingEventId
                      ? t("event.config.title.edit")
                      : t("event.config.title.add")}
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

            {viewingEvent ? (
              <div className="grid gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: viewingEvent.color }}
                  />
                  <span className="text-sm font-semibold uppercase text-[var(--text-secondary)]">
                    {viewingEvent.audience === "public"
                      ? t("event.form.audience.public")
                      : t("event.form.audience.church")}
                  </span>
                  <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                    {repeatLabel(viewingEvent.repeat, t)}
                  </span>
                </div>

                <div className="grid gap-4 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-base)] text-[var(--brand-primary)]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {t("event.form.starts")}
                      </p>
                      <p>
                        {formatEventDate(viewingEvent.startsAt, t)} @{" "}
                        {formatEventTime(viewingEvent.startsAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-base)] text-[var(--brand-primary)]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {t("event.form.ends")}
                      </p>
                      <p>
                        {formatEventDate(viewingEvent.endsAt, t)} @{" "}
                        {formatEventTime(viewingEvent.endsAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-base)] text-[var(--brand-primary)]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {t("event.form.location")}
                      </p>
                      <p>{viewingEvent.location}</p>
                    </div>
                  </div>
                </div>

                {viewingEvent.description ? (
                  <div className="rounded-lg bg-[var(--bg-base)] p-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("event.form.description")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {viewingEvent.description}
                    </p>
                  </div>
                ) : null}

                <div className="flex justify-end gap-3 border-t border-[var(--border-subtle)] pt-5">
                  <Button onClick={closeModal} type="button" variant="secondary">
                    {t("common.cancel")}
                  </Button>
                  {canManageEvents ? (
                    <Button
                      onClick={() => {
                        const eventToEdit = viewingEvent;
                        closeModal();
                        openEditModal(eventToEdit);
                      }}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {t("event.config.title.edit")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField htmlFor="event-title" label={t("event.form.title")}>
                    <Input
                      id="event-title"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                      value={form.title}
                    />
                  </FormField>
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
                      <option value="public">{t("event.form.audience.publicOption")}</option>
                      <option value="church">{t("event.form.audience.churchOption")}</option>
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
                      <option value="none">{t("event.form.repeat.noneOption")}</option>
                      <option value="daily">{t("event.form.repeat.daily")}</option>
                      <option value="weekly">{t("event.form.repeat.weekly")}</option>
                      <option value="monthly">{t("event.form.repeat.monthly")}</option>
                      <option value="weekdays">{t("event.form.repeat.weekdays")}</option>
                    </Select>
                  </FormField>
                  <FormField htmlFor="event-start" label={t("event.form.starts")}>
                    <Input
                      id="event-start"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startsAt: event.target.value,
                        }))
                      }
                      required
                      type="datetime-local"
                      value={form.startsAt}
                    />
                  </FormField>
                  <FormField htmlFor="event-end" label={t("event.form.ends")}>
                    <Input
                      id="event-end"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endsAt: event.target.value,
                        }))
                      }
                      required
                      type="datetime-local"
                      value={form.endsAt}
                    />
                  </FormField>
                  <FormField htmlFor="event-location" label={t("event.form.location")}>
                    <Input
                      id="event-location"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      required
                      value={form.location}
                    />
                  </FormField>
                  <FormField htmlFor="event-color" label={t("event.form.color")}>
                    <div className="flex h-10 items-center gap-2">
                      {eventColors.map((color) => (
                        <button
                          key={color}
                          aria-label={`Use ${color}`}
                          aria-pressed={form.color === color}
                          className={cn(
                            "h-8 w-8 rounded-md border-2 transition",
                            form.color === color
                              ? "border-[var(--text-primary)]"
                              : "border-transparent",
                          )}
                          onClick={() =>
                            setForm((current) => ({ ...current, color }))
                          }
                          style={{ backgroundColor: color }}
                          type="button"
                        />
                      ))}
                    </div>
                  </FormField>
                  <FormField
                    htmlFor="event-description"
                    label={t("event.form.description")}
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="event-description"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      value={form.description}
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {editingEventId ? (
                    <Button onClick={deleteEvent} type="button" variant="danger">
                      <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                      {t("event.action.delete")}
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={closeModal} type="button" variant="secondary">
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                      {editingEventId ? t("event.action.saveChanges") : t("event.action.add")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
