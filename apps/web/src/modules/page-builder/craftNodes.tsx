"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Element, useEditor, useNode } from "@craftjs/core";
import {
  AlignJustify,
  Columns2,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LayoutPanelTop,
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
import { useArticlesQuery } from "@services/article";
import { useCoursesQuery } from "@services/course";
import { Input, Textarea, cn } from "@/components/ui";
import { eventMockData } from "@/mockData";

type Align = "left" | "center" | "right";
type SizeValue = number | string;
type FeedType = "articles" | "courses" | "events";

type BoxProps = {
  background?: string;
  borderColor?: string;
  borderRadius?: SizeValue;
  borderWidth?: SizeValue;
  height?: SizeValue;
  margin?: string;
  marginBottom?: SizeValue;
  marginLeft?: SizeValue;
  marginRight?: SizeValue;
  marginTop?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  minWidth?: SizeValue;
  padding?: string;
  paddingBottom?: SizeValue;
  paddingLeft?: SizeValue;
  paddingRight?: SizeValue;
  paddingTop?: SizeValue;
  width?: SizeValue;
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
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }

      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }
    }

    if (host === "vimeo.com") {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

function isPlaceholderImage(url?: string | null) {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return host === "placehold.co" || host === "via.placeholder.com";
  } catch {
    return false;
  }
}

function buildBoxStyle(props: BoxProps): CSSProperties {
  const paddingTop = withUnitFallback(props.paddingTop);
  const paddingRight = withUnitFallback(props.paddingRight);
  const paddingBottom = withUnitFallback(props.paddingBottom);
  const paddingLeft = withUnitFallback(props.paddingLeft);
  const marginTop = withUnitFallback(props.marginTop);
  const marginRight = withUnitFallback(props.marginRight);
  const marginBottom = withUnitFallback(props.marginBottom);
  const marginLeft = withUnitFallback(props.marginLeft);

  return {
    background: resolveStyleToken(props.background),
    borderColor: resolveStyleToken(props.borderColor) ?? "transparent",
    borderRadius: withUnitFallback(props.borderRadius, 0),
    borderStyle: "solid",
    borderWidth: withUnitFallback(props.borderWidth, 0),
    height: withUnitFallback(props.height),
    margin: props.margin,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    maxWidth: withUnitFallback(props.maxWidth),
    minHeight: withUnitFallback(props.minHeight),
    minWidth: withUnitFallback(props.minWidth),
    padding: props.padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    width: withUnitFallback(props.width),
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
  return {
    borderRadius: capSpacing(props.borderRadius, 20, "20px"),
    marginLeft: resolveStyleToken(props.marginLeft) ?? "0px",
    marginRight: resolveStyleToken(props.marginRight) ?? "0px",
    maxWidth: "100%",
    minWidth: "0px",
    padding: props.padding ? "20px 16px" : undefined,
    paddingBottom: capSpacing(props.paddingBottom, 20, "20px"),
    paddingLeft: capSpacing(props.paddingLeft, 16, "16px"),
    paddingRight: capSpacing(props.paddingRight, 16, "16px"),
    paddingTop: capSpacing(props.paddingTop, 20, "20px"),
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
    background: node.data.props.background,
    borderColor: node.data.props.borderColor,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    height: node.data.props.height,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    maxWidth: node.data.props.maxWidth,
    minHeight: node.data.props.minHeight,
    minWidth: node.data.props.minWidth,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    width: node.data.props.width,
  }));
}

