"use client";

import { useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { NodeFrame } from "../../shared/NodeFrame";

export type TestimonialItem = {
  buttonHref: string;
  buttonLabel: string;
  imageUrl?: string;
  logoUrl: string;
  name: string;
  organization: string;
  quote: string;
  role: string;
  showButton: boolean;
};

export const defaultTestimonials: TestimonialItem[] = [
  { buttonHref: "/about", buttonLabel: "Read their story", logoUrl: "", name: "Jordan Lee", organization: "Fellowship family", quote: "This church helped our family find real community and grow closer to Jesus together.", role: "Community member", showButton: false },
  { buttonHref: "/about", buttonLabel: "Read their story", logoUrl: "", name: "Taylor Morgan", organization: "Local outreach", quote: "Serving together has shown us how God can use ordinary people to bring hope to our neighbors.", role: "Ministry volunteer", showButton: false },
];

export function FeatureTestimonialListBlock({
  items = defaultTestimonials,
  sectionDescription = "Real stories of faith, belonging, and lives transformed through Jesus.",
  sectionTitle = "Lives changed through community",
  showDescription = true,
}: {
  items?: TestimonialItem[];
  sectionDescription?: string;
  sectionTitle?: string;
  showDescription?: boolean;
}) {
  const {
    items: nodeItems,
    sectionDescription: nodeSectionDescription,
    sectionTitle: nodeSectionTitle,
    showDescription: nodeShowDescription,
  } = useNode((node) => ({
    items: node.data.props.items,
    sectionDescription: node.data.props.sectionDescription,
    sectionTitle: node.data.props.sectionTitle,
    showDescription: node.data.props.showDescription,
  }));

  const activeTitle = nodeSectionTitle ?? sectionTitle;
  const activeDescription = nodeSectionDescription ?? sectionDescription;
  const activeShowDescription = nodeShowDescription !== undefined ? nodeShowDescription : showDescription;
  const activeItems = (Array.isArray(nodeItems) && nodeItems.length ? nodeItems : items) || defaultTestimonials;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = activeItems[Math.min(activeIndex, Math.max(activeItems.length - 1, 0))];
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));

  return (
    <NodeFrame>
      <div className="grid" style={{ gap: "var(--section-space-lg)" }}>
        <div className="grid" style={{ gap: "var(--section-space-xs)" }}>
          <h2 style={{ fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {activeTitle}
          </h2>
          {activeShowDescription && activeDescription ? (
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              {activeDescription}
            </p>
          ) : null}
        </div>
        {activeItem ? (
          <div className="overflow-hidden border border-[var(--border-subtle)]" style={{ borderRadius: "var(--section-radius-card)" }}>
            <div className="feature-testimonial-layout grid items-center" style={{ gap: "var(--section-space-lg)", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", padding: "var(--section-space-lg)" }}>
              <div className="feature-testimonial-image relative flex items-center justify-center bg-[var(--bg-card)] overflow-hidden w-full" style={{ borderRadius: "var(--section-radius)", height: "30rem" }}>
                {activeItem.imageUrl || activeItem.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={activeItem.organization} className="h-full w-full object-cover" key={activeItem.imageUrl || activeItem.logoUrl} src={activeItem.imageUrl || activeItem.logoUrl} />
                ) : (
                  <strong style={{ fontSize: "var(--section-card-title-size)" }}>{activeItem.organization}</strong>
                )}
              </div>
              <div className="grid content-center" style={{ gap: "var(--section-space-md)" }}>
                <blockquote style={{ fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
                  “{activeItem.quote}”
                </blockquote>
                <div>
                  <strong className="block">{activeItem.name}</strong>
                  <span style={{ color: "var(--text-secondary)" }}>{activeItem.role}</span>
                </div>
                {activeItem.showButton ? (
                  <a
                    className="justify-self-start"
                    href={activeItem.buttonHref}
                    onClick={(event) => {
                      if (enabled) event.preventDefault();
                    }}
                    style={{ color: "var(--brand-primary)", fontWeight: "var(--section-weight-bold)" }}
                  >
                    {activeItem.buttonLabel} →
                  </a>
                ) : null}
              </div>
            </div>
            <div className="feature-testimonial-tabs grid border-t border-[var(--border-subtle)]" style={{ gridTemplateColumns: `repeat(${activeItems.length}, minmax(0, 1fr))` }}>
              {activeItems.map((item, index) => (
                <button
                  className="border-r border-[var(--border-subtle)]"
                  key={`${item.organization}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    background: index === activeIndex ? "var(--bg-card)" : "transparent",
                    fontWeight: "var(--section-weight-bold)",
                    padding: "var(--section-space-md)",
                  }}
                  type="button"
                >
                  {item.organization}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </NodeFrame>
  );
}

FeatureTestimonialListBlock.craft = {
  displayName: "Community testimonials",
  props: {
    items: defaultTestimonials,
    sectionDescription: "Real stories of faith, belonging, and lives transformed through Jesus.",
    sectionTitle: "Lives changed through community",
    showDescription: true,
  },
};
