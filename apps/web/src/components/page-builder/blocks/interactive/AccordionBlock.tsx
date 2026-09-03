"use client";

import { useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
import { Textarea } from "@/components/ui";
import { Field, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, parsePairs } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps } from "../../shared/types";

type DisclosureProps = BoxProps & {
  items?: string;
};

export function AccordionBlock({
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "20px",
  borderWidth = "1px",
  items = "Question one::Answer one\n\nQuestion two::Answer two",
  paddingBottom = "12px",
  paddingLeft = "12px",
  paddingRight = "12px",
  paddingTop = "12px",
  ...props
}: DisclosureProps) {
  const entries = useMemo(
    () => parsePairs(items, [{ content: "Answer one", title: "Question one" }]),
    [items],
  );
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <NodeFrame>
      <div className="grid gap-3" style={buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop })}>
        {entries.map((item, index) => (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]" key={`${item.title}-${index}`}>
            <button
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]"
              onClick={() => setOpenIndex(index)}
              type="button"
            >
              <span>{item.title}</span>
              <span>{openIndex === index ? "-" : "+"}</span>
            </button>
            {openIndex === index ? (
              <div className="px-4 pb-4 text-sm leading-6 text-[var(--text-secondary)]">{item.content}</div>
            ) : null}
          </div>
        ))}
      </div>
    </NodeFrame>
  );
}

function AccordionBlockSettings() {
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

AccordionBlock.craft = {
  displayName: "Accordion",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "20px",
      borderWidth: "1px",
      paddingBottom: "12px",
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "12px",
      width: "100%",
    }),
    items: "Question one::Answer one\n\nQuestion two::Answer two",
  },
  related: { settings: AccordionBlockSettings },
};
