"use client";

import { HandHeart } from "lucide-react";
import { featureIconMap } from "../basic/IconBoxBlock";
import { NodeFrame } from "../../shared/NodeFrame";

export type CoreValueItem = { description: string; icon: keyof typeof featureIconMap; title: string };

export const defaultCoreValues: CoreValueItem[] = [
  { description: "Keep Jesus at the center of everything we do.", icon: "handHeart", title: "Faith first" },
  { description: "Care for people with compassion, humility, and grace.", icon: "shield", title: "Serve with love" },
  { description: "Follow Jesus alongside others through every season.", icon: "layers", title: "Grow together" },
  { description: "Share our time and gifts to bless our neighbors.", icon: "users", title: "Live generously" },
];

function CoreValuesArtwork() {
  return (
    <svg aria-label="Core values" role="img" viewBox="0 0 360 420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="core-values-gradient" x1="0" x2="1" y1="1" y2="0">
          <stop stopColor="var(--brand-secondary)" />
          <stop offset="1" stopColor="var(--brand-primary)" />
        </linearGradient>
      </defs>
      <path
        d="M176 28c62-8 91 35 102 91 51 13 78 55 70 111-7 51-41 79-91 86-19 56-58 83-112 73-58-10-88-53-86-109-39-34-48-80-22-126 27-47 75-62 139-126Zm8 111c-41 3-65 35-63 79 2 45 28 75 69 74 43-2 66-34 62-80-3-46-27-76-68-73Z"
        fill="url(#core-values-gradient)"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function FeatureOrbitListBlock({
  centerImageAlt = "Core values",
  centerImageUrl = "",
  items = defaultCoreValues,
  sectionDescription = "Biblical values that shape how we follow Jesus, love people, and serve our community.",
  sectionTitle = "Values that shape our church",
  showDescription = true,
}: {
  centerImageAlt?: string;
  centerImageUrl?: string;
  items?: CoreValueItem[];
  sectionDescription?: string;
  sectionTitle?: string;
  showDescription?: boolean;
}) {
  const columns = [items.slice(0, 2), items.slice(2, 4)];

  function renderItem(item: CoreValueItem, index: number) {
    const ValueIcon = featureIconMap[item.icon] ?? HandHeart;
    return (
      <div className="grid justify-items-center text-center" key={`${item.title}-${index}`} style={{ gap: "var(--section-space-xs)" }}>
        <span className="grid place-items-center border border-[var(--border-subtle)]" style={{ borderRadius: "var(--section-radius)", height: "var(--section-icon-box-size)", width: "var(--section-icon-box-size)" }}>
          <ValueIcon style={{ height: "var(--section-icon-size)", width: "var(--section-icon-size)" }} />
        </span>
        <h3 style={{ fontSize: "var(--section-card-title-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
          {item.title}
        </h3>
        <p style={{ color: "var(--text-secondary)", lineHeight: "var(--section-body-line-height)", margin: 0 }}>
          {item.description}
        </p>
      </div>
    );
  }

  return (
    <NodeFrame>
      <div className="grid" style={{ gap: "var(--section-space-xl)" }}>
        <div className="grid justify-items-center text-center" style={{ gap: "var(--section-space-xs)" }}>
          <h2 style={{ fontSize: "var(--section-heading-size)", fontWeight: "var(--section-weight-bold)", lineHeight: "var(--section-heading-line-height)", margin: 0 }}>
            {sectionTitle}
          </h2>
          {showDescription && sectionDescription ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--section-body-size)", lineHeight: "var(--section-body-line-height)", margin: 0, maxWidth: "var(--section-text-width)" }}>
              {sectionDescription}
            </p>
          ) : null}
        </div>
        <div className="feature-orbit-layout grid items-center" style={{ gap: "var(--section-space-lg)", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr)" }}>
          <div className="grid" style={{ gap: "var(--section-space-xl)" }}>{columns[0].map(renderItem)}</div>
          <div className="feature-orbit-image mx-auto w-full" style={{ maxWidth: "var(--section-orbit-image-width)" }}>
            {centerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={centerImageAlt} className="h-full w-full object-contain" src={centerImageUrl} />
            ) : (
              <CoreValuesArtwork />
            )}
          </div>
          <div className="grid" style={{ gap: "var(--section-space-xl)" }}>{columns[1].map((item, index) => renderItem(item, index + 2))}</div>
        </div>
      </div>
    </NodeFrame>
  );
}

FeatureOrbitListBlock.craft = {
  displayName: "Core values feature list",
  props: {
    centerImageAlt: "Core values",
    centerImageUrl: "",
    items: defaultCoreValues,
    sectionDescription: "Biblical values that shape how we follow Jesus, love people, and serve our community.",
    sectionTitle: "Values that shape our church",
    showDescription: true,
  },
};
