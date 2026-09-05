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
  badge = "",
  description = "Ready to take your next step? We would love to connect with you.",
  layout = "center",
  padding = "var(--section-space-lg) var(--section-gutter)",
  title = "Take your next step with us",
  ...props
}: CtaSimpleProps) {
  const {
    actionHref: nodeActionHref,
    actionLabel: nodeActionLabel,
    button1Href,
    button1Label,
    description: nodeDescription,
    layout: nodeLayout,
    sectionDescription,
    sectionTitle,
    title: nodeTitle,
  } = useNode((node) => ({
    actionHref: node.data.props.actionHref,
    actionLabel: node.data.props.actionLabel,
    button1Href: node.data.props.button1Href,
    button1Label: node.data.props.button1Label,
    description: node.data.props.description,
    layout: node.data.props.layout,
    sectionDescription: node.data.props.sectionDescription,
    sectionTitle: node.data.props.sectionTitle,
    title: node.data.props.title,
  }));

  const activeTitle = sectionTitle ?? nodeTitle ?? title;
  const activeDescription = sectionDescription ?? nodeDescription ?? description;
  const activeLabel = button1Label ?? nodeActionLabel ?? actionLabel;
  const activeHref = button1Href ?? nodeActionHref ?? actionHref;
  const activeLayout = nodeLayout ?? layout;

  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const usesDefaultTheme = background === "var(--brand-primary)" || background === "var(--page-builder-cta-bg)";
  const effectiveBackground = usesDefaultTheme ? "var(--page-builder-cta-bg)" : background;

  const buttonElement = (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg px-6 py-3 transition-all duration-300",
        usesDefaultTheme
          ? "cursor-pointer border border-transparent bg-[var(--page-builder-cta-button-bg)] text-[var(--page-builder-cta-button-text)] shadow-md hover:opacity-90"
          : getButtonVariantClass("gold"),
      )}
    >
      {activeLabel}
    </div>
  );

  return (
    <NodeFrame>
      <div
        className={cn(
          "page-builder-cta rounded-2xl",
          usesDefaultTheme
            ? "page-builder-cta-theme text-[var(--page-builder-cta-text)]"
            : "text-[var(--text-inverse)]",
          activeLayout === "split"
            ? "flex flex-col items-center justify-between gap-6 md:flex-row md:text-left"
            : "flex flex-col items-center gap-6 text-center",
        )}
        style={{
          ...buildBoxStyle({ ...props, background: effectiveBackground, padding }),
          width: "100%",
        }}
      >
        <div className={cn("grid gap-2", activeLayout === "split" ? "max-w-xl" : "max-w-2xl justify-items-center")}>
          <h2
            style={{
              fontSize: "var(--section-heading-size)",
              fontWeight: "var(--section-weight-bold)",
              lineHeight: "var(--section-heading-line-height)",
            }}
          >
            {title}
          </h2>
          <p className={cn("text-sm leading-6 md:text-base", usesDefaultTheme ? "text-[var(--page-builder-cta-muted)]" : "text-[var(--text-inverse-muted)]")}>{description}</p>
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
    description,
    layout,
    title,
  } = useNode((node) => ({
    actionHref: node.data.props.actionHref,
    actionLabel: node.data.props.actionLabel,
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
      padding: "var(--section-space-lg) var(--section-gutter)",
      width: "100%",
    }),
    actionHref: "/contact",
    actionLabel: "Get started",
    badge: "",
    description: "Ready to take your next step? We would love to connect with you.",
    layout: "center",
    title: "Take your next step with us",
  },
  related: { settings: CtaSimpleBlockSettings },
};
