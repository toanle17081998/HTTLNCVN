// ─── String escaping ──────────────────────────────────────────────────────────

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

export function parseCount(value: string, fallback: number, max: number) {
  const count = Number.parseInt(value, 10);
  if (Number.isNaN(count)) return fallback;
  return Math.min(Math.max(count, 1), max);
}

// ─── URL normalisation ────────────────────────────────────────────────────────

export function normalizeWebUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }
  return "";
}

export function getGoogleDriveFileId(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes("drive.google.com")) return "";
    const queryId = url.searchParams.get("id");
    if (queryId) return queryId;
    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    return filePathMatch?.[1] ?? "";
  } catch {
    return "";
  }
}

export function normalizeImageUrl(value: string) {
  const driveFileId = getGoogleDriveFileId(value);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1600`;
  }
  return normalizeWebUrl(value);
}

function getYouTubeVideoId(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? "";
  }
  if (!url.hostname.includes("youtube.com")) return "";
  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }
  return url.searchParams.get("v") ?? "";
}

export function normalizeVideoUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return {
        kind: "iframe",
        url: `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}`,
      } as const;
    }
    if (url.hostname.includes("vimeo.com")) {
      const vimeoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
      if (vimeoId) {
        return {
          kind: "iframe",
          url: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
        } as const;
      }
    }
    return { kind: "video", url: url.toString() } as const;
  } catch {
    return null;
  }
}

// ─── Markdown → HTML ──────────────────────────────────────────────────────────

export function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const codeBlockRef: { current: string[] | null } = { current: null };

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (codeBlockRef.current) {
        html.push(`<pre><code>${escapeHtml(codeBlockRef.current.join("\n"))}</code></pre>`);
        codeBlockRef.current = null;
      } else {
        closeList();
        codeBlockRef.current = [];
      }
      return;
    }
    if (codeBlockRef.current) {
      codeBlockRef.current.push(line);
      return;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      return;
    }
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length + 1;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }
    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      closeList();
      html.push(`<blockquote>${renderInlineMarkdown(quoteMatch[1])}</blockquote>`);
      return;
    }
    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`);
      return;
    }
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`);
      return;
    }
    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  closeList();

  if (codeBlockRef.current) {
    html.push(`<pre><code>${escapeHtml(codeBlockRef.current.join("\n"))}</code></pre>`);
  }

  return html.join("");
}

export function isRichTextHtml(value: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|video|iframe|table|thead|tbody|tr|td|th|a|strong|em|div|span)\b/i.test(
    value,
  );
}

export function hasMeaningfulRichHtml(value: string) {
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return Boolean(
    text || /<(figure|iframe|img|table|video)\b|class=["'][^"']*article-columns/i.test(value),
  );
}

export function getColumnLeftPercentFromTemplate(template: string) {
  const calcMatch = template.match(/calc\(([\d.]+)%/);
  if (calcMatch) return Number.parseFloat(calcMatch[1]);

  const percentMatches = Array.from(template.matchAll(/([\d.]+)%/g));
  if (percentMatches.length >= 2) {
    const left = Number.parseFloat(percentMatches[0][1]);
    const right = Number.parseFloat(percentMatches[1][1]);
    const total = left + right;
    return total > 0 ? (left / total) * 100 : left;
  }

  return null;
}

export function getEditableColumnTemplate(leftPercent: number) {
  const boundedLeftPercent = Math.min(Math.max(leftPercent, 20), 80);
  return `calc(${boundedLeftPercent.toFixed(2)}% - 0.375rem) 0.75rem calc(${(
    100 - boundedLeftPercent
  ).toFixed(2)}% - 0.375rem)`;
}

