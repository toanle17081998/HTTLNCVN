import { apiBaseUrl, apiRequest } from "./client";

export type UploadedMedia = {
  height?: number;
  mimeType: "image/webp" | "video/webm";
  originalName: string;
  size: number;
  url: string;
  width?: number;
};

export async function uploadMedia(file: File, signal?: AbortSignal) {
  const body = new FormData();
  body.append("file", file);

  const media = await apiRequest<UploadedMedia>("/media/upload", {
    body,
    method: "POST",
    signal,
  });
  return { ...media, url: new URL(media.url, apiBaseUrl).toString() };
}
