export function slugifyPageTitle(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "new-page";
}

export function createDefaultPageContent(title: string, routePath: string) {
  return JSON.stringify({
    ROOT: {
      custom: {},
      displayName: "PageCanvas",
      hidden: false,
      isCanvas: true,
      linkedNodes: {},
      nodes: ["section-1"],
      parent: null,
      props: {
        background: "var(--bg-base)",
        maxWidth: "100%",
        padding: "56px 24px",
      },
      type: { resolvedName: "PageCanvas" },
    },
    "section-1": {
      custom: {},
      displayName: "Container",
      hidden: false,
      isCanvas: true,
      linkedNodes: {},
      nodes: ["title-1", "copy-1", "button-1"],
      parent: "ROOT",
      props: {
        background: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        borderRadius: 24,
        borderWidth: 1,
        columns: 1,
        gap: 16,
        padding: "40px",
      },
      type: { resolvedName: "SectionBlock" },
    },
    "title-1": {
      custom: {},
      displayName: "Text",
      hidden: false,
      isCanvas: false,
      linkedNodes: {},
      nodes: [],
      parent: "section-1",
      props: {
        align: "left",
        color: "var(--text-primary)",
        size: 40,
        tag: "h1",
        text: title,
        weight: 800,
      },
      type: { resolvedName: "TextBlock" },
    },
    "copy-1": {
      custom: {},
      displayName: "Text",
      hidden: false,
      isCanvas: false,
      linkedNodes: {},
      nodes: [],
      parent: "section-1",
      props: {
        align: "left",
        color: "var(--text-secondary)",
        size: 16,
        tag: "p",
        text: `This page is mapped to ${routePath}.`,
        weight: 400,
      },
      type: { resolvedName: "TextBlock" },
    },
    "button-1": {
      custom: {},
      displayName: "Button",
      hidden: false,
      isCanvas: false,
      linkedNodes: {},
      nodes: [],
      parent: "section-1",
      props: {
        align: "left",
        href: routePath,
        label: "Preview page",
        variant: "primary",
      },
      type: { resolvedName: "ButtonBlock" },
    },
  });
}

function isCraftContentRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const supportedResolvedNames = new Set([
    "PageCanvas",
    "SectionBlock",
    "ColumnsBlock",
    "RowBlock",
    "VerticalStackBlock",
    "TextBlock",
    "ButtonBlock",
    "ImageBlock",
    "SeparatorBlock",
    "IconBoxBlock",
    "AccordionBlock",
    "TabsBlock",
    "FeedCarouselBlock",
  ]);

  const record = value as Record<string, unknown>;

  if (!("ROOT" in record)) {
    return false;
  }

  return Object.values(record).every((nodeValue) => {
    if (!nodeValue || typeof nodeValue !== "object" || Array.isArray(nodeValue)) {
      return false;
    }

    const node = nodeValue as Record<string, unknown>;
    const type = node.type;
    const props = node.props;
    const nodes = node.nodes;

    if (!type || typeof type !== "object" || Array.isArray(type)) {
      return false;
    }

    const resolvedName = (type as Record<string, unknown>).resolvedName;

    return (
      typeof resolvedName === "string" &&
      supportedResolvedNames.has(resolvedName) &&
      Array.isArray(nodes) &&
      typeof props === "object" &&
      props !== null
    );
  });
}

export function ensureValidPageContent(
  content: string | null | undefined,
  title: string,
  routePath: string,
) {
  if (typeof content === "string" && content.trim()) {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (isCraftContentRecord(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Fall back to safe default content.
    }
  }

  return createDefaultPageContent(title, routePath);
}
