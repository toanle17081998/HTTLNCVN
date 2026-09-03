"use client";

import { useNode } from "@craftjs/core";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, capSpacing, mobileBoxOverrides, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps, SizeValue } from "../../shared/types";
import type { CSSProperties, ReactNode } from "react";

export type StackProps = BoxProps & {
  alignItems?: CSSProperties["alignItems"];
  children?: ReactNode;
  gap?: SizeValue;
  justifyContent?: CSSProperties["justifyContent"];
  mobileAlignItems?: CSSProperties["alignItems"];
  wrap?: boolean;
};

export function RowBlock({ children, ...props }: StackProps) {
  const isMobile = useIsMobile();
  return (
    <NodeFrame>
      <div
        className="page-builder-row"
        style={{
          ...buildBoxStyle(props),
          alignItems: isMobile && props.mobileAlignItems ? props.mobileAlignItems : props.alignItems ?? "center",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: props.wrap ? "wrap" : "nowrap",
          gap: isMobile ? capSpacing(props.gap, 16, "var(--section-space-xs)") : withUnitFallback(props.gap, 16),
          justifyContent: props.justifyContent ?? "flex-start",
          ...(isMobile ? mobileBoxOverrides(props) : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

function RowBlockSettings() {
  const {
    actions: { setProp },
    alignItems,
    gap,
    justifyContent,
    wrap,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    gap: node.data.props.gap,
    justifyContent: node.data.props.justifyContent,
    wrap: node.data.props.wrap,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Align items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.alignItems = value))}
          value={String(alignItems ?? "center")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </NativeSelect>
      </Field>
      <Field label="Justify content">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.justifyContent = value))}
          value={String(justifyContent ?? "flex-start")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
        </NativeSelect>
      </Field>
      <Field label="Gap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.gap = value))}
          value={String(gap ?? "var(--section-space-sm)")}
        >
          <option value="var(--section-space-none)">None (0)</option>
          <option value="var(--section-space-xs)">Extra Small (12px)</option>
          <option value="var(--section-space-sm)">Small (16px)</option>
          <option value="var(--section-space-md)">Medium (24px)</option>
          <option value="var(--section-space-lg)">Large (40px)</option>
        </NativeSelect>
      </Field>
      <Field label="Wrap items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.wrap = value === "true"))}
          value={String(Boolean(wrap))}
        >
          <option value="false">No wrap</option>
          <option value="true">Wrap</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

RowBlock.craft = {
  displayName: "Row",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    alignItems: "center",
    gap: "var(--section-space-sm)",
    justifyContent: "flex-start",
    wrap: false,
  },
  related: { settings: RowBlockSettings },
};

export function VerticalStackBlock({ children, ...props }: StackProps) {
  const isMobile = useIsMobile();
  return (
    <NodeFrame>
      <div
        className="page-builder-stack"
        style={{
          ...buildBoxStyle(props),
          alignItems: isMobile && props.mobileAlignItems ? props.mobileAlignItems : props.alignItems ?? "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? capSpacing(props.gap, 16, "var(--section-space-xs)") : withUnitFallback(props.gap, 16),
          justifyContent: props.justifyContent ?? "flex-start",
          ...(isMobile ? mobileBoxOverrides(props) : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

function VerticalStackBlockSettings() {
  const {
    actions: { setProp },
    alignItems,
    gap,
    justifyContent,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    gap: node.data.props.gap,
    justifyContent: node.data.props.justifyContent,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Align items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.alignItems = value))}
          value={String(alignItems ?? "flex-start")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </NativeSelect>
      </Field>
      <Field label="Justify content">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.justifyContent = value))}
          value={String(justifyContent ?? "flex-start")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
        </NativeSelect>
      </Field>
      <Field label="Gap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.gap = value))}
          value={String(gap ?? "var(--section-space-sm)")}
        >
          <option value="var(--section-space-none)">None (0)</option>
          <option value="var(--section-space-xs)">Extra Small (12px)</option>
          <option value="var(--section-space-sm)">Small (16px)</option>
          <option value="var(--section-space-md)">Medium (24px)</option>
          <option value="var(--section-space-lg)">Large (40px)</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

VerticalStackBlock.craft = {
  displayName: "Vertical Stack",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    alignItems: "flex-start",
    gap: "var(--section-space-sm)",
    justifyContent: "flex-start",
  },
  related: { settings: VerticalStackBlockSettings },
};
