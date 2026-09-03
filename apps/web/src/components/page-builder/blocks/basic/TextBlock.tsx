"use client";

import { useEditor, useNode } from "@craftjs/core";
import { Input, Textarea, cn } from "@/components/ui";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, resolveStyleToken, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { Align, BoxProps, SizeValue } from "../../shared/types";
import type { CSSProperties, ElementType } from "react";

type TextProps = BoxProps & {
  align?: Align;
  color?: string;
  letterSpacing?: string;
  lineHeight?: SizeValue;
  mobileAlign?: Align;
  size?: SizeValue;
  tag?: "p" | "h1" | "h2" | "h3" | "h4" | "span";
  tabletAlign?: Align;
  text?: string;
  weight?: SizeValue;
};

export function TextBlock({
  align = "left",
  color = "inherit",
  letterSpacing,
  lineHeight = 1.6,
  mobileAlign,
  size = "1rem",
  tag = "p",
  tabletAlign,
  text = "Add your text here...",
  weight = "400",
  ...props
}: TextProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const {
    actions: { setProp },
  } = useNode();
  const isMobile = useIsMobile();
  const Tag = (tag || "p") as ElementType;

  return (
    <NodeFrame>
      <Tag
        className={cn(
          "page-builder-text outline-none",
          enabled && "cursor-text",
        )}
        contentEditable={enabled}
        onBlur={(event: any) => {
          if (!enabled) return;
          const updated = event.currentTarget.innerText;
          setProp((draftProps: any) => {
            draftProps.text = updated;
          });
        }}
        style={{
          ...buildBoxStyle(props),
          color: resolveStyleToken(color),
          fontSize: withUnitFallback(size),
          fontWeight: resolveStyleToken(weight) as CSSProperties["fontWeight"],
          letterSpacing,
          lineHeight: resolveStyleToken(lineHeight),
          margin: props.margin ?? 0,
          textAlign: isMobile && mobileAlign ? mobileAlign : align,
        }}
        suppressContentEditableWarning={enabled}
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
    letterSpacing,
    lineHeight,
    size,
    tag,
    text,
    weight,
  } = useNode((node) => ({
    align: node.data.props.align,
    color: node.data.props.color,
    letterSpacing: node.data.props.letterSpacing,
    lineHeight: node.data.props.lineHeight,
    size: node.data.props.size,
    tag: node.data.props.tag,
    text: node.data.props.text,
    weight: node.data.props.weight,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Content">
        <Textarea
          className="min-h-24"
          onChange={(event) => setProp((props: any) => (props.text = event.target.value))}
          value={text}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tag">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.tag = value))}
            value={tag ?? "p"}
          >
            <option value="p">Paragraph (p)</option>
            <option value="h1">Heading 1 (h1)</option>
            <option value="h2">Heading 2 (h2)</option>
            <option value="h3">Heading 3 (h3)</option>
            <option value="h4">Heading 4 (h4)</option>
            <option value="span">Inline text (span)</option>
          </NativeSelect>
        </Field>
        <Field label="Alignment">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.align = value))}
            value={align ?? "left"}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </NativeSelect>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Font size">
          <Input
            onChange={(event) => setProp((props: any) => (props.size = event.target.value))}
            value={String(size ?? "1rem")}
          />
        </Field>
        <Field label="Line height">
          <Input
            onChange={(event) => setProp((props: any) => (props.lineHeight = event.target.value))}
            value={String(lineHeight ?? "1.6")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Weight">
          <NativeSelect
            onChange={(value) => setProp((props: any) => (props.weight = value))}
            value={String(weight ?? "400")}
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </NativeSelect>
        </Field>
        <Field label="Letter spacing">
          <Input
            onChange={(event) => setProp((props: any) => (props.letterSpacing = event.target.value))}
            value={String(letterSpacing ?? "")}
          />
        </Field>
      </div>
      <Field label="Text color">
        <Input
          onChange={(event) => setProp((props: any) => (props.color = event.target.value))}
          value={String(color ?? "inherit")}
        />
      </Field>
      <BoxSettings includeBackground={false} />
    </div>
  );
}

TextBlock.craft = {
  displayName: "Text",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    align: "left",
    color: "inherit",
    lineHeight: "1.6",
    size: "1rem",
    tag: "p",
    text: "Add your text here...",
    weight: "400",
  },
  related: { settings: TextBlockSettings },
};
