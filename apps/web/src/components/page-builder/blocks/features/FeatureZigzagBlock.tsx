"use client";

import { useEditor, useNode } from "@craftjs/core";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/components/ui";
import { defaultHeroSliderImages } from "../hero/HeroImageSliderBlock";
import { NodeFrame } from "../../shared/NodeFrame";
import { getButtonVariantClass } from "../../shared/helpers";
import type { ReactNode } from "react";

const featureCardDefaultImage = defaultHeroSliderImages[2];

export type FeatureZigzagCardProps = {
  buttonHref?: string;
  buttonLabel?: string;
  description?: string;
  imageAlt?: string;
  imageUrl?: string;
  layout?: "zigzag" | "vertical";
  showButton?: boolean;
  title?: string;
};

export function FeatureZigzagCardBlock({
  buttonHref = "/about",
  buttonLabel = "Learn more",
  description = "Add a clear description that helps visitors understand this feature.",
  imageAlt = "Feature image",
  imageUrl = featureCardDefaultImage,
  layout = "zigzag",
  showButton = true,
  title = "Feature title",
}: FeatureZigzagCardProps) {
  const { id } = useNode();
  const { actions, enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  return (
    <NodeFrame>
      <article
        className={cn("relative grid overflow-hidden", layout === "zigzag" && "feature-zigzag-card items-center")}
        style={{
          background: layout === "zigzag" ? "var(--bg-card)" : "transparent",
          borderRadius: "var(--section-radius-card)",
          gap: layout === "zigzag" ? "var(--section-space-lg)" : "var(--section-space-sm)",
          gridTemplateColumns: layout === "zigzag" ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
          padding: layout === "zigzag" ? "var(--section-space-lg)" : "var(--section-space-none)",
        }}
      >
        <div className="feature-zigzag-card-media overflow-hidden" style={{ borderRadius: "var(--section-radius)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={imageAlt} className="w-full object-cover" src={imageUrl} style={{ height: "var(--section-card-media-height)" }} />
        </div>
        <div className="feature-zigzag-card-content grid" style={{ gap: "var(--section-space-sm)" }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "var(--section-card-title-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {title}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
            {description}
          </p>
          {showButton ? (
            <a
              className={cn(
                "inline-flex items-center justify-center font-semibold rounded-lg px-5 py-2.5 text-sm transition-all duration-300 justify-self-start",
                getButtonVariantClass("primary"),
              )}
              href={buttonHref}
              onClick={(event) => {
                if (enabled) event.preventDefault();
              }}
            >
              {buttonLabel}
            </a>
          ) : null}
        </div>
        {enabled ? (
          <button
            aria-label="Remove feature card"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--status-danger)] shadow-md"
            onClick={(event) => {
              event.stopPropagation();
              actions.delete(id);
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </article>
    </NodeFrame>
  );
}

FeatureZigzagCardBlock.craft = {
  displayName: "Feature card",
  props: {
    buttonHref: "/about",
    buttonLabel: "Learn more",
    description: "Add a clear description that helps visitors understand this feature.",
    imageAlt: "Feature image",
    imageUrl: featureCardDefaultImage,
    layout: "zigzag",
    showButton: true,
    title: "Feature title",
  },
};

export type FeatureZigzagListProps = {
  children?: ReactNode;
  sectionDescription?: string;
  sectionTitle?: string;
  showDescription?: boolean;
};

export function FeatureZigzagListBlock({
  children,
  sectionDescription = "Explore the ways we help people connect, grow, and take their next step.",
  sectionTitle = "Ways to grow together",
  showDescription = true,
}: FeatureZigzagListProps) {
  const { id } = useNode();
  const { actions, enabled, query } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  function addCard() {
    const tree = query.parseReactElement(<FeatureZigzagCardBlock />).toNodeTree();
    actions.addNodeTree(tree, id);
  }

  return (
    <NodeFrame>
      <div className="feature-zigzag-list grid" style={{ gap: "var(--section-space-md)" }}>
        <div className="grid" style={{ gap: "var(--section-space-xs)" }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {sectionTitle}
          </h2>
          {showDescription && sectionDescription ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
              {sectionDescription}
            </p>
          ) : null}
        </div>
        <div className="feature-zigzag-cards grid" style={{ gap: "var(--section-space-md)" }}>
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

FeatureZigzagListBlock.craft = {
  displayName: "Feature list",
  isCanvas: true,
  props: {
    sectionDescription: "Explore the ways we help people connect, grow, and take their next step.",
    sectionTitle: "Ways to grow together",
    showDescription: true,
  },
};
