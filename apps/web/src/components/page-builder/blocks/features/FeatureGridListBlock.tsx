"use client";

import { useEditor, useNode } from "@craftjs/core";
import { Plus } from "lucide-react";
import { FeatureZigzagCardBlock, type FeatureZigzagListProps } from "./FeatureZigzagBlock";
import { NodeFrame } from "../../shared/NodeFrame";

export function FeatureGridListBlock({
  children,
  sectionDescription = "Wherever you are in life, there is a meaningful next step for you.",
  sectionTitle = "Everyone has a next step",
  showDescription = true,
}: FeatureZigzagListProps) {
  const { id } = useNode();
  const { actions, enabled, query } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  function addCard() {
    const tree = query.parseReactElement(<FeatureZigzagCardBlock layout="vertical" />).toNodeTree();
    actions.addNodeTree(tree, id);
  }

  return (
    <NodeFrame>
      <div className="grid" style={{ gap: "var(--section-space-lg)" }}>
        <div className="grid justify-items-center text-center" style={{ gap: "var(--section-space-xs)" }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {sectionTitle}
          </h2>
          {showDescription && sectionDescription ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
              {sectionDescription}
            </p>
          ) : null}
        </div>
        <div className="feature-card-grid grid" style={{ gap: "var(--section-space-md)", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {children}
          {enabled ? (
            <button
              className="flex items-center justify-center border-2 border-dashed border-[var(--border-strong)] text-sm font-semibold text-[var(--brand-primary)]"
              onClick={addCard}
              style={{ borderRadius: "var(--section-radius-card)", minHeight: "var(--section-card-add-height)" }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />Add feature card
            </button>
          ) : null}
        </div>
      </div>
    </NodeFrame>
  );
}

FeatureGridListBlock.craft = {
  displayName: "Feature card grid",
  isCanvas: true,
  props: {
    sectionDescription: "Wherever you are in life, there is a meaningful next step for you.",
    sectionTitle: "Everyone has a next step",
    showDescription: true,
  },
};