function BoxSettings({ includeBackground = true }: { includeBackground?: boolean }) {
  const {
    actions: { setProp },
    ...props
  } = useBoxProps();

  function setValue(key: string, value: string) {
    setProp((draft: any) => {
      draft[key] = value;
    });
  }

  return (
    <div className="grid gap-3">
      {includeBackground ? (
        <Field label="Background">
          <Input onChange={(event) => setValue("background", event.target.value)} value={String(props.background ?? "")} />
        </Field>
      ) : null}
      <DimensionFields
        getValue={(key) => String((props as Record<string, unknown>)[key] ?? "")}
        labels={[
          { key: "width", label: "Width" },
          { key: "height", label: "Height" },
          { key: "minWidth", label: "Min width" },
          { key: "minHeight", label: "Min height" },
          { key: "maxWidth", label: "Max width" },
          { key: "borderRadius", label: "Radius" },
          { key: "borderWidth", label: "Border size" },
          { key: "borderColor", label: "Border color" },
        ]}
        onChange={setValue}
      />
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
          Padding
        </p>
        <DimensionFields
          getValue={(key) => String((props as Record<string, unknown>)[key] ?? "")}
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
          getValue={(key) => String((props as Record<string, unknown>)[key] ?? "")}
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
  const {
    connectors: { connect, drag },
    isActive,
    isHovered,
  } = useNode((node) => ({
    isActive: node.events.selected,
    isHovered: node.events.hovered,
  }));

  return (
    <div
      className={cn(
        "relative transition-shadow",
        isActive && "ring-2 ring-[var(--brand-primary)] ring-offset-2",
        isHovered && "shadow-lg",
        className,
      )}
      ref={(ref) => {
        if (ref) connect(ref);
      }}
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
    borderColor: "transparent",
    borderRadius: "0",
    borderWidth: "0",
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
    width: "100%",
    ...overrides,
  };
}

export function PageCanvas({
  children,
  ...props
}: BoxProps & { children?: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <NodeFrame className="min-h-[70vh] rounded-2xl">
      <div
        className="mx-auto min-h-[70vh] w-full"
        style={{
          ...buildBoxStyle(props),
          ...(isMobile
            ? {
                minHeight: "auto",
                padding: props.padding ? "24px 12px 40px" : undefined,
                paddingBottom: capSpacing(props.paddingBottom, 40, "40px"),
                paddingLeft: capSpacing(props.paddingLeft, 12, "12px"),
                paddingRight: capSpacing(props.paddingRight, 12, "12px"),
                paddingTop: capSpacing(props.paddingTop, 24, "24px"),
              }
            : {}),
        }}
      >
        <div className="grid gap-6">{children}</div>
      </div>
    </NodeFrame>
  );
}

function PageCanvasSettings() {
  return <BoxSettings />;
}

PageCanvas.craft = {
  displayName: "Page",
  isCanvas: true,
  props: defaultBoxProps({
    background: "var(--bg-base)",
    maxWidth: "100%",
    minHeight: "70vh",
    paddingBottom: "56px",
    paddingLeft: "24px",
    paddingRight: "24px",
    paddingTop: "56px",
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

export function SectionBlock({ children, ...props }: LayoutBlockProps) {
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
      borderColor: "var(--border-subtle)",
      borderRadius: "24px",
      borderWidth: "1px",
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

export function ColumnsBlock({ children, ...props }: LayoutBlockProps) {
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
    flexWrap: props.wrap || "nowrap",
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
        <Input
          onChange={(event) => setProp((props: any) => (props.alignItems = event.target.value))}
          value={String(alignItems ?? "stretch")}
        />
      </Field>
      <Field label="Justify content">
        <Input
          onChange={(event) => setProp((props: any) => (props.justifyContent = event.target.value))}
          value={String(justifyContent ?? "flex-start")}
        />
      </Field>
      <Field label="Wrap">
        <Input onChange={(event) => setProp((props: any) => (props.wrap = event.target.value))} value={String(wrap ?? "nowrap")} />
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
      <DimensionFields
        getValue={(key) =>
          String(({ color, lineHeight, size, weight } as Record<string, unknown>)[key] ?? "")
        }
        labels={[
          { key: "color", label: "Color" },
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

type ButtonProps = BoxProps & {
  align?: Align;
  backgroundColor?: string;
  borderStyle?: string;
  color?: string;
  href?: string;
  label?: string;
  size?: SizeValue;
};

export function ButtonBlock({
  align = "left",
  backgroundColor = "var(--brand-primary)",
  borderColor = "var(--brand-primary)",
  borderRadius = "12px",
  borderStyle = "solid",
  borderWidth = "1px",
  color = "#ffffff",
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
  const sharedStyle: CSSProperties = {
    ...buildBoxStyle({
      ...props,
      borderColor,
      borderRadius,
      borderWidth,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingTop,
      width,
    }),
    background: resolveStyleToken(backgroundColor),
    borderStyle,
    color: resolveStyleToken(color),
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
          <span style={sharedStyle}>{label}</span>
        ) : (
          <Link href={href || "#"} style={sharedStyle}>
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
    backgroundColor,
    color,
    href,
    label,
    size,
  } = useNode((node) => ({
    align: node.data.props.align,
    backgroundColor: node.data.props.backgroundColor,
    color: node.data.props.color,
    href: node.data.props.href,
    label: node.data.props.label,
    size: node.data.props.size,
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
      <DimensionFields
        getValue={(key) => String(({ backgroundColor, color, size } as Record<string, unknown>)[key] ?? "")}
        labels={[
          { key: "backgroundColor", label: "Background" },
          { key: "color", label: "Text color" },
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
    backgroundColor: "var(--brand-primary)",
    borderColor: "var(--brand-primary)",
    borderRadius: "12px",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "#ffffff",
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
              className="block h-full w-full"
              src={effectiveUrl}
              style={{ objectFit: fit }}
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
  description?: string;
  icon?: string;
  iconColor?: string;
  iconSize?: SizeValue;
  title?: string;
};

export function IconBoxBlock({
  background = "var(--bg-surface)",
  borderColor = "var(--border-subtle)",
  borderRadius = "24px",
  borderWidth = "1px",
  description = "Describe this feature or value proposition.",
  icon = "★",
  iconColor = "var(--brand-primary)",
  iconSize = "28px",
  paddingBottom = "24px",
  paddingLeft = "24px",
  paddingRight = "24px",
  paddingTop = "24px",
  title = "Icon Box",
  ...props
}: IconBoxProps) {
  return (
    <NodeFrame>
      <div className="grid gap-3" style={buildBoxStyle({ ...props, background, borderColor, borderRadius, borderWidth, paddingBottom, paddingLeft, paddingRight, paddingTop })}>
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
    description,
    icon,
    iconColor,
    iconSize,
    title,
  } = useNode((node) => ({
    description: node.data.props.description,
    icon: node.data.props.icon,
    iconColor: node.data.props.iconColor,
    iconSize: node.data.props.iconSize,
    title: node.data.props.title,
  }));

  return (
    <div className="grid gap-3">
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
      <DimensionFields
        getValue={(key) => String(({ iconColor, iconSize } as Record<string, unknown>)[key] ?? "")}
        labels={[
          { key: "iconColor", label: "Icon color" },
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
    description: "Describe this feature or value proposition.",
    icon: "★",
    iconColor: "var(--brand-primary)",
    iconSize: "28px",
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
                  ? "bg-[var(--brand-primary)] text-white"
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
  href,
  kicker,
  isActive = false,
  title,
  description,
}: {
  accent?: string;
  coverImage?: string | null;
  description: string;
  href: string;
  isActive?: boolean;
  kicker: string;
  title: string;
}) {
  const hasRealCover = Boolean(coverImage) && !isPlaceholderImage(coverImage);
  const accentColor = resolveStyleToken(accent) ?? "#2563eb";

  return (
    <Link
      className={cn(
        "group relative block overflow-hidden rounded-[2rem] transition duration-500",
        isActive
          ? "scale-100 opacity-100 shadow-2xl shadow-black/20"
          : "scale-[0.94] opacity-55",
      )}
      href={href}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-black/5 bg-slate-950">
        {hasRealCover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={title}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={coverImage}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${accentColor}55 0%, transparent 26%), radial-gradient(circle at 78% 30%, #ffffff14 0%, transparent 18%), linear-gradient(145deg, #111827 0%, #020617 100%)`,
              }}
            />
            <div className="absolute -left-10 top-10 h-28 w-28 rounded-full border border-white/10" />
            <div className="absolute right-10 top-16 h-3 w-20 rounded-full bg-white/10 backdrop-blur-sm" />
            <div className="absolute bottom-24 left-10 h-px w-32 bg-white/10" />
            <div className="absolute bottom-14 right-16 h-24 w-24 rotate-12 rounded-2xl bg-white/6" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 grid gap-3 p-6">
          <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
            {kicker}
          </span>
          <h3 className="max-w-[24rem] text-[clamp(1.35rem,2.2vw,2.15rem)] font-semibold leading-[1.08] text-white">
            {title}
          </h3>
          <p className="max-w-[28rem] text-sm leading-6 text-white/78">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

type FeedProps = BoxProps & {
  autoPlay?: boolean;
  columns?: number | string;
  emptyMessage?: string;
  feedType?: FeedType;
  href?: string;
  gap?: SizeValue;
  intervalMs?: number | string;
  slideWidth?: SizeValue;
};

export function FeedCarouselBlock({
  autoPlay = true,
  background = "transparent",
  columns = 3,
  emptyMessage = "No content yet.",
  feedType = "articles",
  gap = "16px",
  href = "/",
  intervalMs = 5000,
  slideWidth = "56%",
  ...props
}: FeedProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const isMobile = useIsMobile();
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const articlesQuery = useArticlesQuery({ status: "published", take: 3 });
  const coursesQuery = useCoursesQuery({ status: "published", take: 3 });

  const articleItems = articlesQuery.data?.items ?? [];
  const courseItems = coursesQuery.data?.items ?? [];
  const eventItems = eventMockData.slice(0, 3);

  const items =
    feedType === "courses"
      ? courseItems.map((course) => ({
          accent: "var(--brand-primary)",
          coverImage: course.cover_image_url,
          description: course.summary ?? "Published course",
          href: `/course/${course.slug}`,
          kicker: course.level,
          title: course.title_vi || course.title_en,
        }))
      : feedType === "events"
        ? eventItems.map((event) => ({
            accent: event.color,
            coverImage: null,
            description: event.description,
            href: "/event",
            kicker: event.location,
            title: event.title,
          }))
        : articleItems.map((article) => ({
            accent: "var(--brand-primary)",
            coverImage: article.cover_image_url,
            description: article.category?.name ?? "Published article",
            href: `/article/${article.slug}`,
            kicker: article.status,
            title: article.title_vi || article.title_en,
          }));

  const isLoading =
    feedType === "articles"
      ? articlesQuery.isLoading
      : feedType === "courses"
        ? coursesQuery.isLoading
        : false;

  const slideInterval = Math.max(1000, parseNumberLike(intervalMs, 5000));
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [feedType]);

  useEffect(() => {
    if (!autoPlay || enabled || items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, slideInterval);

    return () => window.clearInterval(timer);
  }, [autoPlay, enabled, items.length, slideInterval]);

  const gapValue = isMobile ? "12px" : withUnitFallback(gap, "16px") ?? "16px";
  const effectiveSlideWidth = isMobile
    ? "86%"
    : withUnitFallback(slideWidth, "56%") ?? "56%";
  const trackOffset = `calc(50% - (${effectiveSlideWidth} / 2) - (${activeIndex} * (${effectiveSlideWidth} + ${gapValue})))`;

  function goToSlide(index: number) {
    if (!items.length) return;
    const nextIndex = (index + items.length) % items.length;
    setActiveIndex(nextIndex);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (items.length <= 1) return;
    dragStartXRef.current = event.clientX;
    dragDeltaRef.current = 0;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
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
        goToSlide(activeIndex + 1);
      } else {
        goToSlide(activeIndex - 1);
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
            <div className="relative mx-auto w-full max-w-[1100px] overflow-hidden">
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
                        href={item.href || href}
                        isActive={index === activeIndex}
                        kicker={item.kicker}
                        title={item.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {items.length > 1 ? (
              <div className="flex items-center justify-center gap-2">
                {items.map((item, index) => (
                  <button
                    aria-label={`Go to slide ${index + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      index === activeIndex
                        ? "h-2.5 w-7 bg-[var(--brand-primary)]"
                        : "h-2.5 w-2.5 bg-[var(--border-subtle)]",
                    )}
                    key={`${item.href}-${item.title}-dot-${index}`}
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
    columns,
    emptyMessage,
    feedType,
    gap,
    href,
    intervalMs,
    slideWidth,
  } = useNode((node) => ({
    autoPlay: node.data.props.autoPlay,
    columns: node.data.props.columns,
    emptyMessage: node.data.props.emptyMessage,
    feedType: node.data.props.feedType,
    gap: node.data.props.gap,
    href: node.data.props.href,
    intervalMs: node.data.props.intervalMs,
    slideWidth: node.data.props.slideWidth,
  }));

  return (
    <div className="grid gap-3">
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
      <Field label="Fallback link">
        <Input onChange={(event) => setProp((props: any) => (props.href = event.target.value))} value={href} />
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
    columns: 3,
    emptyMessage: "No content yet.",
    feedType: "articles",
    gap: "16px",
    href: "/",
    intervalMs: 5000,
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

  useEffect(() => {
    if (selectedId) setIsOpen(true);
  }, [selectedId]);

  if (!SettingsComponent || !selectedId || !isOpen) return null;

  return (
    <div className="fixed right-6 top-24 z-50 w-[26rem] max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl shadow-black/10">
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
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto px-5 py-4">
          <SettingsComponent />
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
      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-transparent text-[var(--text-secondary)] transition hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
      ref={onRef}
      title={label}
      type="button"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-base)]/80">
        {icon}
      </span>
    </button>
  );
}

export function PageBuilderToolbox() {
  const { connectors } = useEditor();

  return (
    <div className="grid grid-cols-2 justify-items-center gap-0 overflow-y-auto">
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
