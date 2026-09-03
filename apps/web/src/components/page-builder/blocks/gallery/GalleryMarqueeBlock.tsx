"use client";

import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps, GalleryImageItem } from "../../shared/types";

export const defaultGalleryImages: GalleryImageItem[] = [
  { alt: "Worship gathering", url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85" },
  { alt: "Community fellowship", url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85" },
  { alt: "Youth gathering", url: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1400&q=85" },
  { alt: "Prayer & service", url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1400&q=85" },
  { alt: "Bible study", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85" },
  { alt: "Sunday celebration", url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=85" },
];

type GalleryMarqueeProps = BoxProps & {
  direction?: "left" | "right";
  images?: GalleryImageItem[];
  showSubtitle?: boolean;
  showTitle?: boolean;
  speedSec?: number | string;
  subtitle?: string;
  title?: string;
};

export function GalleryMarqueeBlock({
  direction = "left",
  images = defaultGalleryImages,
  showSubtitle = true,
  showTitle = true,
  speedSec = 30,
  subtitle = "Moments of fellowship, worship, and service across our community.",
  title = "Our Life Together in Photos",
  ...props
}: GalleryMarqueeProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const imageList = Array.isArray(images) && images.length ? images : defaultGalleryImages;
  const loopImages = [...imageList, ...imageList, ...imageList];

  return (
    <NodeFrame>
      <div
        className="grid gap-6 overflow-hidden py-4"
        style={{
          ...buildBoxStyle(props),
          width: "100%",
        }}
      >
        {showTitle || showSubtitle ? (
          <div className="grid justify-items-center text-center">
            {showTitle && title ? (
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">{title}</h2>
            ) : null}
            {showSubtitle && subtitle ? (
              <p className="mt-1 max-w-xl text-sm text-[var(--text-secondary)]">{subtitle}</p>
            ) : null}
          </div>
        ) : null}

        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className={cn(
              "flex w-max gap-4",
              direction === "right" ? "animate-marquee-right" : "animate-marquee-left",
              enabled && "[animation-play-state:paused]",
            )}
            style={{
              animationDuration: `${Math.max(10, Number(speedSec) || 30)}s`,
            }}
          >
            {loopImages.map((img, index) => (
              <div
                className="group relative h-48 w-72 shrink-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-md transition-all duration-300 hover:scale-[1.02] md:h-56 md:w-80"
                key={index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={img.alt || "Gallery image"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={img.url}
                />
                {img.alt ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {img.alt}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </NodeFrame>
  );
}

function GalleryMarqueeBlockSettings() {
  const {
    actions: { setProp },
    direction,
    showSubtitle,
    showTitle,
    speedSec,
    subtitle,
    title,
  } = useNode((node) => ({
    direction: node.data.props.direction,
    showSubtitle: node.data.props.showSubtitle,
    showTitle: node.data.props.showTitle,
    speedSec: node.data.props.speedSec,
    subtitle: node.data.props.subtitle,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Scroll direction">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.direction = value))}
          value={direction ?? "left"}
        >
          <option value="left">Left to Right (← Scrolls Left)</option>
          <option value="right">Right to Left (→ Scrolls Right)</option>
        </NativeSelect>
      </Field>
      <Field label="Speed (seconds for 1 full loop)">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.speedSec = Number(value)))}
          value={String(speedSec ?? 30)}
        >
          <option value="15">Fast (15s)</option>
          <option value="30">Normal (30s)</option>
          <option value="45">Slow (45s)</option>
          <option value="60">Very slow (60s)</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

GalleryMarqueeBlock.craft = {
  displayName: "Gallery - Endless Image Loop",
  props: {
    ...defaultBoxProps({
      padding: "var(--section-space-lg) var(--section-gutter)",
      width: "100%",
    }),
    direction: "left",
    images: defaultGalleryImages,
    showSubtitle: true,
    showTitle: true,
    speedSec: 30,
    subtitle: "Moments of fellowship, worship, and service across our community.",
    title: "Our Life Together in Photos",
  },
  related: { settings: GalleryMarqueeBlockSettings },
};
