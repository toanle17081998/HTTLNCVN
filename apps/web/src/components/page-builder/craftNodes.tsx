"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Element, useEditor, useNode } from "@craftjs/core";
import {
  AlignJustify,
  Columns2,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LayoutPanelTop,
  Layers3,
  Minus,
  MonitorPlay,
  Newspaper,
  PanelTop,
  RectangleHorizontal,
  Rows3,
  SquareDashedBottom,
  Star,
  Type,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useArticlesQuery } from "@/services/article";
import { useCoursesQuery } from "@/services/course";
import { useEventsQuery } from "@/services/event";
import { Input, Textarea, cn } from "@/components/ui";

type Align = "left" | "center" | "right";
type SizeValue = number | string;
type FeedType = "articles" | "courses" | "events";
type FeedCardStyle = "cinematic" | "editorial" | "minimal" | "split";
type FeedItem = {
  accent?: string;
  coverImage?: string | null;
  description: string;
  href?: string;
  id?: string;
  kicker: string;
  slug?: string;
  title: string;
};

type BoxProps = {
  background?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  bottom?: SizeValue;
  borderColor?: string;
  borderRadius?: SizeValue;
  borderWidth?: SizeValue;
  height?: SizeValue;
  hideOnDesktop?: boolean;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  left?: SizeValue;
  margin?: string;
  marginBottom?: SizeValue;
  marginLeft?: SizeValue;
  marginRight?: SizeValue;
  marginTop?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  minWidth?: SizeValue;
  mobileMargin?: string;
  mobileMaxWidth?: SizeValue;
  mobilePadding?: string;
  mobilePosition?: "static" | "relative";
  mobileWidth?: SizeValue;
  padding?: string;
  paddingBottom?: SizeValue;
  paddingLeft?: SizeValue;
  paddingRight?: SizeValue;
  paddingTop?: SizeValue;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  right?: SizeValue;
  top?: SizeValue;
  tabletMargin?: string;
  tabletMaxWidth?: SizeValue;
  tabletPadding?: string;
  tabletPosition?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  tabletWidth?: SizeValue;
  width?: SizeValue;
  zIndex?: SizeValue;
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}

