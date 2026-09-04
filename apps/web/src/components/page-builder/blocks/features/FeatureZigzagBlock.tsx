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
  const { id, actions: { setProp } } = useNode((node) => ({
    buttonHref: node.data.props.buttonHref,
    buttonLabel: node.data.props.buttonLabel,
    description: node.data.props.description,
    imageAlt: node.data.props.imageAlt,
    imageUrl: node.data.props.imageUrl,
    layout: node.data.props.layout,
    showButton: node.data.props.showButton,
    title: node.data.props.title,
  }));
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
          <h3
            className="outline-none"
            contentEditable={enabled}
            onBlur={(event: any) => {
              if (!enabled) return;
              const text = event.currentTarget.innerText;
              setProp((draft: any) => { draft.title = text; });
            }}
            style={{ color: "var(--text-primary)", fontSize: "var(--section-card-title-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}
            suppressContentEditableWarning={enabled}
          >
            {title}
          </h3>
          <p
            className="outline-none"
            contentEditable={enabled}
            onBlur={(event: any) => {
              if (!enabled) return;
              const text = event.currentTarget.innerText;
              setProp((draft: any) => { draft.description = text; });
            }}
            style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}
            suppressContentEditableWarning={enabled}
          >
            {description}
          </p>
          {showButton ? (
            <a
              className={cn(
                "inline-flex items-center justify-center font-semibold rounded-lg px-5 py-2.5 text-sm transition-all duration-300 justify-self-start outline-none",
                getButtonVariantClass("primary"),
              )}
              contentEditable={enabled}
              href={buttonHref}
              onBlur={(event: any) => {
                if (!enabled) return;
                const text = event.currentTarget.innerText;
                setProp((draft: any) => { draft.buttonLabel = text; });
              }}
              onClick={(event) => {
                if (enabled) event.preventDefault();
              }}
              suppressContentEditableWarning={enabled}
            >
              {buttonLabel}
            </a>
          ) : null}
        </div>
        {enabled ? (
          <button
            aria-label="Remove feature card"
            className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full bg-[var(--status-danger)] text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              actions.delete(id);
            }}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onTouchStart={(event) => {
              event.stopPropagation();
            }}
            ref={(buttonRef) => {
              if (buttonRef) {
                buttonRef.onpointerdown = (event) => event.stopPropagation();
                buttonRef.onmousedown = (event) => event.stopPropagation();
              }
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
  name: "FeatureZigzagCardBlock",
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
  const { id, actions: { setProp } } = useNode((node) => ({
    sectionDescription: node.data.props.sectionDescription,
    sectionTitle: node.data.props.sectionTitle,
  }));
  const { actions, enabled, query } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  function addCard() {
    const node = query.parseFreshNode({
      data: {
        isCanvas: false,
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
        type: FeatureZigzagCardBlock,
      },
    }).toNode();
    actions.add(node, id);
    actions.selectNode();
  }

  return (
    <NodeFrame>
      <div className="feature-zigzag-list grid" style={{ gap: "var(--section-space-md)" }}>
        <div className="grid" style={{ gap: "var(--section-space-xs)" }}>
          <h2
            className="outline-none"
            contentEditable={enabled}
            onBlur={(event: any) => {
              if (!enabled) return;
              const text = event.currentTarget.innerText;
              setProp((draft: any) => { draft.sectionTitle = text; });
            }}
            style={{ color: "var(--text-primary)", fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}
            suppressContentEditableWarning={enabled}
          >
            {sectionTitle}
          </h2>
          {showDescription && sectionDescription ? (
            <p
              className="outline-none"
              contentEditable={enabled}
              onBlur={(event: any) => {
                if (!enabled) return;
                const text = event.currentTarget.innerText;
                setProp((draft: any) => { draft.sectionDescription = text; });
              }}
              style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}
              suppressContentEditableWarning={enabled}
            >
              {sectionDescription}
            </p>
          ) : null}
        </div>
        <div className="feature-zigzag-cards grid" style={{ gap: "var(--section-space-md)" }}>
          {children}
          {enabled ? (
            <button
              className="flex items-center justify-center border-2 border-dashed border-[var(--border-strong)] text-sm font-semibold text-[var(--brand-primary)] cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                addCard();
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
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
