"use client";

import { useNode } from "@craftjs/core";
import { Input, cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, resolveStyleToken, toEmbedUrl, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { BoxProps, SizeValue } from "../../shared/types";

type ImageProps = BoxProps & {
  alt?: string;
  aspectRatio?: string;
  caption?: string;
  fit?: "cover" | "contain" | "fill";
  kind?: "image" | "embed";
  overlayColor?: string;
  overlayOpacity?: number | string;
  url?: string;
};

export function ImageBlock({
  alt = "Image block",
  aspectRatio = "16/9",
  caption,
  fit = "cover",
  kind = "image",
  overlayColor = "transparent",
  overlayOpacity = 0,
  url = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85",
  ...props
}: ImageProps) {
  const finalUrl = toEmbedUrl(url, kind);

  return (
    <NodeFrame>
      <div
        className="page-builder-media-block relative overflow-hidden"
        style={{
          ...buildBoxStyle(props),
          aspectRatio: props.height ? undefined : aspectRatio,
          borderRadius: resolveStyleToken(props.borderRadius ?? "var(--section-radius-card)"),
        }}
      >
        {kind === "embed" ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
            src={finalUrl}
            title={alt}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={alt}
            className="h-full w-full"
            src={finalUrl}
            style={{ objectFit: fit }}
          />
        )}
        {overlayColor && overlayColor !== "transparent" ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: resolveStyleToken(overlayColor),
              opacity: Number(overlayOpacity || 0) / 100,
            }}
          />
        ) : null}
        {caption ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-xs text-white">
            {caption}
          </div>
        ) : null}
      </div>
    </NodeFrame>
  );
}

function ImageBlockSettings() {
  const {
    actions: { setProp },
    alt,
    aspectRatio,
    caption,
    fit,
    kind,
    overlayColor,
    overlayOpacity,
    url,
  } = useNode((node) => ({
    alt: node.data.props.alt,
    aspectRatio: node.data.props.aspectRatio,
    caption: node.data.props.caption,
    fit: node.data.props.fit,
    kind: node.data.props.kind,
    overlayColor: node.data.props.overlayColor,
    overlayOpacity: node.data.props.overlayOpacity,
    url: node.data.props.url,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Media kind">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.kind = value))}
          value={kind ?? "image"}
        >
          <option value="image">Standard Image</option>
          <option value="embed">Video Embed (YouTube / Vimeo)</option>
        </NativeSelect>
      </Field>
      <Field label={kind === "embed" ? "Video URL" : "Image URL"}>
        <Input
          onChange={(event) => setProp((props: any) => (props.url = event.target.value))}
          value={url}
        />
      </Field>
      <Field label="Alt text">
        <Input
          onChange={(event) => setProp((props: any) => (props.alt = event.target.value))}
          value={alt}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Aspect ratio">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.aspectRatio = value))}
            value={aspectRatio ?? "16/9"}
          >
            <option value="16/9">16 : 9 (Widescreen)</option>
            <option value="4/3">4 : 3 (Classic)</option>
            <option value="1/1">1 : 1 (Square)</option>
            <option value="21/9">21 : 9 (Ultra Wide)</option>
            <option value="3/4">3 : 4 (Portrait)</option>
          </NativeSelect>
        </Field>
        <Field label="Object fit">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.fit = value))}
            value={fit ?? "cover"}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Caption (optional)">
        <Input
          onChange={(event) => setProp((props: any) => (props.caption = event.target.value))}
          value={caption ?? ""}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

ImageBlock.craft = {
  displayName: "Image / Video",
  props: {
    ...defaultBoxProps({
      borderRadius: "var(--section-radius-card)",
      width: "100%",
    }),
    alt: "Image block",
    aspectRatio: "16/9",
    fit: "cover",
    kind: "image",
    url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85",
  },
  related: { settings: ImageBlockSettings },
};
