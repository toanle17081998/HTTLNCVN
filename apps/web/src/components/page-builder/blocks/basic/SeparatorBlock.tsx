"use client";

import { useNode } from "@craftjs/core";
import { Input } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, resolveStyleToken, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps, SizeValue } from "../../shared/types";

type SeparatorProps = BoxProps & {
  color?: string;
  size?: SizeValue;
  style?: "solid" | "dashed" | "dotted";
};

export function SeparatorBlock({
  color = "var(--border-subtle)",
  size = "1px",
  style = "solid",
  ...props
}: SeparatorProps) {
  return (
    <NodeFrame>
      <div
        className="page-builder-separator py-4"
        style={{
          ...buildBoxStyle(props),
          width: "100%",
        }}
      >
        <hr
          style={{
            border: 0,
            borderTopColor: resolveStyleToken(color),
            borderTopStyle: style,
            borderTopWidth: withUnitFallback(size, "1px"),
            margin: 0,
            width: "100%",
          }}
        />
      </div>
    </NodeFrame>
  );
}

function SeparatorBlockSettings() {
  const {
    actions: { setProp },
    color,
    size,
    style,
  } = useNode((node) => ({
    color: node.data.props.color,
    size: node.data.props.size,
    style: node.data.props.style,
  }));

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Thickness">
          <Input
            onChange={(event) => setProp((props: any) => (props.size = event.target.value))}
            value={String(size ?? "1px")}
          />
        </Field>
        <Field label="Style">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.style = value))}
            value={style ?? "solid"}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Color">
        <Input
          onChange={(event) => setProp((props: any) => (props.color = event.target.value))}
          value={String(color ?? "var(--border-subtle)")}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

SeparatorBlock.craft = {
  displayName: "Separator",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    color: "var(--border-subtle)",
    size: "1px",
    style: "solid",
  },
  related: { settings: SeparatorBlockSettings },
};
