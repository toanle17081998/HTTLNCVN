"use client";

import { Button } from "@/components/ui/Button";
import { useEditor, useNode } from "@craftjs/core";
import { Plus } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, capSpacing, mobileBoxOverrides, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import { TextBlock } from "../basic/TextBlock";
import { RichTextBlock } from "../basic/RichTextBlock";
import type { BoxProps, SizeValue } from "../../shared/types";
import type { CSSProperties, ReactNode } from "react";

export type StackProps = BoxProps & {
  alignItems?: CSSProperties["alignItems"];
  allowTextInsert?: boolean;
  children?: ReactNode;
  gap?: SizeValue;
  justifyContent?: CSSProperties["justifyContent"];
  mobileAlignItems?: CSSProperties["alignItems"];
  showSeparator?: boolean;
  wrap?: boolean;
};

export function RowBlock({ children, ...props }: StackProps) {
  const isMobile = useIsMobile();
  return (
    <NodeFrame>
      <div
        className="page-builder-row"
        style={{
          ...buildBoxStyle(props),
          alignItems: isMobile && props.mobileAlignItems ? props.mobileAlignItems : props.alignItems ?? "center",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: props.wrap ? "wrap" : "nowrap",
          gap: isMobile ? capSpacing(props.gap, 16, "var(--section-space-xs)") : withUnitFallback(props.gap, 16),
          justifyContent: props.justifyContent ?? "flex-start",
          ...(isMobile ? mobileBoxOverrides(props) : {}),
        }}
      >
        {children}
      </div>
    </NodeFrame>
  );
}

function RowBlockSettings() {
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
      <Field label="Align items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.alignItems = value))}
          value={String(alignItems ?? "center")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
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
        </NativeSelect>
      </Field>
      <Field label="Gap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.gap = value))}
          value={String(gap ?? "var(--section-space-sm)")}
        >
          <option value="var(--section-space-none)">None (0)</option>
          <option value="var(--section-space-xs)">Extra Small (12px)</option>
          <option value="var(--section-space-sm)">Small (16px)</option>
          <option value="var(--section-space-md)">Medium (24px)</option>
          <option value="var(--section-space-lg)">Large (40px)</option>
        </NativeSelect>
      </Field>
      <Field label="Wrap items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.wrap = value === "true"))}
          value={String(Boolean(wrap))}
        >
          <option value="false">No wrap</option>
          <option value="true">Wrap</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

RowBlock.craft = {
  displayName: "Row",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    alignItems: "center",
    gap: "var(--section-space-sm)",
    justifyContent: "flex-start",
    wrap: false,
  },
  related: { settings: RowBlockSettings },
};

export function VerticalStackBlock({ children, ...props }: StackProps) {
  const { t } = useTranslation();
  const { actions, enabled, query } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const {
    actions: { setProp },
    id,
    nodeAllowTextInsert,
    nodeShowSeparator,
  } = useNode((node) => ({
    nodeAllowTextInsert: node.data.props.allowTextInsert,
    nodeShowSeparator: node.data.props.showSeparator,
  }));
  const isMobile = useIsMobile();
  const allowTextInsert = Boolean(nodeAllowTextInsert ?? props.allowTextInsert);
  const showSeparator = Boolean(nodeShowSeparator ?? props.showSeparator);

  function appendTextBlock(kind: "header" | "paragraph" | "richText") {
    const element =
      kind === "header" ? (
        <TextBlock
          align="left"
          color="var(--text-primary)"
          lineHeight="var(--section-heading-leading)"
          removable
          size="var(--section-card-title-size)"
          tag="h3"
          text="Section heading"
          weight="var(--section-weight-bold)"
        />
      ) : kind === "richText" ? (
        <RichTextBlock
          align="left"
          content={"### Subheading\n\nWrite **rich text** or *Markdown* here:\n\n- Bullet item\n- Another item"}
          removable
        />
      ) : (
        <TextBlock
          align="left"
          color="var(--text-secondary)"
          lineHeight="var(--section-body-leading)"
          removable
          size="var(--section-body-size)"
          tag="p"
          text="Write your paragraph content here..."
          weight="400"
        />
      );
    const tree = query.parseReactElement(element).toNodeTree();
    actions.addNodeTree(tree, id);
  }

  return (
    <NodeFrame>
      <div
        className={`page-builder-stack ${
          showSeparator
            ? "[&>*:not([data-stack-controls]):not(:first-child)]:border-t [&>*:not([data-stack-controls]):not(:first-child)]:border-[var(--border-subtle)] [&>*:not([data-stack-controls]):not(:first-child)]:pt-4"
            : ""
        }`}
        style={{
          ...buildBoxStyle(props),
          alignItems: isMobile && props.mobileAlignItems ? props.mobileAlignItems : props.alignItems ?? "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? capSpacing(props.gap, 16, "var(--section-space-xs)") : withUnitFallback(props.gap, 16),
          justifyContent: props.justifyContent ?? "flex-start",
          ...(isMobile ? mobileBoxOverrides(props) : {}),
        }}
      >
        {children}
        {enabled && allowTextInsert ? (
          <div className="mt-2 flex flex-wrap gap-2 pt-1" data-stack-controls="true">
            <Button
              variant="unstyled"
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              onClick={(event) => {
                event.stopPropagation();
                appendTextBlock("header");
              }}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("pageBuilder.addHeader")}
            </Button>
            <Button
              variant="unstyled"
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              onClick={(event) => {
                event.stopPropagation();
                appendTextBlock("paragraph");
              }}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("pageBuilder.addParagraph")}
            </Button>
            <Button
              variant="unstyled"
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              onClick={(event) => {
                event.stopPropagation();
                appendTextBlock("richText");
              }}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("pageBuilder.addRichText")}
            </Button>
            <Button
              variant="unstyled"
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                showSeparator
                  ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                  : "border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                setProp((draft: any) => {
                  draft.showSeparator = !showSeparator;
                });
              }}
              type="button"
            >
              {t("pageBuilder.toggleSeparator")}
            </Button>
          </div>
        ) : null}
      </div>
    </NodeFrame>
  );
}

function VerticalStackBlockSettings() {
  const {
    actions: { setProp },
    alignItems,
    gap,
    justifyContent,
    showSeparator,
  } = useNode((node) => ({
    alignItems: node.data.props.alignItems,
    gap: node.data.props.gap,
    justifyContent: node.data.props.justifyContent,
    showSeparator: node.data.props.showSeparator,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Align items">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.alignItems = value))}
          value={String(alignItems ?? "flex-start")}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
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
        </NativeSelect>
      </Field>
      <Field label="Gap">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.gap = value))}
          value={String(gap ?? "var(--section-space-sm)")}
        >
          <option value="var(--section-space-none)">None (0)</option>
          <option value="var(--section-space-xs)">Extra Small (12px)</option>
          <option value="var(--section-space-sm)">Small (16px)</option>
          <option value="var(--section-space-md)">Medium (24px)</option>
          <option value="var(--section-space-lg)">Large (40px)</option>
        </NativeSelect>
      </Field>
      <Field label="Separator">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.showSeparator = value === "true"))}
          value={String(Boolean(showSeparator))}
        >
          <option value="false">Off</option>
          <option value="true">On</option>
        </NativeSelect>
      </Field>
      <BoxSettings />
    </div>
  );
}

VerticalStackBlock.craft = {
  displayName: "Vertical Stack",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    alignItems: "flex-start",
    gap: "var(--section-space-sm)",
    justifyContent: "flex-start",
  },
  related: { settings: VerticalStackBlockSettings },
};
