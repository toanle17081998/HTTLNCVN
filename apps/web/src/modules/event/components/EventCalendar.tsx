"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import { Button, Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { EventItem } from "@services/event";

interface EventCalendarProps {
  events: EventItem[];
  onEventClick?: (event: EventItem) => void;
}

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const { locale, t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

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
      const date = new Date(event.starts_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

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

      <div className="grid grid-cols-7 grid-rows-6 bg-[var(--border-subtle)] gap-[1px]">
        {calendarDays.map((day, i) => {
          const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
          const dayEvents = eventsByDay[dateKey] || [];
          const today = isToday(day.date);

          return (
            <div
              key={i}
              className={cn(
                "min-h-[120px] bg-[var(--bg-surface)] p-2 transition-all duration-200",
                !day.isCurrentMonth && "bg-[var(--bg-base)]/40 text-[var(--text-tertiary)]",
                day.isCurrentMonth && "hover:bg-[var(--brand-muted)]/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold transition-all",
                    today
                      ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/20 scale-110"
                      : day.isCurrentMonth
                      ? "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                >
                  {day.date.getDate()}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="w-full text-left p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-all shadow-sm hover:shadow-md group relative overflow-hidden"
                    style={{ borderLeft: `4px solid ${event.color || "var(--brand-primary)"}` }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" 
                      style={{ backgroundColor: event.color || "var(--brand-primary)" }}
                    />
                    <p className="text-xs font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] leading-tight">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--text-tertiary)] font-medium">
                      <Clock3 className="h-3 w-3" />
                      <span>
                        {new Intl.DateTimeFormat(locale, {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: false,
                        }).format(new Date(event.starts_at))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
