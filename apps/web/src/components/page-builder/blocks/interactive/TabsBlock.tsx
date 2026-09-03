"use client";

import { useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
import { Textarea, cn } from "@/components/ui";
import { Field, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, parsePairs } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps } from "../../shared/types";

type DisclosureProps = BoxProps & {
  items?: string;
};

export function TabsBlock({
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "20px",
  borderWidth = "1px",
  items = "Tab one::Panel one\n\nTab two::Panel two",
  paddingBottom = "16px",
  paddingLeft = "16px",
  paddingRight = "16px",
  paddingTop = "16px",
  ...props
}: DisclosureProps) {
  const entries = useMemo(
    () => parsePairs(items, [{ content: "Panel one", title: "Tab one" }]),
    [items],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <NodeFrame>
      <div className="grid gap-4" style={buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop })}>
        <div className="flex flex-wrap gap-2">
          {entries.map((item, index) => (
            <button
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                activeIndex === index
                  ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-base)] text-[var(--text-secondary)]",
              )}
              key={`${item.title}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--bg-base)] px-4 py-5 text-sm leading-6 text-[var(--text-secondary)]">
          {entries[activeIndex]?.content}
        </div>
      </div>
    </NodeFrame>
  );
}

function TabsBlockSettings() {
  const {
    actions: { setProp },
    items,
  } = useNode((node) => ({
    items: node.data.props.items,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Items (`Title::Content`)">
        <Textarea
          className="min-h-32"
          onChange={(event) => setProp((props: any) => (props.items = event.target.value))}
          value={items}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

TabsBlock.craft = {
  displayName: "Tabs",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "20px",
      borderWidth: "1px",
      paddingBottom: "16px",
      paddingLeft: "16px",
      paddingRight: "16px",
      paddingTop: "16px",
      width: "100%",
    }),
    items: "Tab one::Panel one\n\nTab two::Panel two",
  },
  related: { settings: TabsBlockSettings },
};
