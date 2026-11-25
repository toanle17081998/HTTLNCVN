import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBaseUrl, apiRequest } from "./client";

export type UploadedMedia = {
  filename?: string;
  folder?: string;
  height?: number;
  mimeType: "image/webp" | "video/webm";
  originalName: string;
  size: number;
  url: string;
  width?: number;
};

export type MediaFolder = {
  count: number;
  name: string;
};

export type MediaGalleryItem = {
  filename: string;
  folder: string;
  height?: number;
  originalName: string;
  size: number;
  updatedAt: string;
  url: string;
  width?: number;
};

export type MediaGalleryResponse = {
  folders: MediaFolder[];
  items: MediaGalleryItem[];
  totalCount: number;
  uncategorizedCount: number;
};

export const mediaKeys = {
  all: ["media"] as const,
  gallery: (params: { folder?: string; q?: string } = {}) =>
    [...mediaKeys.all, "gallery", params] as const,
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

export async function uploadMedia(file: File, signal?: AbortSignal, folder?: string) {
  const body = new FormData();
  body.append("file", file);
  if (folder) {
    body.append("folder", folder);
  }

  const media = await apiRequest<UploadedMedia>("/media/upload", {
    body,
    method: "POST",
    signal,
  });
  return { ...media, url: resolveMediaUrl(media.url) };
}

export const mediaApi = {
  async listGallery(params: { folder?: string; q?: string } = {}): Promise<MediaGalleryResponse> {
    const search = new URLSearchParams();
    if (params.folder !== undefined) search.set("folder", params.folder);
    if (params.q) search.set("q", params.q);
    const qs = search.toString();
    const res = await apiRequest<MediaGalleryResponse>(`/media/gallery${qs ? `?${qs}` : ""}`);
    return {
      ...res,
      items: res.items.map((item) => ({ ...item, url: resolveMediaUrl(item.url) })),
    };
  },
  createFolder(name: string) {
    return apiRequest<{ name: string }>("/media/folders", {
      body: JSON.stringify({ name }),
      method: "POST",
    });
  },
  renameFolder(oldName: string, newName: string) {
    return apiRequest<{ name: string }>(`/media/folders/${encodeURIComponent(oldName)}`, {
      body: JSON.stringify({ newName }),
      method: "PATCH",
    });
  },
  deleteFolder(name: string) {
    return apiRequest<void>(`/media/folders/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },
  moveImages(filenames: string[], folder: string) {
    return apiRequest<{ moved: number }>("/media/images/move", {
      body: JSON.stringify({ filenames, folder }),
      method: "PATCH",
    });
  },
  deleteImage(filename: string) {
    return apiRequest<void>(`/media/images/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
  },
};

export function useMediaGalleryQuery(params: { folder?: string; q?: string } = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => mediaApi.listGallery(params),
    queryKey: mediaKeys.gallery(params),
  });
}

export function useCreateMediaFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => mediaApi.createFolder(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useRenameMediaFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      mediaApi.renameFolder(oldName, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useDeleteMediaFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => mediaApi.deleteFolder(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useMoveMediaImagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filenames, folder }: { filenames: string[]; folder: string }) =>
      mediaApi.moveImages(filenames, folder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useDeleteMediaImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => mediaApi.deleteImage(filename),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}
