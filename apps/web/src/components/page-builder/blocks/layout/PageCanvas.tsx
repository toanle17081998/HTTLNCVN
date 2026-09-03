"use client";

import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/components/ui";
import { buildBoxStyle, useIsMobile } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import { BoxSettings, defaultBoxProps } from "../../shared/settings";
import type { BoxProps } from "../../shared/types";
import type { ReactNode } from "react";

type PageCanvasProps = BoxProps & {
  children?: ReactNode;
  snapType?: "none" | "mandatory" | "proximity" | "y mandatory" | "y proximity";
};

export function PageCanvas({
  children,
  snapType = "none",
  ...props
}: PageCanvasProps) {
  const {
    connectors: { connect },
  } = useNode();
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const isMobile = useIsMobile();

  return (
    <NodeFrame>
      <main
        className={cn(
          "page-builder-canvas relative mx-auto w-full transition-all duration-300",
          snapType !== "none" && "snap-y snap-mandatory",
        )}
        data-editor-canvas={enabled ? "true" : undefined}
        ref={(ref) => {
          if (ref) connect(ref);
        }}
        style={{
          ...buildBoxStyle(props),
          minHeight: "100vh",
          paddingLeft: isMobile ? 0 : props.paddingLeft,
          paddingRight: isMobile ? 0 : props.paddingRight,
          scrollSnapType: snapType === "none" ? undefined : snapType,
        }}
      >
        <div className="page-builder-section-list flex flex-col">{children}</div>
      </main>
    </NodeFrame>
  );
}

function PageCanvasSettings() {
  return (
    <div className="grid gap-3">
      <BoxSettings />
    </div>
  );
}

PageCanvas.craft = {
  displayName: "Page Canvas",
  props: {
    ...defaultBoxProps({
      background: "var(--bg-base)",
      width: "100%",
    }),
    snapType: "none",
  },
  related: { settings: PageCanvasSettings },
  rules: {
    canDrag: () => false,
  },
};
