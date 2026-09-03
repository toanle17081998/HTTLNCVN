"use client";

import { useContext, type ReactNode } from "react";
import { useNode } from "@craftjs/core";
import { Input } from "@/components/ui";
import { EditorBreakpointContext } from "./NodeFrame";
import type { BoxProps } from "./types";

export function Field({
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

export function NativeSelect({
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

export function DimensionFields({
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

export function useBoxProps() {
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

export function BoxSettings({
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

      {includePosition ? (
        <div className="grid gap-2">
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
        </div>
      ) : null}

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

export function defaultBoxProps(overrides: Partial<BoxProps> = {}): BoxProps {
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
