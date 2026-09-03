"use client";

import { useNode } from "@craftjs/core";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, capSpacing, mobileBoxOverrides, parseNumberLike, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps, SizeValue } from "../../shared/types";
import type { CSSProperties, ReactNode } from "react";

export type LayoutBlockProps = BoxProps & {
  children?: ReactNode;
  columns?: number | string;
  gap?: SizeValue;
  sectionName?: string;
};

function getGridStyle(props: LayoutBlockProps) {
  const columns = Math.max(1, parseNumberLike(props.columns, 1));
  return {
    ...buildBoxStyle(props),
    display: "grid",
    gap: withUnitFallback(props.gap, 20),
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } satisfies CSSProperties;
}

export function SectionBlock({ children, snapAlign = "none", ...props }: LayoutBlockProps & { snapAlign?: "start" | "center" | "none" }) {
  const isMobile = useIsMobile();
  const sectionStyle = buildBoxStyle(props);
  const hasExplicitBackground = Boolean(props.backgroundImage) ||
    (Boolean(props.background) && props.background !== "transparent" && props.background !== "var(--bg-surface)");
  const contentProps = {
    ...props,
    background: "transparent",
    backgroundImage: "",
    borderColor: "transparent",
    borderWidth: "var(--section-space-none)",
    margin: "0 auto",
    maxWidth: "var(--section-width)",
    width: "100%",
  };

  return (
    <NodeFrame>
      <section
        className="page-builder-section"
        style={{
          ...sectionStyle,
          background: hasExplicitBackground ? sectionStyle.background : "var(--section-row-background, var(--section-bg-primary))",
          margin: 0,
          maxWidth: "100%",
          padding: 0,
          width: "100%",
        }}
      >
        <div
          className="page-builder-section-content"
          style={{
            ...getGridStyle(contentProps),
            ...(isMobile
              ? {
                ...mobileBoxOverrides(contentProps),
                gap: capSpacing(props.gap, 16, "16px"),
                gridTemplateColumns: "minmax(0, 1fr)",
              }
              : {}),
          }}
        >
          {children}
        </div>
      </section>
    </NodeFrame>
  );
}

function SectionBlockSettings() {
  const {
    actions: { setProp },
    columns,
    gap,
  } = useNode((node) => ({
    columns: node.data.props.columns,
    gap: node.data.props.gap,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Columns">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.columns = Number(value)))}
          value={String(columns ?? 1)}
        >
          <option value="1">1 Column</option>
          <option value="2">2 Columns</option>
          <option value="3">3 Columns</option>
          <option value="4">4 Columns</option>
        </NativeSelect>
      </Field>
      <Field label="Gap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.gap = value))}
          value={String(gap ?? "var(--section-space-md)")}
        >
          <option value="var(--section-space-none)">None (0)</option>
          <option value="var(--section-space-xs)">Extra Small (12px)</option>
          <option value="var(--section-space-sm)">Small (16px)</option>
          <option value="var(--section-space-md)">Medium (24px)</option>
          <option value="var(--section-space-lg)">Large (40px)</option>
          <option value="var(--section-space-xl)">Extra Large (clamp)</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

SectionBlock.craft = {
  displayName: "Section",
  props: {
    ...defaultBoxProps({
      background: "var(--section-row-background, var(--section-bg-primary))",
      padding: "var(--section-space-xl) var(--section-gutter)",
      width: "100%",
    }),
    columns: 1,
    gap: "var(--section-space-md)",
    sectionName: "Custom Section",
  },
  related: { settings: SectionBlockSettings },
};
