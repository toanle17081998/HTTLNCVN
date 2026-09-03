"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/components/ui";
import { normalizeCssValue } from "./helpers";
import type { EditorBreakpoint, SizeValue } from "./types";

export const EditorBreakpointContext = createContext<EditorBreakpoint>("desktop");
export const SectionInsertContext = createContext<((index: number) => void) | null>(null);

export function NodeFrame({ children, className }: { children: ReactNode; className?: string }) {
  const openSectionPicker = useContext(SectionInsertContext);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const {
    id,
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
  const { actions: editorActions, rootIndex } = useEditor((state: any) => ({
    rootIndex: state.nodes.ROOT?.data.nodes?.indexOf(id) ?? -1,
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
        "group/section page-builder-node relative transition-shadow",
        isActive && "ring-2 ring-[var(--brand-primary)] ring-offset-2",
        parentId === "ROOT" && isHovered && "shadow-lg",
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
      {enabled && parentId === "ROOT" && rootIndex === 0 && openSectionPicker ? (
        <button
          aria-label="Add section above"
          className="absolute left-1/2 top-0 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--text-inverse)] opacity-0 shadow-lg transition-opacity group-hover/section:opacity-100 focus:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            openSectionPicker(0);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      ) : null}
      {enabled && parentId === "ROOT" && openSectionPicker ? (
        <button
          aria-label="Add section below"
          className="absolute bottom-0 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--text-inverse)] opacity-0 shadow-lg transition-opacity group-hover/section:opacity-100 focus:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            openSectionPicker(rootIndex + 1);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      ) : null}
      {enabled && parentId === "ROOT" ? (
        <div className={cn(
          "absolute right-3 top-3 z-20 flex gap-1 rounded-lg bg-[var(--bg-elevated)] p-1 shadow-lg transition-opacity md:group-hover/section:opacity-100 md:focus-within:opacity-100",
          isActive ? "opacity-100" : "opacity-100 md:opacity-0",
        )}>
          <button
            aria-label="Move section"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
            ref={(ref) => {
              if (ref) drag(ref);
            }}
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            aria-label="Remove section"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--status-danger)]"
            onClick={(event) => {
              event.stopPropagation();
              editorActions.delete(id);
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Delete section
          </button>
          {typeof allProps.backgroundImage === "string" && allProps.backgroundImage ? (
            <button
              aria-label="Change section background image"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--brand-primary)]"
              onClick={(event) => {
                event.stopPropagation();
                editorActions.selectNode(id);
              }}
              title="Change background image"
              type="button"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
