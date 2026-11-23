import { apiBaseUrl, apiRequest } from "./client";

export type UploadedMedia = {
  height?: number;
  mimeType: "image/webp" | "video/webm";
  originalName: string;
  size: number;
  url: string;
  width?: number;
};

export function resolveMediaUrl(url: string) {
  if (!url) return url;

  try {
    const parsed = new URL(url, apiBaseUrl);
    if (
      parsed.pathname.startsWith("/uploads/") &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, apiBaseUrl).toString();
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function uploadMedia(file: File, signal?: AbortSignal) {
  const body = new FormData();
  body.append("file", file);

  const media = await apiRequest<UploadedMedia>("/media/upload", {
    body,
    method: "POST",
    signal,
  });
  return { ...media, url: resolveMediaUrl(media.url) };
}
