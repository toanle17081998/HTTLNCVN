"use client";

import { useEffect, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { Input, Textarea, cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps } from "../../shared/types";

export const defaultHeroSliderImages = [
  "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1400&q=85",
];

type HeroSliderProps = BoxProps & {
  autoPlay?: boolean;
  images?: string[];
  intervalMs?: number | string;
};

export function HeroImageSliderBlock({
  images = defaultHeroSliderImages,
  ...props
}: HeroSliderProps) {
  const slideList = Array.isArray(images) && images.length ? images : defaultHeroSliderImages;
  const displayImages = [
    slideList[0] || defaultHeroSliderImages[0],
    slideList[1] || defaultHeroSliderImages[1],
    slideList[2] || defaultHeroSliderImages[2],
  ];

  return (
    <NodeFrame>
      <div
        className="hero-slider-frames grid grid-cols-3 items-center gap-2 sm:gap-3 md:gap-4 w-full"
        style={{
          ...buildBoxStyle(props),
          minHeight: "var(--section-hero-slider-height)",
        }}
      >
        {displayImages.map((url, index) => {
          const isCenter = index === 1;
          return (
            <div
              className={cn(
                "group relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card-strong)] shadow-md transition-all duration-500 hover:shadow-xl",
                isCenter ? "h-full" : "h-[86%]",
              )}
              key={`${url}-${index}`}
              style={{
                borderRadius: "var(--section-hero-slider-radius, 999rem 999rem 1.5rem 1.5rem)",
                minHeight: isCenter
                  ? "var(--section-hero-slider-height)"
                  : "var(--section-hero-slider-side-height, calc(var(--section-hero-slider-height) * 0.82))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`Hero window frame ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={url}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          );
        })}
      </div>
    </NodeFrame>
  );
}

function HeroImageSliderBlockSettings() {
  const {
    actions: { setProp },
    autoPlay,
    images,
    intervalMs,
  } = useNode((node) => ({
    autoPlay: node.data.props.autoPlay,
    images: node.data.props.images,
    intervalMs: node.data.props.intervalMs,
  }));

  const imageString = Array.isArray(images) ? images.join("\n") : defaultHeroSliderImages.join("\n");

  return (
    <div className="grid gap-3">
      <Field label="Images (one URL per line)">
        <Textarea
          className="min-h-28"
          onChange={(event) =>
            setProp((props: any) => (props.images = event.target.value.split("\n").map((line: string) => line.trim()).filter(Boolean)))
          }
          value={imageString}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Auto play">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.autoPlay = value === "true"))}
            value={String(Boolean(autoPlay))}
          >
            <option value="true">On</option>
            <option value="false">Off</option>
          </NativeSelect>
        </Field>
        <Field label="Interval (ms)">
          <Input
            onChange={(event) => setProp((props: any) => (props.intervalMs = event.target.value))}
            value={String(intervalMs ?? 4500)}
          />
        </Field>
      </div>
      <BoxSettings />
    </div>
  );
}

HeroImageSliderBlock.craft = {
  displayName: "Hero Image Slider",
  props: {
    ...defaultBoxProps({
      borderRadius: "var(--section-radius-card)",
      minHeight: "var(--section-hero-slider-height)",
      width: "100%",
    }),
    autoPlay: true,
    images: defaultHeroSliderImages,
    intervalMs: 4500,
  },
  related: { settings: HeroImageSliderBlockSettings },
};
