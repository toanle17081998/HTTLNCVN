"use client";

import { useContext, useMemo } from "react";
import { useEditor } from "@craftjs/core";
import { Layers3, Plus, Trash2 } from "lucide-react";
import { SectionInsertContext } from "../shared/NodeFrame";

type PageComponentNode = {
  data: {
    displayName?: string;
    linkedNodes?: Record<string, string>;
    nodes?: string[];
    props?: Record<string, unknown>;
  };
};

export function PageComponentList() {
  const openSectionPicker = useContext(SectionInsertContext);
  const { actions, nodes } = useEditor((state: any) => ({
    nodes: state.nodes as Record<string, PageComponentNode>,
  }));

  const components = useMemo(() => (nodes.ROOT?.data.nodes ?? []).map((id, index) => ({
    id,
    label: String(nodes[id]?.data.props?.sectionName ?? `Section ${index + 1}`),
  })), [nodes]);

  return (
    <div className="grid gap-2 border-t border-[var(--border-subtle)] pt-3">
      <div className="flex items-center justify-between px-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          <Layers3 className="h-3.5 w-3.5" />
          Sections
        </p>
        {openSectionPicker ? (
          <button
            className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-muted)] px-2 py-0.5 text-xs font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)] cursor-pointer"
            onClick={() => openSectionPicker((nodes.ROOT?.data.nodes ?? []).length)}
            type="button"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        ) : null}
      </div>
      <div className="grid gap-0.5">
        {components.map((component) => (
          <div className="flex min-h-9 items-center gap-1 px-2 text-xs text-[var(--text-secondary)]" key={component.id}>
            <span className="min-w-0 flex-1 truncate">{component.label}</span>
            <button
              aria-label={`Remove ${component.label}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)] cursor-pointer"
              onClick={() => actions.delete(component.id)}
              title={`Remove ${component.label}`}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {components.length === 0 && openSectionPicker ? (
          <button
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-strong)] p-3 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] cursor-pointer"
            onClick={() => openSectionPicker(0)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            Add first section
          </button>
        ) : null}
      </div>
    </div>
  );
}
