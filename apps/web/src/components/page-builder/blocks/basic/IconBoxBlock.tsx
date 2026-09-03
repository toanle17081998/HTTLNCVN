"use client";

import { useEditor, useNode } from "@craftjs/core";
import { Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, resolveStyleToken, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import { IconPicker, featureIconMap, resolveIcon } from "../../shared/iconList";
import type { BoxProps, SizeValue } from "../../shared/types";
import type { CSSProperties } from "react";

export { featureIconMap, resolveIcon };

type IconBoxProps = BoxProps & {
  alignItems?: CSSProperties["alignItems"];
  description?: string;
  icon?: keyof typeof featureIconMap | string;
  iconColor?: string;
  iconSize?: SizeValue;
  justifyContent?: CSSProperties["justifyContent"];
  removable?: boolean;
  title?: string;
};

export function IconBoxBlock({
  alignItems = "flex-start",
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "20px",
  borderWidth = "1px",
  description = "A warm, welcoming description explaining this feature in meaningful detail.",
  icon = "users",
  iconColor = "var(--brand-primary)",
  iconSize = "32px",
  justifyContent = "flex-start",
  paddingBottom = "24px",
  paddingLeft = "24px",
  paddingRight = "24px",
  paddingTop = "24px",
  removable = false,
  title = "Feature Highlight",
  ...props
}: IconBoxProps) {
  const { id } = useNode();
  const { actions, enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const FeatureIcon = resolveIcon(icon);

  return (
    <NodeFrame>
      <div
        className="relative flex flex-col"
        style={{
          ...buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop }),
          alignItems,
          gap: "var(--section-space-xs)",
          justifyContent,
          textAlign: alignItems === "center" ? "center" : alignItems === "flex-end" ? "right" : "left",
        }}
      >
        <div style={{ color: resolveStyleToken(iconColor), fontSize: withUnitFallback(iconSize), lineHeight: 1 }}>
          <FeatureIcon style={{ height: withUnitFallback(iconSize), width: withUnitFallback(iconSize) }} />
        </div>
        <h3 style={{ color: "var(--text-primary)", fontSize: "var(--section-card-title-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>{title}</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>{description}</p>
        {enabled && removable ? <button aria-label="Remove feature" className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--status-danger)] shadow-md" onClick={(event) => { event.stopPropagation(); actions.delete(id); }} type="button"><Trash2 className="h-4 w-4" /></button> : null}
      </div>
    </NodeFrame>
  );
}

function IconBoxBlockSettings() {
  const {
    actions: { setProp },
    alignItems,
    description,
    icon,
    iconColor,
    iconSize,
    title,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    description: node.data.props.description,
    icon: node.data.props.icon,
    iconColor: node.data.props.iconColor,
    iconSize: node.data.props.iconSize,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Choose Icon">
        <IconPicker
          onChange={(newIcon) => setProp((props: any) => (props.icon = newIcon))}
          value={icon ?? "users"}
        />
      </Field>
      <Field label="Title">
        <Input
          onChange={(event) => setProp((props: any) => (props.title = event.target.value))}
          value={title}
        />
      </Field>
      <Field label="Description">
        <Textarea
          className="min-h-24"
          onChange={(event) => setProp((props: any) => (props.description = event.target.value))}
          value={description}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Icon size">
          <Input
            onChange={(event) => setProp((props: any) => (props.iconSize = event.target.value))}
            value={String(iconSize ?? "32px")}
          />
        </Field>
        <Field label="Alignment">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.alignItems = value))}
            value={String(alignItems ?? "flex-start")}
          >
            <option value="flex-start">Left</option>
            <option value="center">Center</option>
            <option value="flex-end">Right</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Icon color">
        <Input
          onChange={(event) => setProp((props: any) => (props.iconColor = event.target.value))}
          value={String(iconColor ?? "var(--brand-primary)")}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

IconBoxBlock.craft = {
  displayName: "Icon Feature Box",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "20px",
      borderWidth: "1px",
      paddingBottom: "24px",
      paddingLeft: "24px",
      paddingRight: "24px",
      paddingTop: "24px",
      width: "100%",
    }),
    alignItems: "flex-start",
    description: "A warm, welcoming description explaining this feature in meaningful detail.",
    icon: "users",
    iconColor: "var(--brand-primary)",
    iconSize: "32px",
    title: "Feature Highlight",
  },
  related: { settings: IconBoxBlockSettings },
};
