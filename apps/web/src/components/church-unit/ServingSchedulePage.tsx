"use client";

import { Text, Button, Card, FormField, Input, Select, cn } from "@/components/ui";
import { useMemo, useState } from "react";
import { CalendarDays, Music4, RefreshCw, Sparkles, Trash2, Users } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useChurchUnitsQuery,
  type ChurchUnit,
} from "@/hooks/church-unit";
import {
  useGenerateServingSchedulesMutation,
  useServingPlannerQuery,
  useUpdateServingScheduleMutation,
  useUpsertServingProfilesMutation,
  type ServingPlanner,
  type ServingScheduleType,
  type WorshipSkill,
} from "@/hooks/serving-schedule";

const WORSHIP_SKILLS: WorshipSkill[] = ["guitar", "drum", "bass", "sing", "organ"];
const WORSHIP_ROLES = ["guitar", "drum", "bass", "sing", "organ"];

function nextSundayInput() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

type ServingSchedulePageProps = {
  type: ServingScheduleType;
};

export function ServingSchedulePage({ type }: ServingSchedulePageProps) {
  const { t, locale } = useTranslation();
  const { can, isAuthenticated } = useAuth();
  const { toast } = useFeedback();
  const canManage = can(PERMISSIONS.manageChurchUnits);
  const unitsQuery = useChurchUnitsQuery({ skip: 0, take: 200 }, isAuthenticated && canManage);
  const teamUnits = useMemo(() => {
    const items = unitsQuery.data?.items ?? [];
    if (type === "worship") {
      return items.filter((unit) => unit.type === "praise_worship" || unit.type === "team");
    }
    if (type === "cleaning") {
      return items.filter((unit) => unit.type === "care_team" || unit.type === "team");
    }
    return [];
  }, [unitsQuery.data?.items, type]);
  const [churchUnitId, setChurchUnitId] = useState("");
  const [startDate, setStartDate] = useState(nextSundayInput());
  const [weeks, setWeeks] = useState("8");
  const plannerQuery = useServingPlannerQuery(churchUnitId, type, isAuthenticated && canManage);
  const saveProfiles = useUpsertServingProfilesMutation();
  const generateSchedules = useGenerateServingSchedulesMutation();
  const updateSchedule = useUpdateServingScheduleMutation();
  const planner = plannerQuery.data;

  function handleGenerate() {
    if (!churchUnitId) return;
    generateSchedules.mutate(
      {
        church_unit_id: churchUnitId,
        start_date: startDate,
        type,
        weeks: Number(weeks) || 8,
      },
      {
        onSuccess() {
          toast({
            title: t("serving.schedule.generatedSuccess", {
              type: type === "worship" ? t("serving.schedule.worship.title") : t("serving.schedule.cleaning.title")
            }),
            variant: "success",
          });
        },
      },
    );
  }

  function toggleSkill(memberId: string, skill: WorshipSkill) {
    if (!planner) return;
    const profile = planner.members.find((member) => member.id === memberId);
    if (!profile) return;
    const nextSkills = profile.skills.includes(skill)
      ? profile.skills.filter((item) => item !== skill)
      : [...profile.skills, skill];

    saveProfiles.mutate({
      church_unit_id: planner.church_unit.id,
      profiles: [{ skills: nextSkills as WorshipSkill[], user_id: memberId }],
    });
  }

  function updateAssignment(
    scheduleId: string,
    role: string,
    slotIndex: number,
    userId: string,
    plannerState: ServingPlanner | undefined,
  ) {
    if (!plannerState) return;
    const schedule = plannerState.schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;

    const assignments = schedule.assignments.map((assignment) =>
      assignment.role === role && assignment.slot_index === slotIndex
        ? { role, slot_index: slotIndex, user_id: userId }
        : {
            role: assignment.role,
            slot_index: assignment.slot_index,
            user_id: assignment.user.id,
          },
    );

    updateSchedule.mutate(
      { dto: { assignments }, id: scheduleId },
      {
        onSuccess() {
          toast({ title: t("serving.schedule.updatedSuccess"), variant: "success" });
        },
      },
    );
  }

  function renderWorshipSkills() {
    if (!planner || type !== "worship") return null;

    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Music4 className="h-5 w-5 text-[var(--brand-primary)]" />
          <div>
            <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">{t("serving.schedule.memberSkills")}</Text>
            <Text variant="small">
              {t("serving.schedule.memberSkillsHelp")}
            </Text>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-secondary)]">
                <th className="py-2 pr-4">{t("serving.schedule.member")}</th>
                {WORSHIP_SKILLS.map((skill) => (
                  <th className="py-2 pr-4 capitalize" key={skill}>
                    {t(`serving.schedule.skill.${skill}`) || skill}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planner.members.map((member) => (
                <tr className="border-t border-[var(--border-subtle)]" key={member.id}>
                  <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                    {member.display_name}
                  </td>
                  {WORSHIP_SKILLS.map((skill) => (
                    <td className="py-3 pr-4" key={skill}>
                      <Input
                        checked={member.skills.includes(skill)}
                        onChange={() => toggleSkill(member.id, skill)}
                        type="checkbox"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function renderScheduleCard(schedule: ServingPlanner["schedules"][number]) {
    const slots =
      type === "worship"
        ? WORSHIP_ROLES.map((role) => ({
            assignment:
              schedule.assignments.find((item) => item.role === role && item.slot_index === 0) ?? null,
            label: t(`serving.schedule.skill.${role}` as any) || role,
            role,
            slotIndex: 0,
          }))
        : Array.from({ length: Math.max(schedule.assignments.length, 4) }, (_, index) => ({
            assignment: schedule.assignments.find((item) => item.slot_index === index) ?? null,
            label: `${t("serving.schedule.member")} ${index + 1}`,
            role: "member",
            slotIndex: index,
          }));

    return (
      <Card className="p-5" key={schedule.id}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">{formatDate(schedule.service_date, locale)}</Text>
            <Text variant="small">
              {type === "worship" ? t("serving.schedule.worshipTeamAllocation") : t("serving.schedule.cleaningTeamAllocation")}
            </Text>
          </div>
          <CalendarDays className="h-5 w-5 text-[var(--brand-primary)]" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {slots.map((slot) => (
            <FormField key={`${slot.role}-${slot.slotIndex}`} label={slot.label}>
              <Select
                onChange={(event) =>
                  updateAssignment(schedule.id, slot.role, slot.slotIndex, event.target.value, planner)
                }
                value={slot.assignment?.user.id ?? ""}
              >
                <option value="">{t("serving.schedule.unassigned")}</option>
                {(planner?.members ?? []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name}
                  </option>
                ))}
              </Select>
            </FormField>
          ))}
        </div>
      </Card>
    );
  }

  const title = type === "worship" ? t("serving.schedule.worship.title") : t("serving.schedule.cleaning.title");
  const description =
    type === "worship"
      ? t("serving.schedule.worship.desc")
      : t("serving.schedule.cleaning.desc");

  return (
    <PageLayout description={description} eyebrow={t("serving.schedule.eyebrow")} title={title}>
      {!canManage ? (
        <Card className="p-5">
          <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">{t("serving.schedule.restricted.title")}</Text>
          <Text className="mt-1" variant="small">
            {t("serving.schedule.restricted.desc")}
          </Text>
        </Card>
      ) : (
        <div className="grid gap-5">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField label={t("serving.schedule.form.churchUnit")}>
                <Select onChange={(event) => setChurchUnitId(event.target.value)} value={churchUnitId}>
                  <option value="">{t("serving.schedule.form.selectTeam")}</option>
                  {teamUnits.map((unit: ChurchUnit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("serving.schedule.form.startDate")}>
                <Input onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
              </FormField>
              <FormField label={t("serving.schedule.form.weeks")}>
                <Input onChange={(event) => setWeeks(event.target.value)} type="number" value={weeks} />
              </FormField>
              <div className="flex items-end gap-2">
                <Button className="flex-1" onClick={handleGenerate}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("serving.schedule.form.generate")}
                </Button>
                <Button onClick={() => plannerQuery.refetch()} variant="secondary">
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      plannerQuery.isFetching || unitsQuery.isFetching ? "animate-spin" : "",
                    )}
                  />
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold text-[var(--text-secondary)]">{t("serving.schedule.stats.members")}</Text>
              <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {planner?.members.length ?? 0}
              </Text>
            </Card>
            <Card className="p-5">
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold text-[var(--text-secondary)]">{t("serving.schedule.stats.scheduledWeeks")}</Text>
              <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                {planner?.schedules.length ?? 0}
              </Text>
            </Card>
            <Card className="p-5">
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold text-[var(--text-secondary)]">{t("serving.schedule.stats.mode")}</Text>
              <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-3xl font-semibold capitalize text-[var(--text-primary)]">{type}</Text>
            </Card>
          </div>

          {renderWorshipSkills()}

          {plannerQuery.error ? (
            <Card className="p-5">
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-medium text-[var(--status-danger)]">
                {plannerQuery.error instanceof Error ? plannerQuery.error.message : t("serving.schedule.requestFailed")}
              </Text>
            </Card>
          ) : null}

          <div className="grid gap-4">
            {(planner?.schedules ?? []).map(renderScheduleCard)}
            {!plannerQuery.isLoading && planner && planner.schedules.length === 0 ? (
              <Card className="p-5">
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  {type === "worship" ? <Music4 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  <Text as="p" tone="inherit" variant="inherit">{t("serving.schedule.empty")}</Text>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