function normalizeCssValue(value?: SizeValue) {
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

function resolveStyleToken(value?: SizeValue) {
  const cssValue = normalizeCssValue(value);
  if (typeof cssValue !== "string") return cssValue;
  return cssValue.startsWith("--") ? `var(${cssValue})` : cssValue;
}

function withUnitFallback(value?: SizeValue, fallback?: SizeValue) {
  return resolveStyleToken(value ?? fallback);
}

function toEmbedUrl(url: string, kind: "embed" | "image") {
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

function buildBoxStyle(props: BoxProps): CSSProperties {
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

function parsePixelLike(value: SizeValue | undefined) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  return match ? Number(match[1]) : null;
}

function capSpacing(value: SizeValue | undefined, cap: number, fallback: string) {
  const pixels = parsePixelLike(value);
  if (pixels === null) return resolveStyleToken(value) ?? fallback;
  return `${Math.min(pixels, cap)}px`;
}

function mobileBoxOverrides(props: BoxProps): CSSProperties {
  const hasMargin = props.margin !== undefined && props.margin !== "";
  const hasPadding = props.padding !== undefined && props.padding !== "";

  return {
    borderRadius: capSpacing(props.borderRadius, 20, "20px"),
    ...(!hasMargin
      ? {
        marginLeft: resolveStyleToken(props.marginLeft) ?? "0px",
        marginRight: resolveStyleToken(props.marginRight) ?? "0px",
      }
      : {}),
    maxWidth: "100%",
    minWidth: "0px",
    ...(hasPadding
      ? { padding: "20px 16px" }
      : {
        paddingBottom: capSpacing(props.paddingBottom, 20, "20px"),
        paddingLeft: capSpacing(props.paddingLeft, 16, "16px"),
        paddingRight: capSpacing(props.paddingRight, 16, "16px"),
        paddingTop: capSpacing(props.paddingTop, 20, "20px"),
      }),
    width: "100%",
  };
}

function parseNumberLike(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function resolveFeedCardHref(item: FeedItem, hrefTemplate?: string) {
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

function isAnchorTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a"));
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function NativeSelect({
  onChange,
  value,
  children,
}: {
  children: ReactNode;
  onChange: (value: string) => void;
  value?: string;
}) {
  return (
    <select
      className="h-11 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
      onChange={(event) => onChange(event.target.value)}
      value={value ?? ""}
    >
      {children}
    </select>
  );
}

function DimensionFields({
  getValue,
  labels,
  onChange,
}: {
  getValue: (key: string) => string;
  labels: Array<{ key: string; label: string }>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {labels.map((item) => (
        <Field key={item.key} label={item.label}>
          <Input onChange={(event) => onChange(item.key, event.target.value)} value={getValue(item.key)} />
        </Field>
      ))}
    </div>
  );
}

function useBoxProps() {
  return useNode((node) => ({
    allProps: node.data.props as Record<string, unknown>,
    background: node.data.props.background,
    bottom: node.data.props.bottom,
    borderColor: node.data.props.borderColor,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    height: node.data.props.height,
    hideOnDesktop: node.data.props.hideOnDesktop,
    hideOnMobile: node.data.props.hideOnMobile,
    hideOnTablet: node.data.props.hideOnTablet,
    left: node.data.props.left,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    maxWidth: node.data.props.maxWidth,
    minHeight: node.data.props.minHeight,
    minWidth: node.data.props.minWidth,
    mobileMargin: node.data.props.mobileMargin,
    mobileMaxWidth: node.data.props.mobileMaxWidth,
    mobilePadding: node.data.props.mobilePadding,
    mobilePosition: node.data.props.mobilePosition,
    mobileWidth: node.data.props.mobileWidth,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    position: node.data.props.position,
    right: node.data.props.right,
    top: node.data.props.top,
    tabletMargin: node.data.props.tabletMargin,
    tabletMaxWidth: node.data.props.tabletMaxWidth,
    tabletPadding: node.data.props.tabletPadding,
    tabletPosition: node.data.props.tabletPosition,
    tabletWidth: node.data.props.tabletWidth,
    width: node.data.props.width,
    zIndex: node.data.props.zIndex,
  }));
}

type EditorBreakpoint = "desktop" | "tablet" | "mobile";
const EditorBreakpointContext = createContext<EditorBreakpoint>("desktop");

function BoxSettings({
  includeBackground = true,
  includeBreakpoints = true,
  includePosition = true,
}: {
  includeBackground?: boolean;
  includeBreakpoints?: boolean;
  includePosition?: boolean;
}) {
  const {
    actions: { setProp },
    ...props
  } = useBoxProps();
  const selectedBreakpoint = useContext(EditorBreakpointContext);
  const currentBreakpoint = includeBreakpoints ? selectedBreakpoint : "desktop";

  function propertyKey(key: string) {
    if (currentBreakpoint === "desktop") return key;
    return `${currentBreakpoint}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  }

  function getValue(key: string) {
    return String(props.allProps[propertyKey(key)] ?? "");
  }

  function setValue(key: string, value: string) {
    setProp((draft: any) => {
      draft[propertyKey(key)] = value;
    });
  }

  function getBgImageValue() {
    const directImage = String(props.allProps[propertyKey("backgroundImage")] ?? "").trim();
    if (directImage) return directImage;
    const bgString = String(props.allProps[propertyKey("background")] ?? "");
    const match = bgString.match(/url\(['"]?(.*?)['"]?\)/);
    if (match?.[1]) return match[1];
    return "";
  }

  function setBgImageValue(value: string) {
    setProp((draft: any) => {
      draft[propertyKey("backgroundImage")] = value;
      const currentBg = String(draft[propertyKey("background")] ?? "");
      if (currentBg.includes("url(")) {
        const cleaned = currentBg.replace(/,\s*url\([^)]+\).*/, "").replace(/url\([^)]+\).*/, "").trim();
        draft[propertyKey("background")] = cleaned || "transparent";
      }
    });
  }

  const visibilityKey = currentBreakpoint === "desktop"
    ? "hideOnDesktop"
    : currentBreakpoint === "tablet"
      ? "hideOnTablet"
      : "hideOnMobile";
  const hidden = Boolean(props.allProps[visibilityKey]);

  function setHidden(value: boolean) {
    setProp((draft: any) => {
      draft[visibilityKey] = value;
    });
  }

  const rawBgValue = getValue("background");
  const bgImageValue = getBgImageValue();
  const knownBgOptions = [
    "transparent",
    "var(--bg-base)",
    "var(--bg-surface)",
    "var(--bg-card)",
    "var(--bg-card-strong)",
    "var(--bg-elevated)",
    "var(--brand-primary)",
    "var(--brand-muted)",
    "var(--brand-soft)",
    "var(--accent-gold)",
  ];
  const isCustomBg = Boolean(rawBgValue && !knownBgOptions.includes(rawBgValue) && !rawBgValue.includes("url("));

  return (
    <div className="grid gap-3">
      {includeBreakpoints ? (
        <Field label="Visibility">
          <NativeSelect onChange={(value) => setHidden(value === "hide")} value={hidden ? "hide" : "show"}>
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </NativeSelect>
        </Field>
      ) : null}

      {includeBackground ? (
        <div className="grid gap-2">
          <Field label="Background color">
            <NativeSelect onChange={(value) => setValue("background", value)} value={getValue("background") || (currentBreakpoint === "desktop" ? "transparent" : "")}>
              {currentBreakpoint !== "desktop" ? <option value="">Inherit desktop</option> : null}
              {isCustomBg ? (
                <option value={rawBgValue}>
                  Custom ({rawBgValue.length > 24 ? `${rawBgValue.slice(0, 24)}...` : rawBgValue})
                </option>
              ) : null}
              <option value="transparent">Transparent</option>
              <option value="var(--bg-base)">Base Background</option>
              <option value="var(--bg-surface)">Surface Background</option>
              <option value="var(--bg-card)">Card Background</option>
              <option value="var(--bg-card-strong)">Card Strong Background</option>
              <option value="var(--bg-elevated)">Elevated Background</option>
              <option value="var(--brand-primary)">Brand Primary</option>
              <option value="var(--brand-muted)">Brand Muted</option>
              <option value="var(--brand-soft)">Brand Soft</option>
              <option value="var(--accent-gold)">Accent Gold</option>
            </NativeSelect>
          </Field>
          <Field label="Background image URL">
            <Input
              onChange={(event) => setBgImageValue(event.target.value)}
              placeholder="https://example.com/image.jpg"
              value={bgImageValue}
            />
          </Field>
          {bgImageValue ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size">
                <NativeSelect onChange={(value) => setValue("backgroundSize", value)} value={getValue("backgroundSize") || "cover"}>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                </NativeSelect>
              </Field>
              <Field label="Position">
                <NativeSelect onChange={(value) => setValue("backgroundPosition", value)} value={getValue("backgroundPosition") || "center"}>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </NativeSelect>
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}

      {includePosition ? <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Position
        </p>
        <Field label="Mode">
          <NativeSelect onChange={(value) => setValue("position", value)} value={getValue("position") || (currentBreakpoint === "desktop" ? "static" : "")}>
            {currentBreakpoint !== "desktop" ? <option value="">Inherit desktop</option> : null}
            <option value="static">Static</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="fixed">Fixed</option>
            <option value="sticky">Sticky</option>
          </NativeSelect>
        </Field>
        <DimensionFields
          getValue={getValue}
          labels={[
            { key: "top", label: "Top" },
            { key: "right", label: "Right" },
            { key: "bottom", label: "Bottom" },
            { key: "left", label: "Left" },
          ]}
          onChange={setValue}
        />
        <Field label="Layer (z-index)">
          <Input onChange={(event) => setValue("zIndex", event.target.value)} value={getValue("zIndex")} />
        </Field>
      </div> : null}

      <DimensionFields
        getValue={getValue}
        labels={[
          { key: "width", label: "Width" },
          { key: "height", label: "Height" },
          { key: "minWidth", label: "Min width" },
          { key: "minHeight", label: "Min height" },
          { key: "maxWidth", label: "Max width" },
          { key: "borderRadius", label: "Radius" },
          { key: "borderWidth", label: "Border size" },
        ]}
        onChange={setValue}
      />
      <Field label="Border color">
        <NativeSelect onChange={(value) => setValue("borderColor", value)} value={getValue("borderColor") || (currentBreakpoint === "desktop" ? "transparent" : "")}>
          {currentBreakpoint !== "desktop" ? <option value="">Inherit desktop</option> : null}
          <option value="transparent">Transparent</option>
          <option value="var(--border-subtle)">Border Subtle</option>
          <option value="var(--border-strong)">Border Strong</option>
          <option value="var(--brand-primary)">Brand Primary</option>
          <option value="var(--accent-gold)">Accent Gold</option>
        </NativeSelect>
      </Field>
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Padding
        </p>
        <DimensionFields
          getValue={getValue}
          labels={[
            { key: "paddingTop", label: "Top" },
            { key: "paddingRight", label: "Right" },
            { key: "paddingBottom", label: "Bottom" },
            { key: "paddingLeft", label: "Left" },
          ]}
          onChange={setValue}
        />
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Margin
        </p>
        <DimensionFields
          getValue={getValue}
          labels={[
            { key: "marginTop", label: "Top" },
            { key: "marginRight", label: "Right" },
            { key: "marginBottom", label: "Bottom" },
            { key: "marginLeft", label: "Left" },
          ]}
          onChange={setValue}
        />
      </div>
    </div>
  );
}

function NodeFrame({ children, className }: { children: ReactNode; className?: string }) {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const {
    allProps,
    connectors: { connect, drag },
    hideOnDesktop,
    hideOnMobile,
    hideOnTablet,
    isActive,
    isFixed,
    isHovered,
    parentId,
  } = useNode((node) => ({
    allProps: node.data.props as Record<string, unknown>,
    hideOnDesktop: Boolean(node.data.props.hideOnDesktop),
    hideOnMobile: Boolean(node.data.props.hideOnMobile),
    hideOnTablet: Boolean(node.data.props.hideOnTablet),
    isActive: node.events.selected,
    isFixed: node.data.props.position === "fixed",
    isHovered: node.events.hovered,
    parentId: node.data.parent,
  }));

  const responsiveStyle = {} as CSSProperties & Record<string, string | number | undefined>;
  const responsiveProperties = [
    "background",
    "backgroundImage",
    "backgroundPosition",
    "backgroundRepeat",
    "backgroundSize",
    "bottom",
    "borderColor",
    "borderRadius",
    "borderWidth",
    "height",
    "left",
    "margin",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "marginTop",
    "maxWidth",
    "minHeight",
    "minWidth",
    "padding",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "position",
    "right",
    "top",
    "width",
    "zIndex",
  ] as const;

  const hasResponsiveOverrides = (breakpoint: "mobile" | "tablet") =>
    responsiveProperties.some((property) => {
      const propertyKey = `${breakpoint}${property.charAt(0).toUpperCase()}${property.slice(1)}`;
      const value = allProps[propertyKey];
      return value !== undefined && value !== "";
    });

  (["tablet", "mobile"] as const).forEach((breakpoint) => {
    responsiveProperties.forEach((property) => {
      const propertyKey = `${breakpoint}${property.charAt(0).toUpperCase()}${property.slice(1)}`;
      const cssProperty = property.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
      const value = allProps[propertyKey];

      responsiveStyle[`--${breakpoint}-${cssProperty}`] =
        property === "position" || property === "zIndex"
          ? typeof value === "string" || typeof value === "number" ? value : undefined
          : normalizeCssValue(value as SizeValue | undefined);
    });
  });

  return (
    <div
      className={cn(
        "page-builder-node relative transition-shadow",
        isActive && "ring-2 ring-[var(--brand-primary)] ring-offset-2",
        isHovered && "shadow-lg",
        className,
      )}
      data-editor-enabled={enabled ? "true" : undefined}
      data-fixed-position={isFixed ? "true" : undefined}
      data-hide-desktop={hideOnDesktop ? "true" : undefined}
      data-hide-mobile={hideOnMobile ? "true" : undefined}
      data-hide-tablet={hideOnTablet ? "true" : undefined}
      data-mobile-position={allProps.mobilePosition ? "set" : undefined}
      data-mobile-style={hasResponsiveOverrides("mobile") ? "true" : undefined}
      data-node-parent={parentId ?? undefined}
      data-tablet-style={hasResponsiveOverrides("tablet") ? "true" : undefined}
      ref={(ref) => {
        if (ref) connect(ref);
      }}
      style={responsiveStyle}
    >
      {isActive || isHovered ? (
        <div className="absolute -left-3 top-3 z-20">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
            ref={(ref) => {
              if (ref) drag(ref);
            }}
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function defaultBoxProps(overrides: Partial<BoxProps> = {}): BoxProps {
  return {
    background: "transparent",
    bottom: "",
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
    left: "",
    marginBottom: "0",
    marginLeft: "0",
    marginRight: "0",
    marginTop: "0",
    maxWidth: "100%",
    minHeight: "",
    minWidth: "",
    paddingBottom: "0",
    paddingLeft: "0",
    paddingRight: "0",
    paddingTop: "0",
    position: "static",
    right: "",
    top: "",
    width: "100%",
    zIndex: "",
    ...overrides,
  };
}

export function PageCanvas({
  children,
  snapType = "none",
  ...props
}: BoxProps & { children?: ReactNode; snapType?: "mandatory" | "proximity" | "none" }) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame className="min-h-[70vh] w-full">
      <div
        className={cn(
          "mx-auto min-h-[70vh] w-full",
          snapType !== "none" && (snapType === "mandatory" ? "snap-y snap-mandatory" : "snap-y snap-proximity")
        )}
        style={{
          borderColor: "transparent",
          borderRadius: 0,
          borderStyle: "none",
          borderWidth: 0,
          boxShadow: "none",
          margin: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          marginTop: 0,
          maxWidth: "100%",
          padding: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          position: "static",
          outline: "none",
          ...buildBoxStyle(props),
          ...(isMobile ? { minHeight: "auto" } : {}),
        }}
      >
        <div className={cn("grid gap-0", snapType !== "none" && "snap-y snap-mandatory")}>
          {snapType !== "none"
            ? (children as any)?.map?.((child: any, i: number) => (
              <div className="snap-start" key={i}>
                {child}
              </div>
            )) || children
            : children}
        </div>
      </div>
    </NodeFrame>
  );
}

function PageCanvasSettings() {
  return <BoxSettings includeBreakpoints={false} includePosition={false} />;
}

PageCanvas.craft = {
  displayName: "Page",
  isCanvas: true,
  props: defaultBoxProps({
    background: "var(--bg-base)",
    maxWidth: "100%",
    minHeight: "70vh",
    paddingBottom: "0",
    paddingLeft: "0",
    paddingRight: "0",
    paddingTop: "0",
    width: "100%",
  }),
  related: { settings: PageCanvasSettings },
};

type LayoutBlockProps = BoxProps & {
  children?: ReactNode;
  columns?: number | string;
  gap?: SizeValue;
};

function getGridStyle(props: LayoutBlockProps) {
  const columns = Math.max(1, parseNumberLike(props.columns, 1));
  return {
    ...buildBoxStyle(props),
    display: "grid",
    gap: withUnitFallback(props.gap, 20),
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } satisfies CSSProperties;
}

export function SectionBlock({ children, snapAlign = "none", ...props }: LayoutBlockProps & { snapAlign?: "start" | "center" | "none" }) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame>
      <div
        style={{
          ...getGridStyle(props),
          ...(isMobile
            ? {
              ...mobileBoxOverrides(props),
              gap: capSpacing(props.gap, 16, "16px"),
              gridTemplateColumns: "minmax(0, 1fr)",
            }
            : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

function SectionBlockSettings() {
  const {
    actions: { setProp },
    columns,
    gap,
  } = useNode((node) => ({
    columns: node.data.props.columns,
    gap: node.data.props.gap,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Columns">
        <Input onChange={(event) => setProp((props: any) => (props.columns = event.target.value))} value={String(columns ?? 1)} />
      </Field>
      <Field label="Gap">
        <Input onChange={(event) => setProp((props: any) => (props.gap = event.target.value))} value={String(gap ?? "20")} />
      </Field>
      <BoxSettings />
    </div>
  );
}

SectionBlock.craft = {
  displayName: "Container",
  isCanvas: true,
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "transparent",
      borderRadius: "0",
      borderWidth: "0",
      paddingBottom: "40px",
      paddingLeft: "40px",
      paddingRight: "40px",
      paddingTop: "40px",
    }),
    columns: 1,
    gap: "20px",
  },
  related: { settings: SectionBlockSettings },
};

export function ColumnsBlock({ children, snapAlign = "none", ...props }: LayoutBlockProps & { snapAlign?: "start" | "center" | "none" }) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame>
      <div
        style={{
          ...getGridStyle({ ...props, columns: props.columns ?? 2 }),
          ...(isMobile
            ? {
              ...mobileBoxOverrides(props),
              gap: capSpacing(props.gap, 14, "14px"),
              gridTemplateColumns: "minmax(0, 1fr)",
            }
            : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

ColumnsBlock.craft = {
  displayName: "Columns",
  isCanvas: true,
  props: {
    ...SectionBlock.craft.props,
    columns: 2,
    gap: "24px",
  },
  related: { settings: SectionBlockSettings },
};

type StackProps = BoxProps & {
  alignItems?: string;
  children?: ReactNode;
  gap?: SizeValue;
  justifyContent?: string;
  wrap?: string;
};

function stackStyle(props: StackProps, direction: "row" | "column") {
  return {
    ...buildBoxStyle(props),
    alignItems: props.alignItems || "stretch",
    display: "flex",
    flexDirection: direction,
    gap: withUnitFallback(props.gap, 16),
    justifyContent: props.justifyContent || "flex-start",
    flexWrap: (props.wrap as any) || "nowrap",
  } satisfies CSSProperties;
}

function StackSettings() {
  const {
    actions: { setProp },
    alignItems,
    gap,
    justifyContent,
    wrap,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    gap: node.data.props.gap,
    justifyContent: node.data.props.justifyContent,
    wrap: node.data.props.wrap,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Gap">
        <Input onChange={(event) => setProp((props: any) => (props.gap = event.target.value))} value={String(gap ?? "16px")} />
      </Field>
      <Field label="Align items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.alignItems = value))}
          value={String(alignItems ?? "stretch")}
        >
          <option value="stretch">Stretch</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="baseline">Baseline</option>
        </NativeSelect>
      </Field>
      <Field label="Justify content">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.justifyContent = value))}
          value={String(justifyContent ?? "flex-start")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
          <option value="space-around">Space Around</option>
          <option value="space-evenly">Space Evenly</option>
        </NativeSelect>
      </Field>
      <Field label="Wrap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.wrap = value))}
          value={String(wrap ?? "nowrap")}
        >
          <option value="nowrap">No Wrap</option>
          <option value="wrap">Wrap</option>
          <option value="wrap-reverse">Wrap Reverse</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

export function RowBlock({ children, ...props }: StackProps) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame>
      <div
        style={{
          ...stackStyle(props, "row"),
          ...(isMobile
            ? {
              ...mobileBoxOverrides(props),
              flexDirection: "column",
              gap: capSpacing(props.gap, 14, "14px"),
              flexWrap: "nowrap" as any,
            }
            : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

RowBlock.craft = {
  displayName: "Horizontal Wrapper",
  isCanvas: true,
  props: {
    ...defaultBoxProps(),
    alignItems: "stretch",
    gap: "16px",
    justifyContent: "flex-start",
    wrap: "wrap",
  },
  related: { settings: StackSettings },
};

export function VerticalStackBlock({ children, ...props }: StackProps) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame>
      <div
        style={{
          ...stackStyle(props, "column"),
          ...(isMobile
            ? {
              ...mobileBoxOverrides(props),
              gap: capSpacing(props.gap, 14, "14px"),
              flexWrap: "nowrap" as any,
            }
            : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

VerticalStackBlock.craft = {
  displayName: "Vertical Wrapper",
  isCanvas: true,
  props: {
    ...defaultBoxProps(),
    alignItems: "stretch",
    gap: "16px",
    justifyContent: "flex-start",
    wrap: "nowrap",
  },
  related: { settings: StackSettings },
};

type TextProps = BoxProps & {
  align?: Align;
  color?: string;
  letterSpacing?: SizeValue;
  lineHeight?: SizeValue;
  size?: SizeValue;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  text?: string;
  weight?: SizeValue;
};

export function TextBlock({
  align = "left",
  color = "var(--text-primary)",
  lineHeight = "1.5",
  size = "16px",
  tag = "p",
  text = "Write something here",
  weight = "400",
  ...props
}: TextProps) {
  const isMobile = useIsMobile();
  const Tag = tag;
  const mobileSize =
    typeof size === "string" && size.endsWith("px")
      ? `${Math.min(parsePixelLike(size) ?? 16, tag === "h1" ? 34 : tag === "h2" ? 28 : 18)}px`
      : withUnitFallback(size);

  return (
    <NodeFrame>
      <Tag
        style={{
          ...buildBoxStyle(props),
          ...(isMobile ? mobileBoxOverrides(props) : {}),
          color: resolveStyleToken(color),
          fontSize: isMobile ? mobileSize : withUnitFallback(size),
          fontWeight: typeof weight === "number" ? weight : weight,
          letterSpacing: withUnitFallback(props.letterSpacing),
          lineHeight: withUnitFallback(lineHeight),
          margin: 0,
          textAlign: align,
        }}
      >
        {text}
      </Tag>
    </NodeFrame>
  );
}

function TextBlockSettings() {
  const {
    actions: { setProp },
    align,
    color,
    lineHeight,
    size,
    tag,
    text,
    weight,
  } = useNode((node) => ({
    align: node.data.props.align,
    color: node.data.props.color,
    lineHeight: node.data.props.lineHeight,
    size: node.data.props.size,
    tag: node.data.props.tag,
    text: node.data.props.text,
    weight: node.data.props.weight,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Text">
        <Textarea
          className="min-h-32"
          onChange={(event) => setProp((props: any) => (props.text = event.target.value))}
          value={text}
        />
      </Field>
      <Field label="Tag">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.tag = value))} value={String(tag ?? "p")}>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="p">Paragraph</option>
          <option value="span">Span</option>
        </NativeSelect>
      </Field>
      <Field label="Align">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.align = value))} value={String(align ?? "left")}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </NativeSelect>
      </Field>
      <Field label="Text color">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.color = value))}
          value={String(color ?? "var(--text-primary)")}
        >
          <option value="var(--text-primary)">Primary Text</option>
          <option value="var(--text-secondary)">Secondary Text</option>
          <option value="var(--text-tertiary)">Tertiary Text</option>
          <option value="var(--text-inverse)">Inverse Text</option>
          <option value="var(--text-white)">White Text</option>
          <option value="var(--text-black)">Black Text</option>
          <option value="var(--brand-primary)">Brand Primary</option>
          <option value="var(--accent-gold)">Accent Gold</option>
        </NativeSelect>
      </Field>
      <DimensionFields
        getValue={(key) =>
          String(({ lineHeight, size, weight } as Record<string, unknown>)[key] ?? "")
        }
        labels={[
          { key: "size", label: "Font size" },
          { key: "weight", label: "Weight" },
          { key: "lineHeight", label: "Line height" },
        ]}
        onChange={(key, value) => setProp((props: any) => (props[key] = value))}
      />
      <BoxSettings includeBackground={false} />
    </div>
  );
}

TextBlock.craft = {
  displayName: "Text",
  props: {
    ...defaultBoxProps({ width: "100%" }),
    align: "left",
    color: "var(--text-primary)",
    lineHeight: "1.5",
    size: "16px",
    tag: "p",
    text: "Write something here",
    weight: "400",
  },
  related: { settings: TextBlockSettings },
};

const buttonVariantPresets = {
  primary: {
    backgroundColor: "var(--brand-primary)",
    borderColor: "var(--brand-primary)",
    color: "var(--text-inverse)",
    hoverClass: "hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    label: "Primary (Brand)",
  },
  secondary: {
    backgroundColor: "var(--bg-surface)",
    borderColor: "var(--border-strong)",
    color: "var(--text-primary)",
    hoverClass: "hover:bg-[var(--brand-muted)] hover:border-[var(--brand-primary)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    label: "Secondary (Surface)",
  },
  accent: {
    backgroundColor: "var(--accent-gold)",
    borderColor: "var(--accent-gold)",
    color: "#000000",
    hoverClass: "hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    label: "Accent (Gold)",
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: "var(--brand-primary)",
    color: "var(--brand-primary)",
    hoverClass: "hover:bg-[var(--brand-primary)] hover:text-[var(--text-inverse)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    label: "Outline",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "var(--text-secondary)",
    hoverClass: "hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] hover:-translate-y-0.5 active:translate-y-0",
    label: "Ghost",
  },
  danger: {
    backgroundColor: "var(--status-danger)",
    borderColor: "var(--status-danger)",
    color: "var(--text-inverse)",
    hoverClass: "hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    label: "Danger",
  },
} as const;

type ButtonVariantKey = keyof typeof buttonVariantPresets;

type ButtonProps = BoxProps & {
  align?: Align;
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: string;
  color?: string;
  href?: string;
  label?: string;
  size?: SizeValue;
  variant?: ButtonVariantKey;
};

export function ButtonBlock({
  align = "left",
  variant = "primary",
  backgroundColor,
  borderColor,
  borderRadius = "12px",
  borderStyle = "solid",
  borderWidth = "1px",
  color,
  href = "/",
  label = "Button",
  paddingBottom = "12px",
  paddingLeft = "20px",
  paddingRight = "20px",
  paddingTop = "12px",
  size = "14px",
  width = "fit-content",
  ...props
}: ButtonProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const isMobile = useIsMobile();

  const preset = buttonVariantPresets[variant as ButtonVariantKey] ?? buttonVariantPresets.primary;
  const activeBg = backgroundColor ?? preset.backgroundColor;
  const activeBorderColor = borderColor ?? preset.borderColor;
  const activeColor = color ?? preset.color;

  const sharedStyle: CSSProperties = {
    ...buildBoxStyle({
      ...props,
      borderColor: activeBorderColor,
      borderRadius,
      borderWidth,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingTop,
      width,
    }),
    background: resolveStyleToken(activeBg),
    borderStyle,
    color: resolveStyleToken(activeColor),
    display: "inline-flex",
    fontSize: withUnitFallback(size),
    fontWeight: 600,
    justifyContent: "center",
    textDecoration: "none",
    ...(isMobile
      ? {
        maxWidth: "100%",
      }
      : {}),
  };

  return (
    <NodeFrame>
      <div style={{ textAlign: align }}>
        {enabled ? (
          <span
            className={cn("transition-all duration-200 cursor-pointer select-none", preset.hoverClass)}
            style={sharedStyle}
          >
            {label}
          </span>
        ) : (
          <Link
            className={cn("transition-all duration-200 cursor-pointer select-none", preset.hoverClass)}
            href={href || "#"}
            style={sharedStyle}
          >
            {label}
          </Link>
        )}
      </div>
    </NodeFrame>
  );
}

function ButtonBlockSettings() {
  const {
    actions: { setProp },
    align,
    href,
    label,
    size,
    variant,
  } = useNode((node) => ({
    align: node.data.props.align,
    href: node.data.props.href,
    label: node.data.props.label,
    size: node.data.props.size,
    variant: node.data.props.variant,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Label">
        <Input onChange={(event) => setProp((props: any) => (props.label = event.target.value))} value={label} />
      </Field>
      <Field label="Link">
        <Input onChange={(event) => setProp((props: any) => (props.href = event.target.value))} value={href} />
      </Field>
      <Field label="Align">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.align = value))} value={String(align ?? "left")}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </NativeSelect>
      </Field>
      <Field label="Variant">
        <NativeSelect
          onChange={(value) =>
            setProp((props: any) => {
              props.variant = value;
              const preset = buttonVariantPresets[value as ButtonVariantKey];
              if (preset) {
                props.backgroundColor = preset.backgroundColor;
                props.borderColor = preset.borderColor;
                props.color = preset.color;
              }
            })
          }
          value={String(variant ?? "primary")}
        >
          {Object.entries(buttonVariantPresets).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <DimensionFields
        getValue={(key) => String(({ size } as Record<string, unknown>)[key] ?? "")}
        labels={[
          { key: "size", label: "Font size" },
        ]}
        onChange={(key, value) => setProp((props: any) => (props[key] = value))}
      />
      <BoxSettings includeBackground={false} />
    </div>
  );
}

ButtonBlock.craft = {
  displayName: "Button",
  props: {
    ...defaultBoxProps({
      width: "fit-content",
    }),
    align: "left",
    variant: "primary",
    backgroundColor: "var(--brand-primary)",
    borderColor: "var(--brand-primary)",
    borderRadius: "12px",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "var(--text-inverse)",
    href: "/",
    label: "Button",
    paddingBottom: "12px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "12px",
    size: "14px",
  },
  related: { settings: ButtonBlockSettings },
};

type ImageProps = BoxProps & {
  alt?: string;
  fit?: string;
  kind?: "embed" | "image";
  title?: string;
  url?: string;
};

export function ImageBlock({
  alt = "Media",
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "18px",
  borderWidth = "1px",
  fit = "cover",
  height = "320px",
  kind = "embed",
  title = "Media",
  url = "",
  width = "100%",
  ...props
}: ImageProps) {
  const isMobile = useIsMobile();
  const effectiveUrl = typeof url === "string" ? toEmbedUrl(url, kind) : url;
  const mobileHeight =
    isMobile && parsePixelLike(height) && (parsePixelLike(height) ?? 0) > 320
      ? "280px"
      : undefined;
  const frameStyle = buildBoxStyle({
    ...props,
    background,
    borderColor,
    borderRadius,
    borderWidth,
    height: mobileHeight ?? height,
    width,
  });

  return (
    <NodeFrame>
      <div className="overflow-hidden" style={frameStyle}>
        <div
          className="h-full w-full"
          style={
            mobileHeight
              ? {
                height: mobileHeight,
              }
              : undefined
          }
        >
          {url ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={alt}
                className="block h-full w-full border-0"
                src={effectiveUrl}
                style={{ objectFit: fit as any }}
              />
            ) : (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="block h-full w-full"
                referrerPolicy="strict-origin-when-cross-origin"
                src={effectiveUrl}
                title={title}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
              Add a media URL
            </div>
          )}
        </div>
      </div>
    </NodeFrame>
  );
}

function ImageBlockSettings() {
  const {
    actions: { setProp },
    fit,
    kind,
    title,
    url,
  } = useNode((node) => ({
    fit: node.data.props.fit,
    kind: node.data.props.kind,
    title: node.data.props.title,
    url: node.data.props.url,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Media type">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.kind = value))} value={String(kind ?? "embed")}>
          <option value="embed">Embed</option>
          <option value="image">Image</option>
        </NativeSelect>
      </Field>
      <Field label="URL">
        <Input onChange={(event) => setProp((props: any) => (props.url = event.target.value))} value={url} />
      </Field>
      <Field label="Title">
        <Input onChange={(event) => setProp((props: any) => (props.title = event.target.value))} value={title} />
      </Field>
      <Field label="Fit">
        <Input onChange={(event) => setProp((props: any) => (props.fit = event.target.value))} value={String(fit ?? "cover")} />
      </Field>
      <BoxSettings />
    </div>
  );
}

ImageBlock.craft = {
  displayName: "Image / Media",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "18px",
      borderWidth: "1px",
      height: "320px",
      width: "100%",
    }),
    alt: "Media",
    fit: "cover",
    kind: "embed",
    title: "Media",
    url: "",
  },
  related: { settings: ImageBlockSettings },
};

type SeparatorProps = BoxProps & {
  color?: string;
  thickness?: SizeValue;
};

export function SeparatorBlock({
  color = "var(--border-subtle)",
  thickness = "1px",
  width = "100%",
  ...props
}: SeparatorProps) {
  return (
    <NodeFrame>
      <div
        style={{
          ...buildBoxStyle(props),
          background: resolveStyleToken(color),
          height: withUnitFallback(thickness),
          width: withUnitFallback(width),
        }}
      />
    </NodeFrame>
  );
}

function SeparatorBlockSettings() {
  const {
    actions: { setProp },
    color,
    thickness,
  } = useNode((node) => ({
    color: node.data.props.color,
    thickness: node.data.props.thickness,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Color">
        <Input onChange={(event) => setProp((props: any) => (props.color = event.target.value))} value={String(color ?? "")} />
      </Field>
      <Field label="Thickness">
        <Input onChange={(event) => setProp((props: any) => (props.thickness = event.target.value))} value={String(thickness ?? "1px")} />
      </Field>
      <BoxSettings includeBackground={false} />
    </div>
  );
}

SeparatorBlock.craft = {
  displayName: "Separator",
  props: {
    ...defaultBoxProps({ width: "100%" }),
    color: "var(--border-subtle)",
    thickness: "1px",
  },
  related: { settings: SeparatorBlockSettings },
};

type IconBoxProps = BoxProps & {
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  description?: string;
  icon?: string;
  iconColor?: string;
  iconSize?: SizeValue;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  title?: string;
};

export function IconBoxBlock({
  alignItems = "flex-start",
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "24px",
  borderWidth = "1px",
  description = "Describe this feature or value proposition.",
  icon = "★",
  iconColor = "var(--brand-primary)",
  iconSize = "28px",
  justifyContent = "flex-start",
  paddingBottom = "24px",
  paddingLeft = "24px",
  paddingRight = "24px",
  paddingTop = "24px",
  title = "Icon Box",
  ...props
}: IconBoxProps) {
  return (
    <NodeFrame>
      <div
        className="flex flex-col gap-3"
        style={{
          ...buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop }),
          alignItems,
          justifyContent,
          textAlign: alignItems === "center" ? "center" : alignItems === "flex-end" ? "right" : "left",
        }}
      >
        <div style={{ color: resolveStyleToken(iconColor), fontSize: withUnitFallback(iconSize), lineHeight: 1 }}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
    </NodeFrame>
  );
}

function IconBoxBlockSettings() {
  const {
    actions: { setProp },
    alignItems,
    description,
    icon,
    iconColor,
    iconSize,
    justifyContent,
    title,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    description: node.data.props.description,
    icon: node.data.props.icon,
    iconColor: node.data.props.iconColor,
    iconSize: node.data.props.iconSize,
    justifyContent: node.data.props.justifyContent,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Align items">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.alignItems = value))} value={String(alignItems ?? "flex-start")}>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </NativeSelect>
      </Field>
      <Field label="Justify content">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.justifyContent = value))} value={String(justifyContent ?? "flex-start")}>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space between</option>
        </NativeSelect>
      </Field>
      <Field label="Icon">
        <Input onChange={(event) => setProp((props: any) => (props.icon = event.target.value))} value={icon} />
      </Field>
      <Field label="Title">
        <Input onChange={(event) => setProp((props: any) => (props.title = event.target.value))} value={title} />
      </Field>
      <Field label="Description">
        <Textarea
          className="min-h-24"
          onChange={(event) => setProp((props: any) => (props.description = event.target.value))}
          value={description}
        />
      </Field>
      <Field label="Icon color">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.iconColor = value))}
          value={String(iconColor ?? "var(--brand-primary)")}
        >
          <option value="var(--brand-primary)">Brand Primary</option>
          <option value="var(--accent-gold)">Accent Gold</option>
          <option value="var(--text-primary)">Primary Text</option>
          <option value="var(--text-secondary)">Secondary Text</option>
        </NativeSelect>
      </Field>
      <DimensionFields
        getValue={(key) => String(({ iconSize } as Record<string, unknown>)[key] ?? "")}
        labels={[
          { key: "iconSize", label: "Icon size" },
        ]}
        onChange={(key, value) => setProp((props: any) => (props[key] = value))}
      />
      <BoxSettings />
    </div>
  );
}

IconBoxBlock.craft = {
  displayName: "Icon Box",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "24px",
      borderWidth: "1px",
      paddingBottom: "24px",
      paddingLeft: "24px",
      paddingRight: "24px",
      paddingTop: "24px",
      width: "100%",
    }),
    alignItems: "flex-start",
    description: "Describe this feature or value proposition.",
    icon: "★",
    iconColor: "var(--brand-primary)",
    iconSize: "28px",
    justifyContent: "flex-start",
    title: "Icon Box",
  },
  related: { settings: IconBoxBlockSettings },
};

function parsePairs(raw: string, fallback: Array<{ content: string; title: string }>) {
  const items = raw
    .split("\n\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, ...contentParts] = item.split("::");
      return {
        content: contentParts.join("::").trim() || "Content",
        title: title.trim() || "Item",
      };
    });

  return items.length ? items : fallback;
}

type DisclosureProps = BoxProps & {
  items?: string;
};

export function AccordionBlock({
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "20px",
  borderWidth = "1px",
  items = "Question one::Answer one\n\nQuestion two::Answer two",
  paddingBottom = "12px",
  paddingLeft = "12px",
  paddingRight = "12px",
  paddingTop = "12px",
  ...props
}: DisclosureProps) {
  const entries = useMemo(
    () => parsePairs(items, [{ content: "Answer one", title: "Question one" }]),
    [items],
  );
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <NodeFrame>
      <div className="grid gap-3" style={buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop })}>
        {entries.map((item, index) => (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]" key={`${item.title}-${index}`}>
            <button
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)]"
              onClick={() => setOpenIndex(index)}
              type="button"
            >
              <span>{item.title}</span>
              <span>{openIndex === index ? "-" : "+"}</span>
            </button>
            {openIndex === index ? (
              <div className="px-4 pb-4 text-sm leading-6 text-[var(--text-secondary)]">{item.content}</div>
            ) : null}
          </div>
        ))}
      </div>
    </NodeFrame>
  );
}

function AccordionBlockSettings() {
  const {
    actions: { setProp },
    items,
  } = useNode((node) => ({
    items: node.data.props.items,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Items (`Title::Content`)">
        <Textarea
          className="min-h-32"
          onChange={(event) => setProp((props: any) => (props.items = event.target.value))}
          value={items}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

AccordionBlock.craft = {
  displayName: "Accordion",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "20px",
      borderWidth: "1px",
      paddingBottom: "12px",
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "12px",
      width: "100%",
    }),
    items: "Question one::Answer one\n\nQuestion two::Answer two",
  },
  related: { settings: AccordionBlockSettings },
};

export function TabsBlock({
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "20px",
  borderWidth = "1px",
  items = "Tab one::Panel one\n\nTab two::Panel two",
  paddingBottom = "16px",
  paddingLeft = "16px",
  paddingRight = "16px",
  paddingTop = "16px",
  ...props
}: DisclosureProps) {
  const entries = useMemo(
    () => parsePairs(items, [{ content: "Panel one", title: "Tab one" }]),
    [items],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <NodeFrame>
      <div className="grid gap-4" style={buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop })}>
        <div className="flex flex-wrap gap-2">
          {entries.map((item, index) => (
            <button
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                activeIndex === index
                  ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]"
                  : "bg-[var(--bg-base)] text-[var(--text-secondary)]",
              )}
              key={`${item.title}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--bg-base)] px-4 py-5 text-sm leading-6 text-[var(--text-secondary)]">
          {entries[activeIndex]?.content}
        </div>
      </div>
    </NodeFrame>
  );
}

function TabsBlockSettings() {
  const {
    actions: { setProp },
    items,
  } = useNode((node) => ({
    items: node.data.props.items,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Tabs (`Title::Content`)">
        <Textarea
          className="min-h-32"
          onChange={(event) => setProp((props: any) => (props.items = event.target.value))}
          value={items}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

TabsBlock.craft = {
  displayName: "Tabs",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-surface)",
      borderColor: "var(--border-subtle)",
      borderRadius: "20px",
      borderWidth: "1px",
      paddingBottom: "16px",
      paddingLeft: "16px",
      paddingRight: "16px",
      paddingTop: "16px",
      width: "100%",
    }),
    items: "Tab one::Panel one\n\nTab two::Panel two",
  },
  related: { settings: TabsBlockSettings },
};

function FeedCard({
  accent,
  coverImage,
  description,
  href,
  isActive = false,
  kicker,
  style = "cinematic",
  title,
}: {
  accent?: string;
  coverImage?: string | null;
  description: string;
  href: string;
  isActive?: boolean;
  kicker: string;
  style?: FeedCardStyle;
  title: string;
}) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const hasRealCover = Boolean(coverImage);
  const accentColor = resolveStyleToken(accent) ?? "var(--brand-primary)";

  const cinematicContent = (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-[var(--hero-panel-border)] bg-[var(--text-primary)]">
      {hasRealCover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={coverImage || ""}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 20% 20%, color-mix(in srgb, ${accentColor} 38%, transparent) 0%, transparent 26%), radial-gradient(circle at 78% 30%, rgba(255,255,255,0.08) 0%, transparent 18%), linear-gradient(145deg, color-mix(in srgb, var(--text-primary) 88%, black) 0%, color-mix(in srgb, var(--bg-base) 92%, black) 100%)`,
            }}
          />
          <div className="absolute -left-10 top-10 h-28 w-28 rounded-full border border-[var(--hero-panel-border)]" />
          <div className="absolute right-10 top-16 h-3 w-20 rounded-full bg-[var(--hero-panel)] backdrop-blur-sm" />
          <div className="absolute bottom-24 left-10 h-px w-32 bg-[var(--hero-panel-border)]" />
          <div className="absolute bottom-14 right-16 h-24 w-24 rotate-12 rounded-2xl bg-[var(--hero-secondary-bg)]" />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 grid gap-3 p-6">
        <span className="inline-flex w-fit rounded-full border border-[var(--hero-panel-border)] bg-[var(--hero-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-inverse)] backdrop-blur-md">
          {kicker}
        </span>
        <h3 className="max-w-[24rem] text-[clamp(1.35rem,2.2vw,2.15rem)] font-semibold leading-[1.08] text-[var(--text-inverse)]">
          {title}
        </h3>
        <p className="max-w-[28rem] text-sm leading-6 text-[var(--text-inverse-muted)]">
          {description}
        </p>
      </div>
    </div>
  );

  const cover = (
    <div className="relative min-h-44 overflow-hidden bg-[var(--bg-card-strong)]">
      {hasRealCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          src={coverImage || ""}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 20%, var(--bg-card)) 0%, var(--bg-card-strong) 100%)` }}
        />
      )}
    </div>
  );

  const editorialContent = (
    <div className="overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="aspect-[16/9]">{cover}</div>
      <div className="grid gap-3 p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{kicker}</span>
        <h3 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
  );

  const minimalContent = (
    <div className="flex min-h-72 flex-col justify-between border-y border-[var(--border-strong)] bg-transparent px-2 py-6">
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--accent-gold)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{kicker}</span>
        </div>
        <h3 className="max-w-xl text-3xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
      </div>
      <span className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">Read more</span>
    </div>
  );

  const splitContent = (
    <div className="grid min-h-72 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] sm:grid-cols-[0.9fr_1.1fr]">
      {cover}
      <div className="flex flex-col justify-center gap-4 p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{kicker}</span>
        <h3 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">View details</span>
      </div>
    </div>
  );

  const cardContent = style === "editorial"
    ? editorialContent
    : style === "minimal"
      ? minimalContent
      : style === "split"
        ? splitContent
        : cinematicContent;

  const sharedClassName = cn(
    "group relative block overflow-hidden transition duration-500",
    style === "cinematic" && "rounded-[2rem]",
    isActive ? "scale-100 opacity-100 shadow-[var(--shadow-lg)]" : "scale-[0.94] opacity-55",
  );

  if (enabled) {
    return (
      <div className={sharedClassName}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      className={cn(
        sharedClassName,
      )}
      href={href}
    >
      {cardContent}
    </Link>
  );
}

