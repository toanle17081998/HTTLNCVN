"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@craftjs/core";
import { Trash2, X } from "lucide-react";
import { cn } from "@/components/ui";
import { EditorBreakpointContext } from "../shared/NodeFrame";
import type { EditorBreakpoint } from "../shared/types";

export function RenderNodeSettings() {
  const { actions, query, selectedId, settings: SettingsComponent, displayName } = useEditor(
    (state: any, query) => {
      const id = Array.from(state.events.selected || [])[0] as string | undefined;
      if (!id) return { displayName: null, selectedId: null, settings: null };
      const node = query.node(id).get();
      return {
        displayName: node.data.displayName,
        selectedId: id,
        settings: node.related?.settings ?? null,
      };
    },
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<EditorBreakpoint>("desktop");

  useEffect(() => {
    if (selectedId) setIsOpen(true);
  }, [selectedId]);

  if (!SettingsComponent || !selectedId || !isOpen) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:w-[26rem] md:max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Selected
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{displayName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {query.node(selectedId).isDeletable() ? (
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                onClick={() => {
                  actions.delete(selectedId);
                  setIsOpen(false);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid max-h-[65vh] overflow-y-auto md:max-h-[70vh]">
          {selectedId !== "ROOT" ? (
            <div className="sticky top-0 z-10 grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 pt-2 md:px-5">
              {(["desktop", "tablet", "mobile"] as const).map((breakpoint) => (
                <button
                  className={cn(
                    "border-b-2 px-2 py-2.5 text-xs font-semibold capitalize transition-colors",
                    activeBreakpoint === breakpoint
                      ? "border-[var(--accent-gold)] text-[var(--brand-primary)]"
                      : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                  )}
                  key={breakpoint}
                  onClick={() => setActiveBreakpoint(breakpoint)}
                  type="button"
                >
                  {breakpoint}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 px-4 py-4 md:px-5">
            <EditorBreakpointContext.Provider value={selectedId === "ROOT" ? "desktop" : activeBreakpoint}>
              <SettingsComponent />
            </EditorBreakpointContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}
