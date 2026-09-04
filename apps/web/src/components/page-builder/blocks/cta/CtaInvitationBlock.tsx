"use client";

import { useEditor, useNode } from "@craftjs/core";
import Link from "next/link";
import { Input, Textarea } from "@/components/ui";
import { Field, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, getButtonVariantClass } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import { cn } from "@/components/ui";
import type { BoxProps, CtaScheduleItem } from "../../shared/types";

const defaultCtaSchedules: CtaScheduleItem[] = [
  { description: "Prayer & Fellowship", time: "08:00 AM", title: "Early Gathering" },
  { description: "Worship & Word with Kids Ministry", time: "10:00 AM", title: "Main Service" },
  { description: "Youth & Young Adults", time: "06:00 PM", title: "Evening Gathering" },
];

type CtaInvitationProps = BoxProps & {
  actionHref?: string;
  actionLabel?: string;
  badge?: string;
  description?: string;
  schedules?: CtaScheduleItem[];
  title?: string;
};

export function CtaInvitationBlock({
  actionHref = "/contact",
  actionLabel = "Plan a visit",
  background = "var(--brand-primary)",
  badge = "WORSHIP WITH US",
  description = "Join us this Sunday in person or online. We would love to welcome you and your family.",
  padding = "var(--section-space-xl) var(--section-gutter)",
  schedules = defaultCtaSchedules,
  title = "You belong here",
  ...props
}: CtaInvitationProps) {
  const {
    actionHref: nodeActionHref,
    actionLabel: nodeActionLabel,
    badge: nodeBadge,
    button1Href,
    button1Label,
    description: nodeDescription,
    items,
    schedules: nodeSchedules,
    sectionDescription,
    sectionTitle,
    title: nodeTitle,
  } = useNode((node) => ({
    actionHref: node.data.props.actionHref,
    actionLabel: node.data.props.actionLabel,
    badge: node.data.props.badge,
    button1Href: node.data.props.button1Href,
    button1Label: node.data.props.button1Label,
    description: node.data.props.description,
    items: node.data.props.items,
    schedules: node.data.props.schedules,
    sectionDescription: node.data.props.sectionDescription,
    sectionTitle: node.data.props.sectionTitle,
    title: node.data.props.title,
  }));

  const activeTitle = sectionTitle ?? nodeTitle ?? title;
  const activeDescription = sectionDescription ?? nodeDescription ?? description;
  const activeBadge = nodeBadge ?? badge;
  const activeLabel = button1Label ?? nodeActionLabel ?? actionLabel;
  const activeHref = button1Href ?? nodeActionHref ?? actionHref;
  const rawList = items || nodeSchedules || schedules;
  const scheduleList = Array.isArray(rawList) && rawList.length ? rawList : defaultCtaSchedules;

  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  const buttonElement = (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg px-6 py-3 transition-all duration-300",
        getButtonVariantClass("gold"),
      )}
    >
      {activeLabel}
    </div>
  );

  return (
    <NodeFrame>
      <div
        className="flex flex-col items-center gap-8 rounded-2xl text-center text-[var(--text-inverse)]"
        style={{
          ...buildBoxStyle({ ...props, background, padding }),
          width: "100%",
        }}
      >
        <div className="grid max-w-2xl justify-items-center gap-3">
          {activeBadge ? (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
              {activeBadge}
            </span>
          ) : null}
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">{activeTitle}</h2>
          <p className="text-sm leading-7 text-[var(--text-black)] md:text-base">{activeDescription}</p>
        </div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {scheduleList.map((item, index) => (
            <div
              className="flex flex-col justify-between gap-2 rounded-xl border p-4 text-left backdrop-blur-sm"
              key={index}
              style={{
                backgroundColor: "#122744",
                borderColor: "rgba(255 255 255 / 0.2)",
              }}
            >
              <div className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">{item.time}</span>
                <span className="font-semibold text-[var(--text-white)]">{item.title}</span>
              </div>
              <p className="text-xs text-[var(--text-white)] opacity-75">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          {enabled ? (
            buttonElement
          ) : (
            <Link href={actionHref || "#"}>
              {buttonElement}
            </Link>
          )}
        </div>
      </div>
    </NodeFrame>
  );
}

function CtaInvitationBlockSettings() {
  const {
    actions: { setProp },
    actionHref,
    actionLabel,
    badge,
    description,
    title,
  } = useNode((node) => ({
    actionHref: node.data.props.actionHref,
    actionLabel: node.data.props.actionLabel,
    badge: node.data.props.badge,
    description: node.data.props.description,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Badge kicker">
        <Input
          onChange={(event) => setProp((props: any) => (props.badge = event.target.value))}
          value={badge ?? ""}
        />
      </Field>
      <Field label="Title">
        <Input
          onChange={(event) => setProp((props: any) => (props.title = event.target.value))}
          value={title ?? ""}
        />
      </Field>
      <Field label="Description">
        <Textarea
          className="min-h-20"
          onChange={(event) => setProp((props: any) => (props.description = event.target.value))}
          value={description ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Button text">
          <Input
            onChange={(event) => setProp((props: any) => (props.actionLabel = event.target.value))}
            value={actionLabel ?? ""}
          />
        </Field>
        <Field label="Button link">
          <Input
            onChange={(event) => setProp((props: any) => (props.actionHref = event.target.value))}
            value={actionHref ?? ""}
          />
        </Field>
      </div>
      <BoxSettings />
    </div>
  );
}

CtaInvitationBlock.craft = {
  displayName: "CTA - Gathering Invitation",
  props: {
    ...defaultBoxProps({
      background: "var(--brand-primary)",
      borderRadius: "24px",
      padding: "var(--section-space-xl) var(--section-gutter)",
      width: "100%",
    }),
    actionHref: "/contact",
    actionLabel: "Plan a visit",
    badge: "WORSHIP WITH US",
    description: "Join us this Sunday in person or online. We would love to welcome you and your family.",
    schedules: defaultCtaSchedules,
    title: "You belong here",
  },
  related: { settings: CtaInvitationBlockSettings },
};
