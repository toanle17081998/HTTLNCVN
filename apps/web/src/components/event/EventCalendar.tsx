import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, MapPin, X } from "lucide-react";
import { Button, Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { EventItem } from "@/services/event";

interface EventCalendarProps {
  events: EventItem[];
  onEventClick?: (event: EventItem) => void;
}

const MAX_VISIBLE_EVENTS = 3;
const MAX_OCCURRENCES_PER_EVENT = 366;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isWeekday(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function formatEventTime(locale: string, event: EventItem, allDayLabel: string) {
  if (event.is_all_day) {
    return allDayLabel;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(new Date(event.starts_at));
}

function buildOccurrences(
  event: EventItem,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const baseStart = new Date(event.starts_at);
  const baseEnd = new Date(event.ends_at);
  const durationMs = Math.max(baseEnd.getTime() - baseStart.getTime(), 0);
  const occurrences: Array<{ start: Date; end: Date }> = [];

  const pushOccurrence = (start: Date) => {
    const end = new Date(start.getTime() + durationMs);
    if (end <= rangeStart || start >= rangeEnd) {
      return;
    }
    occurrences.push({ end, start });
  };

  if (event.repeat === "none") {
    pushOccurrence(baseStart);
    return occurrences;
  }

  let cursor = new Date(baseStart);
  let guard = 0;

  while (cursor < rangeStart && guard < MAX_OCCURRENCES_PER_EVENT) {
    switch (event.repeat) {
      case "daily":
        cursor = addDays(cursor, 1);
        break;
      case "weekly":
        cursor = addDays(cursor, 7);
        break;
      case "monthly":
        cursor = addMonths(cursor, 1);
        break;
      case "weekdays":
        cursor = addDays(cursor, 1);
        while (!isWeekday(cursor)) {
          cursor = addDays(cursor, 1);
        }
        break;
    }
    guard += 1;
  }

  guard = 0;
  while (cursor < rangeEnd && guard < MAX_OCCURRENCES_PER_EVENT) {
    pushOccurrence(cursor);

    switch (event.repeat) {
      case "daily":
        cursor = addDays(cursor, 1);
        break;
      case "weekly":
        cursor = addDays(cursor, 7);
        break;
      case "monthly":
        cursor = addMonths(cursor, 1);
        break;
      case "weekdays":
        cursor = addDays(cursor, 1);
        while (!isWeekday(cursor)) {
          cursor = addDays(cursor, 1);
        }
        break;
      default:
        cursor = rangeEnd;
        break;
    }

    guard += 1;
  }

  return occurrences;
}

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const { locale, t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: EventItem[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevMonthPadding = firstDayOfMonth;

  const calendarDays = useMemo(() => {
    const days = [];

    for (let i = prevMonthPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, daysInMonth, prevMonthPadding, prevMonthDays]);

  const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(currentDate);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    const rangeStart = startOfDay(calendarDays[0].date);
    const rangeEnd = addDays(startOfDay(calendarDays[calendarDays.length - 1].date), 1);

    events.forEach((event) => {
      const occurrences = buildOccurrences(event, rangeStart, rangeEnd);

      occurrences.forEach(({ start, end }) => {
        calendarDays.forEach((day) => {
          const dayStart = startOfDay(day.date);
          const dayEnd = addDays(dayStart, 1);

          if (start < dayEnd && end > dayStart) {
            const key = getDateKey(day.date);
            if (!map[key]) {
              map[key] = [];
            }
            map[key].push(event);
          }
        });
      });
    });

    Object.values(map).forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        if (a.is_all_day !== b.is_all_day) {
          return a.is_all_day ? -1 : 1;
        }

        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      });
    });

    return map;
  }, [calendarDays, events]);

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => sameDay(date, new Date());

  const weekDays = [
    t("event.days.sun"),
    t("event.days.mon"),
    t("event.days.tue"),
    t("event.days.wed"),
    t("event.days.thu"),
    t("event.days.fri"),
    t("event.days.sat"),
  ];

  return (
    <Card className="overflow-hidden border-[var(--border-subtle)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] capitalize">
            {monthName} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="lg"
              className="h-16 w-16 rounded-lg p-0"
              onClick={goToPrevMonth}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-16 w-16 rounded-lg p-0"
              onClick={goToNextMonth}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={goToToday} className="rounded-lg">
          {t("event.calendar.today")}
        </Button>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[800px] lg:min-w-full">
          <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="max-h-[70vh] overflow-y-auto snap-y snap-proximity scroll-smooth border-b border-[var(--border-subtle)] bg-[var(--border-subtle)]">
            {Array.from({ length: 6 }).map((_, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-[1px] snap-start">
                {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, i) => {
                  const dateKey = getDateKey(day.date);
                  const dayEvents = eventsByDay[dateKey] || [];
                  const today = isToday(day.date);

                  const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                  const hasMore = dayEvents.length > MAX_VISIBLE_EVENTS;
                  const moreCount = dayEvents.length - MAX_VISIBLE_EVENTS;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex min-h-[140px] flex-col border-b bg-[var(--bg-surface)] p-1.5 transition-all duration-200",
                        !day.isCurrentMonth && "bg-[var(--bg-base)]/40 text-[var(--text-tertiary)]",
                        day.isCurrentMonth && "hover:bg-[var(--brand-muted)]/5",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-center">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                            today
                              ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20"
                              : day.isCurrentMonth
                                ? "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                                : "text-[var(--text-tertiary)]",
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {visibleEvents.map((event, index) => (
                          <button
                            key={`${event.id}-${dateKey}-${index}`}
                            onClick={() => onEventClick?.(event)}
                            className="group relative flex w-full items-center gap-1.5 overflow-hidden rounded-md px-2 py-1 text-left transition-all hover:brightness-95 active:scale-[0.98]"
                            style={{
                              backgroundColor: `${event.color || "var(--brand-primary)"}15`,
                              borderLeft: `3px solid ${event.color || "var(--brand-primary)"}`,
                            }}
                          >
                            <span className="truncate text-[10px] font-bold text-[var(--text-primary)]">
                              {event.is_all_day ? `${t("event.form.allDay")} ${event.title}` : `${formatEventTime(locale, event, t("event.form.allDay"))} ${event.title}`}
                            </span>
                          </button>
                        ))}
                        {hasMore && (
                          <button
                            onClick={() => setSelectedDayEvents({ date: day.date, events: dayEvents })}
                            className="mt-1 w-full rounded-md px-2 py-0.5 text-left text-[10px] font-bold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-muted)]/20"
                          >
                            +{moreCount} {t("event.calendar.more") || "more"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDayEvents && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--bg-scrim)]/40 backdrop-blur-sm"
            onClick={() => setSelectedDayEvents(null)}
          />
          <Card className="relative w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(selectedDayEvents.date)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
                onClick={() => setSelectedDayEvents(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4 snap-y snap-proximity scroll-smooth">
              {selectedDayEvents.events.map((event, index) => (
                <button
                  key={`${event.id}-${getDateKey(selectedDayEvents.date)}-${index}`}
                  onClick={() => {
                    onEventClick?.(event);
                    setSelectedDayEvents(null);
                  }}
                  className="group flex snap-start items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-left shadow-sm transition-all hover:bg-[var(--bg-elevated)]"
                >
                  <div
                    className="h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color || "var(--brand-primary)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)]">
                      {event.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatEventTime(locale, event, t("event.form.allDay"))}</span>
                      {event.location && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[var(--border-subtle)]" />
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