type FeedProps = BoxProps & {
  autoPlay?: boolean;
  cardStyle?: FeedCardStyle;
  columns?: number | string;
  emptyMessage?: string;
  feedType?: FeedType;
  href?: string;
  gap?: SizeValue;
  intervalMs?: number | string;
  itemsPerScreen?: number | string;
  slideWidth?: SizeValue;
};

export function FeedCarouselBlock({
  autoPlay = true,
  background = "transparent",
  cardStyle = "cinematic",
  columns = 3,
  emptyMessage = "No content yet.",
  feedType = "articles",
  gap = "16px",
  href = "/",
  intervalMs = 5000,
  itemsPerScreen = 1,
  slideWidth = "56%",
  ...props
}: FeedProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const isMobile = useIsMobile();
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const articlesQuery = useArticlesQuery({ status: "published", take: 8 });
  const coursesQuery = useCoursesQuery({ status: "published", take: 8 });
  const eventsQuery = useEventsQuery({ audience: "public", status: "published", upcoming: true, take: 8 });

  const articleItems = articlesQuery.data?.items ?? [];
  const courseItems = coursesQuery.data?.items ?? [];
  const eventItems = eventsQuery.data?.items ?? [];

  const items: FeedItem[] =
    feedType === "courses"
      ? courseItems.map((course) => ({
        accent: "var(--brand-primary)",
        coverImage: course.cover_image_url,
        description: course.summary_vi ?? course.summary_en ?? "Published course",
        href: `/course/${course.slug}`,
        id: course.id,
        kicker: course.category?.name_vi ?? course.category?.name_en ?? "",
        slug: course.slug,
        title: course.title_vi || course.title_en,
      }))
      : feedType === "events"
        ? eventItems.map((event) => ({
          accent: event.color ?? undefined,
          coverImage: event.cover_image_url ?? null,
          description: event.description ?? "",
          href: "/event",
          id: event.id,
          kicker: event.location ?? "",
          slug: event.slug,
          title: event.title,
        }))
        : articleItems.map((article) => ({
          accent: "var(--brand-primary)",
          coverImage: article.cover_image_url,
          description: (article.category?.name_vi || article.category?.name_en) ?? "Published article",
          href: `/article/${article.slug}`,
          id: article.id,
          kicker: article.status,
          slug: article.slug,
          title: article.title_vi || article.title_en,
        }));

  const isLoading =
    feedType === "articles"
      ? articlesQuery.isLoading
      : feedType === "courses"
        ? coursesQuery.isLoading
        : feedType === "events"
          ? eventsQuery.isLoading
          : false;

  const slideInterval = Math.max(1000, parseNumberLike(intervalMs, 5000));
  const visibleItems = isMobile ? 1 : Math.min(4, Math.max(1, Math.floor(parseNumberLike(itemsPerScreen, 1))));
  const lastStartIndex = Math.max(0, items.length - visibleItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, lastStartIndex);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [feedType]);

  useEffect(() => {
    if (!autoPlay || enabled || lastStartIndex === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % (lastStartIndex + 1));
    }, slideInterval);

    return () => window.clearInterval(timer);
  }, [autoPlay, enabled, items.length, lastStartIndex, slideInterval]);

  const gapValue = isMobile ? "12px" : withUnitFallback(gap, "16px") ?? "16px";
  const effectiveSlideWidth = isMobile
    ? "86%"
    : visibleItems > 1
      ? `calc((100% - (${gapValue} * ${visibleItems - 1})) / ${visibleItems})`
      : withUnitFallback(slideWidth, "56%") ?? "56%";
  const trackOffset = visibleItems > 1
    ? `calc(0px - (${safeActiveIndex} * (${effectiveSlideWidth} + ${gapValue})))`
    : `calc(50% - (${effectiveSlideWidth} / 2) - (${safeActiveIndex} * (${effectiveSlideWidth} + ${gapValue})))`;

  function goToSlide(index: number) {
    if (!items.length) return;
    const availableStarts = lastStartIndex + 1;
    const nextIndex = (index + availableStarts) % availableStarts;
    setActiveIndex(nextIndex);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isAnchorTarget(event.target)) return;
    if (items.length <= 1) return;
    dragStartXRef.current = event.clientX;
    dragDeltaRef.current = 0;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (isAnchorTarget(event.target)) return;
    if (dragStartXRef.current === null) return;
    const delta = event.clientX - dragStartXRef.current;
    dragDeltaRef.current = delta;
    setDragOffset(delta);
  }

  function finishDrag() {
    if (dragStartXRef.current === null) return;
    const threshold = 60;
    const delta = dragDeltaRef.current;

    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        goToSlide(safeActiveIndex + 1);
      } else {
        goToSlide(safeActiveIndex - 1);
      }
    }

    dragStartXRef.current = null;
    dragDeltaRef.current = 0;
    setDragOffset(0);
  }

  return (
    <NodeFrame>
      <div className="grid gap-4" style={buildBoxStyle({ ...props, background })}>
        {isLoading ? (
          <div
            className="grid"
            style={{
              gap: withUnitFallback(gap, "16px"),
              gridTemplateColumns: `repeat(${Math.max(1, parseNumberLike(columns, 3))}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: Math.max(1, parseNumberLike(columns, 3)) }).map((_, index) => (
              <div
                className="h-40 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                key={index}
              />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-4">
            <div className="relative mx-auto w-full overflow-hidden">
              <div
                className="overflow-hidden py-2"
                onPointerCancel={finishDrag}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                style={{ touchAction: "pan-y" }}
              >
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    gap: gapValue,
                    paddingLeft: "0px",
                    transform: `translateX(calc(${trackOffset} + ${dragOffset}px))`,
                  }}
                >
                  {items.map((item, index) => (
                    <div
                      className="shrink-0"
                      key={`${feedType}-${index}-${item.href}-${item.title}`}
                      style={{ flexBasis: effectiveSlideWidth }}
                    >
                      <FeedCard
                        accent={item.accent}
                        coverImage={item.coverImage}
                        description={item.description}
                        href={resolveFeedCardHref(item, href)}
                        isActive={index >= safeActiveIndex && index < safeActiveIndex + visibleItems}
                        kicker={item.kicker}
                        style={cardStyle}
                        title={item.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {lastStartIndex > 0 ? (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: lastStartIndex + 1 }).map((_, index) => (
                  <button
                    aria-label={`Go to slide ${index + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      index === safeActiveIndex
                        ? "h-2.5 w-7 bg-[var(--brand-primary)]"
                        : "h-2.5 w-2.5 bg-[var(--border-subtle)]",
                    )}
                    key={`feed-dot-${index}`}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 text-sm text-[var(--text-secondary)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </NodeFrame>
  );
}

function FeedCarouselBlockSettings() {
  const {
    actions: { setProp },
    autoPlay,
    cardStyle,
    columns,
    emptyMessage,
    feedType,
    gap,
    href,
    intervalMs,
    itemsPerScreen,
    slideWidth,
  } = useNode((node) => ({
    autoPlay: node.data.props.autoPlay,
    cardStyle: node.data.props.cardStyle,
    columns: node.data.props.columns,
    emptyMessage: node.data.props.emptyMessage,
    feedType: node.data.props.feedType,
    gap: node.data.props.gap,
    href: node.data.props.href,
    intervalMs: node.data.props.intervalMs,
    itemsPerScreen: node.data.props.itemsPerScreen,
    slideWidth: node.data.props.slideWidth,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Card style">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.cardStyle = value))} value={String(cardStyle ?? "cinematic")}>
          <option value="cinematic">Cinematic (existing)</option>
          <option value="editorial">Editorial</option>
          <option value="minimal">Minimal</option>
          <option value="split">Split image</option>
        </NativeSelect>
      </Field>
      <Field label="Feed type">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.feedType = value))} value={String(feedType ?? "articles")}>
          <option value="articles">Articles</option>
          <option value="courses">Courses</option>
          <option value="events">Events</option>
        </NativeSelect>
      </Field>
      <Field label="Columns">
        <Input onChange={(event) => setProp((props: any) => (props.columns = event.target.value))} value={String(columns ?? 3)} />
      </Field>
      <Field label="Items per screen">
        <NativeSelect onChange={(value) => setProp((props: any) => (props.itemsPerScreen = value))} value={String(itemsPerScreen ?? 1)}>
          <option value="1">1 item</option>
          <option value="2">2 items</option>
          <option value="3">3 items</option>
          <option value="4">4 items</option>
        </NativeSelect>
      </Field>
      <Field label="Slide width">
        <Input
          onChange={(event) => setProp((props: any) => (props.slideWidth = event.target.value))}
          value={String(slideWidth ?? "56%")}
        />
      </Field>
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
          value={String(intervalMs ?? 5000)}
        />
      </Field>
      <Field label="Gap">
        <Input onChange={(event) => setProp((props: any) => (props.gap = event.target.value))} value={String(gap ?? "16px")} />
      </Field>
      <Field label="Feed card href">
        <Input
          onChange={(event) => setProp((props: any) => (props.href = event.target.value))}
          placeholder="Leave blank for built-in post links, or use /article/{slug}"
          value={href}
        />
      </Field>
      <Field label="Empty state">
        <Textarea
          className="min-h-24"
          onChange={(event) => setProp((props: any) => (props.emptyMessage = event.target.value))}
          value={emptyMessage}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

FeedCarouselBlock.craft = {
  displayName: "Feed Carousel",
  props: {
    ...defaultBoxProps({
      background: "transparent",
      width: "100%",
    }),
    autoPlay: true,
    cardStyle: "cinematic",
    columns: 3,
    emptyMessage: "No content yet.",
    feedType: "articles",
    gap: "16px",
    href: "",
    intervalMs: 5000,
    itemsPerScreen: 1,
    slideWidth: "56%",
  },
  related: { settings: FeedCarouselBlockSettings },
};

export function RenderNodeSettings() {
  const { actions, query, selectedId, settings: SettingsComponent, displayName } = useEditor(
    (state: any, query) => {
      const id = Array.from(state.events.selected || [])[0] as string | undefined;
      if (!id) return { displayName: null, selectedId: null, settings: null };
      const node = query.node(id).get();
      return {
        displayName: node.data.displayName,
        selectedId: id,
        settings: node.related?.settings ?? null,
      };
    },
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<EditorBreakpoint>("desktop");

  useEffect(() => {
    if (selectedId) setIsOpen(true);
  }, [selectedId]);

  if (!SettingsComponent || !selectedId || !isOpen) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:w-[26rem] md:max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Selected
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{displayName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {query.node(selectedId).isDeletable() ? (
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                onClick={() => {
                  actions.delete(selectedId);
                  setIsOpen(false);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid max-h-[65vh] overflow-y-auto md:max-h-[70vh]">
          {selectedId !== "ROOT" ? (
            <div className="sticky top-0 z-10 grid grid-cols-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 pt-2 md:px-5">
              {(["desktop", "tablet", "mobile"] as const).map((breakpoint) => (
                <button
                  className={cn(
                    "border-b-2 px-2 py-2.5 text-xs font-semibold capitalize transition-colors",
                    activeBreakpoint === breakpoint
                      ? "border-[var(--accent-gold)] text-[var(--brand-primary)]"
                      : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                  )}
                  key={breakpoint}
                  onClick={() => setActiveBreakpoint(breakpoint)}
                  type="button"
                >
                  {breakpoint}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 px-4 py-4 md:px-5">
            <EditorBreakpointContext.Provider value={selectedId === "ROOT" ? "desktop" : activeBreakpoint}>
              <SettingsComponent />
            </EditorBreakpointContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolboxRow({
  icon,
  label,
  onRef,
}: {
  icon: ReactNode;
  label: string;
  onRef: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-11 w-full items-center gap-3 rounded-md px-2 text-left text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--text-primary)]"
      ref={onRef}
      title={label}
      type="button"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-base)] text-[var(--brand-primary)]">
        {icon}
      </span>
      <span className="truncate text-xs font-medium">{label}</span>
    </button>
  );
}

export function PageBuilderToolbox({ horizontal = false }: { horizontal?: boolean }) {
  const { connectors } = useEditor();

  return (
    <div className="grid gap-2">
      <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        Components
      </p>
      <div
        className={cn(
          "grid gap-1",
          horizontal
            ? "grid-flow-col grid-rows-2 auto-cols-[11rem] justify-start overflow-x-auto md:grid-flow-row md:grid-cols-1 md:grid-rows-none md:overflow-y-auto"
            : "grid-cols-1 overflow-y-auto",
        )}
      >
        <ToolboxRow
          icon={<LayoutPanelTop className="h-4 w-4" />}
          label="Container"
          onRef={(ref) => ref && connectors.create(ref, <Element canvas is={SectionBlock} />)}
        />
        <ToolboxRow
          icon={<Columns2 className="h-4 w-4" />}
          label="Columns"
          onRef={(ref) => ref && connectors.create(ref, <Element canvas is={ColumnsBlock} />)}
        />
        <ToolboxRow
          icon={<Rows3 className="h-4 w-4" />}
          label="Horizontal Wrapper"
          onRef={(ref) => ref && connectors.create(ref, <Element canvas is={RowBlock} />)}
        />
        <ToolboxRow
          icon={<AlignJustify className="h-4 w-4" />}
          label="Vertical Wrapper"
          onRef={(ref) => ref && connectors.create(ref, <Element canvas is={VerticalStackBlock} />)}
        />
        <ToolboxRow
          icon={<Type className="h-4 w-4" />}
          label="Text"
          onRef={(ref) => ref && connectors.create(ref, <TextBlock />)}
        />
        <ToolboxRow
          icon={<RectangleHorizontal className="h-4 w-4" />}
          label="Button"
          onRef={(ref) => ref && connectors.create(ref, <ButtonBlock />)}
        />
        <ToolboxRow
          icon={<Star className="h-4 w-4" />}
          label="Icon Box"
          onRef={(ref) => ref && connectors.create(ref, <IconBoxBlock />)}
        />
        <ToolboxRow
          icon={<ImageIcon className="h-4 w-4" />}
          label="Image / Media"
          onRef={(ref) => ref && connectors.create(ref, <ImageBlock kind="image" />)}
        />
        <ToolboxRow
          icon={<MonitorPlay className="h-4 w-4" />}
          label="Embed"
          onRef={(ref) => ref && connectors.create(ref, <ImageBlock kind="embed" />)}
        />
        <ToolboxRow
          icon={<Minus className="h-4 w-4" />}
          label="Separator"
          onRef={(ref) => ref && connectors.create(ref, <SeparatorBlock />)}
        />
        <ToolboxRow
          icon={<SquareDashedBottom className="h-4 w-4" />}
          label="Accordion"
          onRef={(ref) => ref && connectors.create(ref, <AccordionBlock />)}
        />
        <ToolboxRow
          icon={<PanelTop className="h-4 w-4" />}
          label="Tabs"
          onRef={(ref) => ref && connectors.create(ref, <TabsBlock />)}
        />
        <ToolboxRow
          icon={<Newspaper className="h-4 w-4" />}
          label="Feed"
          onRef={(ref) => ref && connectors.create(ref, <FeedCarouselBlock />)}
        />
        <ToolboxRow
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Grid"
          onRef={(ref) => ref && connectors.create(ref, <Element canvas is={ColumnsBlock} columns={3} />)}
        />
      </div>
    </div>
  );
}

type PageComponentNode = {
  data: {
    displayName?: string;
    linkedNodes?: Record<string, string>;
    nodes?: string[];
  };
};

export function PageComponentList() {
  const { actions, nodes, selectedIds } = useEditor((state: any) => ({
    nodes: state.nodes as Record<string, PageComponentNode>,
    selectedIds: Array.from(state.events.selected ?? []) as string[],
  }));

  const components = useMemo(() => {
    const result: Array<{ depth: number; id: string; label: string }> = [];
    const visited = new Set<string>();

    function visit(id: string, depth: number) {
      if (visited.has(id)) return;
      const node = nodes[id];
      if (!node) return;

      visited.add(id);
      result.push({
        depth,
        id,
        label: id === "ROOT" ? "Page" : node.data.displayName || "Component",
      });

      const childIds = [
        ...(node.data.nodes ?? []),
        ...Object.values(node.data.linkedNodes ?? {}),
      ];
      childIds.forEach((childId) => visit(childId, depth + 1));
    }

    visit("ROOT", 0);
    return result;
  }, [nodes]);

  return (
    <div className="grid gap-2 border-t border-[var(--border-subtle)] pt-3">
      <p className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        <Layers3 className="h-3.5 w-3.5" />
        Current page
      </p>
      <div className="grid gap-0.5">
        {components.map((component) => {
          const selected = selectedIds.includes(component.id);

          return (
            <button
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex min-h-9 w-full items-center border-l-2 py-2 pr-2 text-left text-xs transition-colors",
                selected
                  ? "border-[var(--accent-gold)] bg-[var(--brand-soft)] font-semibold text-[var(--brand-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
              key={component.id}
              onClick={() => actions.selectNode(component.id)}
              style={{ paddingLeft: `${8 + component.depth * 14}px` }}
              type="button"
            >
              <span className="truncate">{component.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const craftResolver = {
  AccordionBlock,
  ButtonBlock,
  ColumnsBlock,
  FeedCarouselBlock,
  IconBoxBlock,
  ImageBlock,
  PageCanvas,
  RowBlock,
  SectionBlock,
  SeparatorBlock,
  TabsBlock,
  TextBlock,
  VerticalStackBlock,
};
