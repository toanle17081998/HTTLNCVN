"use client";

import { useNode } from "@craftjs/core";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, capSpacing, mobileBoxOverrides, parseNumberLike, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { CSSProperties } from "react";
import type { LayoutBlockProps } from "./SectionBlock";

function getGridStyle(props: LayoutBlockProps) {
  const columns = Math.max(1, parseNumberLike(props.columns, 1));
  return {
    ...buildBoxStyle(props),
    display: "grid",
    gap: withUnitFallback(props.gap, 20),
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } satisfies CSSProperties;
}

export function ColumnsBlock({ children, snapAlign = "none", ...props }: LayoutBlockProps & { snapAlign?: "start" | "center" | "none" }) {
  const isMobile = useIsMobile();
  return (
    <NodeFrame>
      <div
        className="page-builder-columns"
        style={{
          ...getGridStyle(props),
          ...(isMobile
            ? {
              ...mobileBoxOverrides(props),
              gap: capSpacing(props.gap, 16, "16px"),
              gridTemplateColumns: "minmax(0, 1fr)",
            }
            : {}),
          scrollSnapAlign: snapAlign === "none" ? undefined : snapAlign,
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

function ColumnsBlockSettings() {
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
          value={String(columns ?? 2)}
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

ColumnsBlock.craft = {
  displayName: "Columns",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    columns: 2,
    gap: "var(--section-space-md)",
  },
  related: { settings: ColumnsBlockSettings },
};
