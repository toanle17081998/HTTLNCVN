import type { ReactNode } from "react";
import type { ToolbarIconName } from "./articleEditorTypes";

// ─── SvgIcon ──────────────────────────────────────────────────────────────────

export function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

// ─── ToolbarIcon ──────────────────────────────────────────────────────────────

export function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  switch (name) {
    case "heading2":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">H2</span>;
    case "heading3":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">H3</span>;
    case "paragraph":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">P</span>;
    case "bold":
      return <span aria-hidden="true" className="text-sm font-black">B</span>;
    case "italic":
      return <span aria-hidden="true" className="font-serif text-sm italic">I</span>;
    case "underline":
      return <span aria-hidden="true" className="text-sm font-black underline">U</span>;
    case "list":
      return (
        <SvgIcon>
          <path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" />
          <path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" />
        </SvgIcon>
      );
    case "orderedList":
      return (
        <SvgIcon>
          <path d="M10 6h10" /><path d="M10 12h10" /><path d="M10 18h10" />
          <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M4 14h2l-2 4h2" />
        </SvgIcon>
      );
    case "quote":
      return (
        <SvgIcon>
          <path d="M8 11H5a4 4 0 0 1 4-4" /><path d="M8 11v6H4v-6" />
          <path d="M19 11h-3a4 4 0 0 1 4-4" /><path d="M19 11v6h-4v-6" />
        </SvgIcon>
      );
    case "alignLeft":
      return (
        <SvgIcon>
          <path d="M4 6h16" /><path d="M4 10h10" /><path d="M4 14h16" /><path d="M4 18h10" />
        </SvgIcon>
      );
    case "alignCenter":
      return (
        <SvgIcon>
          <path d="M4 6h16" /><path d="M8 10h8" /><path d="M4 14h16" /><path d="M8 18h8" />
        </SvgIcon>
      );
    case "alignRight":
      return (
        <SvgIcon>
          <path d="M4 6h16" /><path d="M10 10h10" /><path d="M4 14h16" /><path d="M10 18h10" />
        </SvgIcon>
      );
    case "alignJustify":
      return (
        <SvgIcon>
          <path d="M4 6h16" /><path d="M4 10h16" /><path d="M4 14h16" /><path d="M4 18h16" />
        </SvgIcon>
      );
    case "link":
      return (
        <SvgIcon>
          <path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15" />
        </SvgIcon>
      );
    case "image":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="m3 16 5-5 4 4 2-2 7 7" />
          <circle cx="15" cy="9" r="1" />
        </SvgIcon>
      );
    case "video":
      return (
        <SvgIcon>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <path d="m10 9 5 3-5 3Z" />
        </SvgIcon>
      );
    case "columns":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="M12 4v16" />
        </SvgIcon>
      );
    case "table":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="M3 10h18" /><path d="M3 16h18" /><path d="M9 4v16" /><path d="M15 4v16" />
        </SvgIcon>
      );
  }
}
