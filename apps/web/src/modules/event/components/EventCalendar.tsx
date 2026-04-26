import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, MapPin, X } from "lucide-react";
import { Button, Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { EventItem } from "@services/event";

interface EventCalendarProps {
  events: EventItem[];
  onEventClick?: (event: EventItem) => void;
}

const MAX_VISIBLE_EVENTS = 3;

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

    // Previous month padding
    for (let i = prevMonthPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows of 7 days
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

    events.forEach((event) => {
      const startDate = new Date(event.starts_at);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const startDateNum = startDate.getDate();
      const startDayOfWeek = startDate.getDay();

      const startNormalized = new Date(startYear, startMonth, startDateNum).getTime();

      calendarDays.forEach((day) => {
        const currentDate = day.date;
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDateNum = currentDate.getDate();
        const currentDayOfWeek = currentDate.getDay();

        const currentNormalized = new Date(currentYear, currentMonth, currentDateNum).getTime();

        if (currentNormalized < startNormalized) return;

        let isMatch = false;

        switch (event.repeat) {
          case "none":
            isMatch = currentNormalized === startNormalized;
            break;
          case "daily":
            isMatch = true;
            break;
          case "weekly":
            isMatch = currentDayOfWeek === startDayOfWeek;
            break;
          case "monthly":
            isMatch = currentDateNum === startDateNum;
            break;
          case "weekdays":
            isMatch = currentDayOfWeek !== 0 && currentDayOfWeek !== 6;
            break;
        }

        if (isMatch) {
          const key = `${currentYear}-${currentMonth}-${currentDateNum}`;
          if (!map[key]) map[key] = [];
          map[key].push(event);
        }
      });
    });

    // Sort events by start time within each day
    Object.values(map).forEach((dayEvents) => {
      dayEvents.sort((a, b) => {
        const timeA = new Date(a.starts_at).getHours() * 60 + new Date(a.starts_at).getMinutes();
        const timeB = new Date(b.starts_at).getHours() * 60 + new Date(b.starts_at).getMinutes();
        return timeA - timeB;
      });
    });

    return map;
  }, [events, calendarDays]);

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

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
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={goToPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
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

          <div className="max-h-[70vh] overflow-y-auto snap-y snap-proximity scroll-smooth bg-[var(--border-subtle)] border-b border-[var(--border-subtle)]">
            {Array.from({ length: 6 }).map((_, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-[1px] snap-start">
                {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, i) => {
                  const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
                  const dayEvents = eventsByDay[dateKey] || [];
                  const today = isToday(day.date);

                  const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                  const hasMore = dayEvents.length > MAX_VISIBLE_EVENTS;
                  const moreCount = dayEvents.length - MAX_VISIBLE_EVENTS;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "min-h-[140px] bg-[var(--bg-surface)] p-1.5 transition-all duration-200 flex flex-col border-b",
                        !day.isCurrentMonth && "bg-[var(--bg-base)]/40 text-[var(--text-tertiary)]",
                        day.isCurrentMonth && "hover:bg-[var(--brand-muted)]/5"
                      )}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                            today
                              ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20"
                              : day.isCurrentMonth
                                ? "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                                : "text-[var(--text-tertiary)]"
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {visibleEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className="w-full text-left px-2 py-1 rounded-md transition-all group relative overflow-hidden flex items-center gap-1.5 hover:brightness-95 active:scale-[0.98]"
                            style={{
                              backgroundColor: `${event.color || "var(--brand-primary)"}15`,
                              borderLeft: `3px solid ${event.color || "var(--brand-primary)"}`
                            }}
                          >
                            <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">
                              {new Intl.DateTimeFormat(locale, {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: false,
                              }).format(new Date(event.starts_at))} {event.title}
                            </span>
                          </button>
                        ))}
                        {hasMore && (
                          <button
                            onClick={() => setSelectedDayEvents({ date: day.date, events: dayEvents })}
                            className="w-full text-left px-2 py-0.5 text-[10px] font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-muted)]/20 rounded-md transition-colors mt-1"
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
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => setSelectedDayEvents(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 snap-y snap-proximity scroll-smooth">
              {selectedDayEvents.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    onEventClick?.(event);
                    setSelectedDayEvents(null);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all shadow-sm flex items-start gap-3 group snap-start"
                >
                  <div
                    className="w-1.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: event.color || "var(--brand-primary)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)] font-medium">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>
                        {new Intl.DateTimeFormat(locale, {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: false,
                        }).format(new Date(event.starts_at))}
                      </span>
                      {event.location && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
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
