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
    const registry = (document as Document & { readonly modelContext?: WebMcpRegistry }).modelContext;
    if (typeof registry?.registerTool !== "function") return;

    const lifecycle = new AbortController();
    const register = (tool: WebMcpTool) => {
      void Promise.resolve(registry.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };

    register({
      name: "get_page_context",
      title: "Get page context",
      description: "Read the current HTNC page title, description, canonical URL, language, and path.",
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
      name: "open_public_page",
      title: "Open a public HTNC page",
      description: "Navigate to a public HTNC section such as articles, courses, events, about, or contact.",
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
      description: "Navigate to a published HTNC article or course using its URL slug.",
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
