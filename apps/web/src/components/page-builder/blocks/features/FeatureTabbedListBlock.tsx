"use client";

import { useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { defaultHeroSliderImages } from "../hero/HeroImageSliderBlock";
import { NodeFrame } from "../../shared/NodeFrame";

export type FeatureTabItem = {
  buttonHref: string;
  buttonLabel: string;
  description: string;
  imageAlt: string;
  imageUrl: string;
  showButton: boolean;
  title: string;
};

export const defaultFeatureTabs: FeatureTabItem[] = [
  { buttonHref: "/about", buttonLabel: "Explore ministry", description: "A joyful and safe place where children can learn about Jesus.", imageAlt: "Children and families", imageUrl: defaultHeroSliderImages[0], showButton: false, title: "Kids and families" },
  { buttonHref: "/about", buttonLabel: "Find a group", description: "Build meaningful friendships and grow in faith together.", imageAlt: "Church community group", imageUrl: defaultHeroSliderImages[1], showButton: true, title: "Groups and community" },
  { buttonHref: "/contact", buttonLabel: "Get support", description: "Find prayer, encouragement, and practical care for every season.", imageAlt: "Care and support", imageUrl: defaultHeroSliderImages[2], showButton: false, title: "Care and support" },
];

export function FeatureTabbedListBlock({
  items = defaultFeatureTabs,
  sectionDescription = "Discover ministries and communities that help you grow in faith and find belonging.",
  sectionTitle = "Find your place to grow",
  showDescription = true,
}: {
  items?: FeatureTabItem[];
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
  const activeItems = (Array.isArray(nodeItems) && nodeItems.length ? nodeItems : items) || defaultFeatureTabs;

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
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
              {activeDescription}
            </p>
          ) : null}
        </div>
        {activeItem ? (
          <div className="feature-tabbed-layout grid" style={{ gap: "var(--section-space-lg)", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div className="grid content-start">
              {activeItems.map((item, index) => (
                <div
                  className="grid border-b border-[var(--border-subtle)] text-left transition-colors"
                  key={`${item.title}-${index}`}
                  style={{
                    background: index === activeIndex ? "var(--bg-card)" : "transparent",
                    borderRadius: index === activeIndex ? "var(--section-radius)" : "var(--section-space-none)",
                    padding: "var(--section-space-md)",
                  }}
                >
                  <button className="text-left" onClick={() => setActiveIndex(index)} type="button">
                    <strong style={{ fontSize: "var(--section-card-title-size)" }}>{item.title}</strong>
                  </button>
                  <div className="feature-tab-details" data-open={index === activeIndex ? "true" : "false"}>
                    <div className="feature-tab-details-inner grid" style={{ gap: "var(--section-space-xs)", paddingTop: "var(--section-space-xs)" }}>
                      <span style={{ color: "var(--text-secondary)", lineHeight: "var(--section-body-line-height)" }}>{item.description}</span>
                      {item.showButton ? (
                        <a
                          href={item.buttonHref}
                          onClick={(event) => {
                            if (enabled) event.preventDefault();
                          }}
                          style={{ color: "var(--brand-primary)", fontWeight: "var(--section-weight-bold)" }}
                        >
                          {item.buttonLabel} &rarr;
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="self-center overflow-hidden" style={{ borderRadius: "var(--section-radius-card)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={activeItem.imageAlt} className="feature-tab-image w-full object-cover" key={activeItem.imageUrl} src={activeItem.imageUrl} />
            </div>
          </div>
        ) : null}
      </div>
    </NodeFrame>
  );
}

FeatureTabbedListBlock.craft = {
  displayName: "Tabbed ministry list",
  props: {
    items: defaultFeatureTabs,
    sectionDescription: "Discover ministries and communities that help you grow in faith and find belonging.",
    sectionTitle: "Find your place to grow",
    showDescription: true,
  },
};
