"use client";

import { useEditor, useNode } from "@craftjs/core";
import { Plus } from "lucide-react";
import { IconBoxBlock } from "../basic/IconBoxBlock";
import { NodeFrame } from "../../shared/NodeFrame";
import type { FeatureZigzagListProps } from "./FeatureZigzagBlock";

export function FeatureIconListBlock({
  children,
  sectionDescription = "Use your gifts, build friendships, and help others experience the love of Jesus.",
  sectionTitle = "Serve in a fellowship ministry",
  showDescription = true,
}: FeatureZigzagListProps) {
  const { id } = useNode();
  const { actions, enabled, query } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  function addItem() {
    const tree = query.parseReactElement(
      <IconBoxBlock
        alignItems="center"
        background="transparent"
        borderWidth="var(--section-space-none)"
        icon="handHeart"
        padding="var(--section-space-none)"
        removable
        title="New ministry"
      />
    ).toNodeTree();
    actions.addNodeTree(tree, id);
  }

  return (
    <NodeFrame>
      <div className="grid" style={{ gap: "var(--section-space-lg)" }}>
        <div className="grid justify-items-center text-center" style={{ gap: "var(--section-space-xs)" }}>
          <h2 style={{ fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {sectionTitle}
          </h2>
          {showDescription && sectionDescription ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
              {sectionDescription}
            </p>
          ) : null}
        </div>
        <div className="feature-icon-grid grid" style={{ gap: "var(--section-space-lg)", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {children}
          {enabled ? (
            <button
              className="flex items-center justify-center border-2 border-dashed border-[var(--border-strong)] text-sm font-semibold text-[var(--brand-primary)]"
              onClick={addItem}
              style={{ borderRadius: "var(--section-radius-card)", minHeight: "var(--section-card-add-height)" }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />Add feature
            </button>
          ) : null}
        </div>
      </div>
    </NodeFrame>
  );
}

FeatureIconListBlock.craft = {
  displayName: "Centered icon feature list",
  isCanvas: true,
  props: {
    sectionDescription: "Use your gifts, build friendships, and help others experience the love of Jesus.",
    sectionTitle: "Serve in a fellowship ministry",
    showDescription: true,
  },
};
