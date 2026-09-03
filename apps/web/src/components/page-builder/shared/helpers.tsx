"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { BoxProps, FeedItem, SizeValue } from "./types";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";

export function getButtonVariantClass(variant: ButtonVariant = "primary") {
  switch (variant) {
    case "gold":
      return "cursor-pointer border border-transparent bg-[var(--accent-gold)] text-black hover:opacity-90 shadow-md";
    case "secondary":
      return "cursor-pointer border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] shadow-sm";
    case "ghost":
      return "cursor-pointer border border-[var(--brand-primary)] bg-transparent text-[var(--brand-primary)] hover:bg-[var(--brand-muted)]";
    case "primary":
    default:
      return "cursor-pointer border border-transparent bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:bg-[var(--brand-primary-strong)] shadow-md";
  }
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}

export function normalizeCssValue(value?: SizeValue) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return `${value}px`;
  const trimmed = value.trim().replace(/^(\d+(?:\.\d+)?)\s+(px|rem|em|vh|vw|%)$/i, "$1$2");
  if (!trimmed) return undefined;
  const aliasMap: Record<string, string> = {
    "h-auto": "auto",
    "h-full": "100%",
    "w-auto": "auto",
    "w-fit": "fit-content",
    "w-full": "100%",
    "w-max": "max-content",
    "w-min": "min-content",
  };
  return aliasMap[trimmed] ?? trimmed;
}

export function resolveStyleToken(value?: SizeValue) {
  const cssValue = normalizeCssValue(value);
  if (typeof cssValue !== "string") return cssValue;
  return cssValue.startsWith("--") ? `var(${cssValue})` : cssValue;
}

export function withUnitFallback(value?: SizeValue, fallback?: SizeValue) {
  return resolveStyleToken(value ?? fallback);
}

export function toEmbedUrl(url: string, kind: "embed" | "image") {
  if (kind !== "embed") return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&playsinline=1` : url;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&playsinline=1` : url;
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}?controls=1&modestbranding=1&rel=0&playsinline=1`;
      }

      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}?controls=1&modestbranding=1&rel=0&playsinline=1`;
      }
    }

    if (host === "vimeo.com") {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://player.vimeo.com/video/${videoId}?controls=1&playsinline=1` : url;
    }
  } catch {
    return url;
  }

  return url;
}

