"use client";

import { useEditor, useNode } from "@craftjs/core";
import Link from "next/link";
import { Input, cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, getButtonVariantClass, resolveStyleToken, type ButtonVariant } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { Align, BoxProps } from "../../shared/types";

type ButtonProps = BoxProps & {
  align?: Align;
  href?: string;
  label?: string;
  target?: "_self" | "_blank";
  variant?: ButtonVariant;
};

export function ButtonBlock({
  align = "left",
  href = "#",
  label = "Call to Action",
  target = "_self",
  variant = "primary",
  ...props
}: ButtonProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  const variantClass = getButtonVariantClass(variant);
  const boxStyle = buildBoxStyle(props);

  if (props.background === "transparent" || !props.background) {
    delete boxStyle.background;
  }
  if (props.borderColor === "transparent" || !props.borderColor) {
    delete boxStyle.borderColor;
  }
  if (props.borderWidth === "0" || props.borderWidth === 0 || !props.borderWidth) {
    delete boxStyle.borderWidth;
    delete boxStyle.borderStyle;
  }

  const buttonElement = (
    <div
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-300",
        variantClass,
      )}
      style={{
        ...boxStyle,
        borderRadius: resolveStyleToken(props.borderRadius ?? "var(--section-radius-button)"),
        padding: props.padding || "0.75rem 1.5rem",
      }}
    >
      {label}
    </div>
  );

  return (
    <NodeFrame>
      <div
        className="page-builder-button-wrapper flex"
        style={{
          justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
          width: "100%",
        }}
      >
        {enabled ? (
          buttonElement
        ) : (
          <Link href={href || "#"} target={target}>
            {buttonElement}
          </Link>
        )}
      </div>
    </NodeFrame>
  );
}

function ButtonBlockSettings() {
  const {
    actions: { setProp },
    align,
    href,
    label,
    target,
    variant,
  } = useNode((node) => ({
    align: node.data.props.align,
    href: node.data.props.href,
    label: node.data.props.label,
    target: node.data.props.target,
    variant: node.data.props.variant,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Button text">
        <Input
          onChange={(event) => setProp((props: any) => (props.label = event.target.value))}
          value={label}
        />
      </Field>
      <Field label="Link URL">
        <Input
          onChange={(event) => setProp((props: any) => (props.href = event.target.value))}
          value={href}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Style">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.variant = value))}
            value={variant ?? "primary"}
          >
            <option value="primary">Brand Primary</option>
            <option value="secondary">Surface Secondary</option>
            <option value="gold">Accent Gold</option>
            <option value="ghost">Ghost Outline</option>
          </NativeSelect>
        </Field>
        <Field label="Alignment">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.align = value))}
            value={align ?? "left"}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Open in">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.target = value))}
          value={target ?? "_self"}
        >
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

ButtonBlock.craft = {
  displayName: "Button",
  props: {
    ...defaultBoxProps({
      borderRadius: "var(--section-radius-button)",
      padding: "0.75rem 1.5rem",
      width: "auto",
    }),
    align: "left",
    href: "#",
    label: "Call to Action",
    target: "_self",
    variant: "primary",
  },
  related: { settings: ButtonBlockSettings },
};
