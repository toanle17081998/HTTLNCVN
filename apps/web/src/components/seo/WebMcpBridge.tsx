"use client";

import { useEffect } from "react";

type WebMcpTool = {
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  description: string;
  execute(input: unknown): unknown | Promise<unknown>;
  inputSchema: object;
  name: string;
  title?: string;
};

type WebMcpRegistry = {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void | Promise<void>;
};

const publicDestinations = {
  about: "/about",
  articles: "/article",
  contact: "/contact",
  courses: "/course",
  events: "/event",
  home: "/",
  privacy: "/privacy",
  terms: "/terms",
} as const;

function readString(input: unknown, key: string) {
  if (!input || typeof input !== "object") throw new Error("Input must be an object.");
  const value = (input as Record<string, unknown>)[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} must be a non-empty string.`);
  return value.trim();
}

function navigate(path: string) {
  const target = new URL(path, window.location.origin);
  window.location.assign(target);
  return { navigatingTo: target.toString() };
}

export function WebMcpBridge() {
  useEffect(() => {
    const navigatorWithMcp = navigator as Navigator & { readonly modelContext?: WebMcpRegistry };
    const documentWithMcp = document as Document & { readonly modelContext?: WebMcpRegistry };
    const registry = navigatorWithMcp.modelContext ?? documentWithMcp.modelContext;
    if (typeof registry?.registerTool !== "function") return;

    const lifecycle = new AbortController();
    const register = (tool: WebMcpTool) => {
      void Promise.resolve(registry.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };

    register({
      name: "get_page_context",
      title: "Get page context",
      description:
        "Read the current Hội Thánh Tin Lành Nhân Cấp (HTTLNC) / Multiplying Evangelical Church (MEC) page title, description, canonical URL, language, and path.",
      annotations: { readOnlyHint: true },
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute() {
        const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
        const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
        return {
          canonicalUrl: canonical || window.location.href,
          description: description || "",
          language: document.documentElement.lang,
          path: window.location.pathname,
          title: document.title,
        };
      },
    });

    register({
      name: "list_public_links",
      title: "List visible public links",
      description:
        "Extract public navigation and content links currently rendered on this HTTLNC / MEC page for agentic browsing.",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
        additionalProperties: false,
      },
      execute(input) {
        const rawLimit = input && typeof input === "object" ? (input as Record<string, unknown>).limit : undefined;
        const limit = typeof rawLimit === "number" && Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 50) : 25;
        const seen = new Set<string>();
        const links: Array<{ href: string; text: string }> = [];
        for (const anchor of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
          if (links.length >= limit) break;
          let url: URL;
          try {
            url = new URL(anchor.href, window.location.origin);
          } catch {
            continue;
          }
          if (url.origin !== window.location.origin) continue;
          if (/^\/(admin|auth|api|church|notification|prayer-journal|create-article)/.test(url.pathname)) continue;
          const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
          if (!text || seen.has(url.pathname + url.search)) continue;
          seen.add(url.pathname + url.search);
          links.push({ href: url.toString(), text: text.slice(0, 120) });
        }
        return { count: links.length, links };
      },
    });

    register({
      name: "search_public_content",
      title: "Search HTTLNC / MEC articles or courses",
      description:
        "Open the Hội Thánh Tin Lành Nhân Cấp (HTTLNC) / Multiplying Evangelical Church (MEC) articles or courses catalog filtered by a search query.",
      inputSchema: {
        type: "object",
        properties: {
          contentType: { type: "string", enum: ["article", "course"] },
          query: { type: "string", minLength: 1, maxLength: 120 },
        },
        required: ["contentType", "query"],
        additionalProperties: false,
      },
      execute(input) {
        const contentType = readString(input, "contentType");
        const query = readString(input, "query");
        if (contentType !== "article" && contentType !== "course") throw new Error("Unsupported content type.");
        return navigate(`/${contentType}?q=${encodeURIComponent(query)}`);
      },
    });

    register({
      name: "open_public_page",
      title: "Open a public HTTLNC / MEC page",
      description:
        "Navigate to a public Hội Thánh Tin Lành Nhân Cấp (HTTLNC) / Multiplying Evangelical Church (MEC) section such as articles, courses, events, about, or contact.",
      inputSchema: {
        type: "object",
        properties: { destination: { type: "string", enum: Object.keys(publicDestinations) } },
        required: ["destination"],
        additionalProperties: false,
      },
      execute(input) {
        const destination = readString(input, "destination") as keyof typeof publicDestinations;
        const path = publicDestinations[destination];
        if (!path) throw new Error("Unknown public destination.");
        return navigate(path);
      },
    });

    register({
      name: "open_public_content",
      title: "Open an article or course",
      description: "Navigate to a published HTTLNC / MEC article or course using its URL slug.",
      inputSchema: {
        type: "object",
        properties: {
          contentType: { type: "string", enum: ["article", "course"] },
          slug: { type: "string", minLength: 1, maxLength: 160 },
        },
        required: ["contentType", "slug"],
        additionalProperties: false,
      },
      execute(input) {
        const contentType = readString(input, "contentType");
        const slug = readString(input, "slug");
        if (contentType !== "article" && contentType !== "course") throw new Error("Unsupported content type.");
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) throw new Error("Invalid content slug.");
        return navigate(`/${contentType}/${encodeURIComponent(slug)}`);
      },
    });

    return () => lifecycle.abort();
  }, []);

  return null;
}
