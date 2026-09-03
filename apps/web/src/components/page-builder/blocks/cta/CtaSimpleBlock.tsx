"use client";

import { useEditor, useNode } from "@craftjs/core";
import Link from "next/link";
import { Input, Textarea, cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, getButtonVariantClass } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps } from "../../shared/types";

type CtaSimpleProps = BoxProps & {
  actionHref?: string;
  actionLabel?: string;
  badge?: string;
  description?: string;
  layout?: "center" | "split";
  title?: string;
};

export function CtaSimpleBlock({
  actionHref = "/contact",
  actionLabel = "Get started",
  background = "var(--brand-primary)",
  badge = "NEXT STEPS",
  description = "Ready to take your next step? We would love to connect with you.",
  layout = "center",
  padding = "var(--section-space-xl) var(--section-gutter)",
  title = "Take your next step with us",
  ...props
}: CtaSimpleProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  const buttonElement = (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg px-6 py-3 transition-all duration-300",
        getButtonVariantClass("gold"),
      )}
    >
      {actionLabel}
    </div>
  );

  return (
    <NodeFrame>
      <div
        className={cn(
          "rounded-2xl text-[var(--text-inverse)]",
          layout === "split"
            ? "flex flex-col items-center justify-between gap-6 md:flex-row md:text-left"
            : "flex flex-col items-center gap-6 text-center",
        )}
        style={{
          ...buildBoxStyle({ ...props, background, padding }),
          width: "100%",
        }}
      >
        <div className={cn("grid gap-2", layout === "split" ? "max-w-xl" : "max-w-2xl justify-items-center")}>
          {badge ? (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
              {badge}
            </span>
          ) : null}
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h2>
          <p className="text-sm leading-6 text-[var(--text-inverse-muted)] md:text-base">{description}</p>
        </div>

        <div className="shrink-0">
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

function CtaSimpleBlockSettings() {
  const {
    actions: { setProp },
    actionHref,
    actionLabel,
    badge,
    description,
    layout,
    title,
  } = useNode((node) => ({
    actionHref: node.data.props.actionHref,
    actionLabel: node.data.props.actionLabel,
    badge: node.data.props.badge,
    description: node.data.props.description,
    layout: node.data.props.layout,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Layout">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.layout = value))}
          value={layout ?? "center"}
        >
          <option value="center">Centered</option>
          <option value="split">Split (Side by side)</option>
        </NativeSelect>
      </Field>
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

CtaSimpleBlock.craft = {
  displayName: "CTA - Simple Action",
  props: {
    ...defaultBoxProps({
      background: "var(--brand-primary)",
      borderRadius: "24px",
      padding: "var(--section-space-xl) var(--section-gutter)",
      width: "100%",
    }),
    actionHref: "/contact",
    actionLabel: "Get started",
    badge: "NEXT STEPS",
    description: "Ready to take your next step? We would love to connect with you.",
    layout: "center",
    title: "Take your next step with us",
  },
  related: { settings: CtaSimpleBlockSettings },
};