export function buildBoxStyle(props: BoxProps): CSSProperties {
  const hasMargin = props.margin !== undefined && props.margin !== "";
  const hasPadding = props.padding !== undefined && props.padding !== "";
  const paddingTop = withUnitFallback(props.paddingTop);
  const paddingRight = withUnitFallback(props.paddingRight);
  const paddingBottom = withUnitFallback(props.paddingBottom);
  const paddingLeft = withUnitFallback(props.paddingLeft);
  const marginTop = withUnitFallback(props.marginTop);
  const marginRight = withUnitFallback(props.marginRight);
  const marginBottom = withUnitFallback(props.marginBottom);
  const marginLeft = withUnitFallback(props.marginLeft);
  const parsedZIndex = props.zIndex === "" || props.zIndex === undefined ? undefined : Number(props.zIndex);
  const positioned = Boolean(props.position && props.position !== "static");

  const bgImage = (props.backgroundImage || (typeof props.background === "string" ? props.background.match(/url\(['"]?(.*?)['"]?\)/)?.[1] : undefined))?.trim();
  const rawBg = resolveStyleToken(props.background);

  let combinedBackground = rawBg;
  if (bgImage) {
    const formattedUrl = bgImage.startsWith("url(") || bgImage.startsWith("gradient") || bgImage.startsWith("linear-gradient")
      ? bgImage
      : `url("${bgImage}")`;

    if (rawBg && rawBg !== "transparent" && !rawBg.includes("url(")) {
      combinedBackground = `${rawBg}, ${formattedUrl}`;
    } else if (!rawBg || rawBg === "transparent") {
      combinedBackground = formattedUrl;
    }
  }

  return {
    background: combinedBackground,
    backgroundPosition: bgImage ? (props.backgroundPosition || "center") : undefined,
    backgroundRepeat: bgImage ? (props.backgroundRepeat || "no-repeat") : undefined,
    backgroundSize: bgImage ? (props.backgroundSize || "cover") : undefined,
    bottom: positioned ? withUnitFallback(props.bottom) : undefined,
    borderColor: resolveStyleToken(props.borderColor) ?? "transparent",
    borderRadius: withUnitFallback(props.borderRadius, 0),
    borderStyle: "solid",
    borderWidth: withUnitFallback(props.borderWidth, 0),
    height: withUnitFallback(props.height),
    left: positioned ? withUnitFallback(props.left) : undefined,
    ...(hasMargin ? { margin: props.margin } : { marginBottom, marginLeft, marginRight, marginTop }),
    maxWidth: withUnitFallback(props.maxWidth),
    minHeight: withUnitFallback(props.minHeight),
    minWidth: withUnitFallback(props.minWidth),
    ...(hasPadding ? { padding: props.padding } : { paddingBottom, paddingLeft, paddingRight, paddingTop }),
    position: props.position ?? "static",
    right: positioned ? withUnitFallback(props.right) : undefined,
    top: positioned ? withUnitFallback(props.top) : undefined,
    width: withUnitFallback(props.width),
    zIndex: parsedZIndex !== undefined && Number.isFinite(parsedZIndex) ? parsedZIndex : undefined,
  };
}

export function parsePixelLike(value: SizeValue | undefined) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  return match ? Number(match[1]) : null;
}

export function capSpacing(value: SizeValue | undefined, cap: number, fallback: string) {
  const pixels = parsePixelLike(value);
  if (pixels === null) return resolveStyleToken(value) ?? fallback;
  return `${Math.min(pixels, cap)}px`;
}

export function mobileBoxOverrides(props: BoxProps): CSSProperties {
  const hasMargin = props.margin !== undefined && props.margin !== "";
  const hasPadding = props.padding !== undefined && props.padding !== "";

  return {
    borderRadius: capSpacing(props.borderRadius, 20, "var(--section-radius-card)"),
    ...(!hasMargin
      ? {
        marginLeft: resolveStyleToken(props.marginLeft) ?? "var(--section-space-none)",
        marginRight: resolveStyleToken(props.marginRight) ?? "var(--section-space-none)",
      }
      : {}),
    maxWidth: "100%",
    minWidth: "var(--section-space-none)",
    ...(hasPadding
      ? { padding: "var(--section-space-lg) var(--section-space-sm)" }
      : {
        paddingBottom: capSpacing(props.paddingBottom, 32, "var(--section-space-lg)"),
        paddingLeft: capSpacing(props.paddingLeft, 16, "var(--section-space-sm)"),
        paddingRight: capSpacing(props.paddingRight, 16, "var(--section-space-sm)"),
        paddingTop: capSpacing(props.paddingTop, 32, "var(--section-space-lg)"),
      }),
    width: "100%",
  };
}

export function parseNumberLike(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function resolveFeedCardHref(item: FeedItem, hrefTemplate?: string) {
  const template = hrefTemplate?.trim();

  if (!template || (template === "/" && item.href)) {
    return item.href || "#";
  }

  if (template.includes("{slug}") || template.includes("{id}")) {
    return template
      .replaceAll("{slug}", item.slug ?? "")
      .replaceAll("{id}", item.id ?? "");
  }

  if (item.slug) {
    const normalizedTemplate = template.replace(/\/+$/, "");
    if (
      normalizedTemplate === "/article" ||
      normalizedTemplate === "/course" ||
      normalizedTemplate === "/event"
    ) {
      return `${normalizedTemplate}/${item.slug}`;
    }
  }

  return template;
}

export function isAnchorTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a"));
}

export function parsePairs(value: string, fallback: Array<{ content: string; title: string }>) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return fallback;

  const parsed = lines.map((line) => {
    const [title, ...contentParts] = line.split("::");
    return {
      content: contentParts.join("::").trim() || "Content",
      title: title.trim() || "Item",
    };
  });

  return parsed.length ? parsed : fallback;
}
