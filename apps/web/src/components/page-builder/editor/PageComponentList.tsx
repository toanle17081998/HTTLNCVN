"use client";

import { useMemo } from "react";
import { useEditor } from "@craftjs/core";
import { Layers3, Trash2 } from "lucide-react";

type PageComponentNode = {
  data: {
    displayName?: string;
    linkedNodes?: Record<string, string>;
    nodes?: string[];
    props?: Record<string, unknown>;
  };
};

export function PageComponentList() {
  const { actions, nodes } = useEditor((state: any) => ({
    nodes: state.nodes as Record<string, PageComponentNode>,
  }));

  const components = useMemo(() => (nodes.ROOT?.data.nodes ?? []).map((id, index) => ({
    id,
    label: String(nodes[id]?.data.props?.sectionName ?? `Section ${index + 1}`),
  })), [nodes]);

  return (
    <div className="grid gap-2 border-t border-[var(--border-subtle)] pt-3">
      <p className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        <Layers3 className="h-3.5 w-3.5" />
        Current sections
      </p>
      <div className="grid gap-0.5">
        {components.map((component) => (
          <div className="flex min-h-9 items-center gap-1 px-2 text-xs text-[var(--text-secondary)]" key={component.id}>
            <span className="min-w-0 flex-1 truncate">{component.label}</span>
            <button
              aria-label={`Remove ${component.label}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)]"
              onClick={() => actions.delete(component.id)}
              title={`Remove ${component.label}`}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
