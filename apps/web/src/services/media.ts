import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { ApiError, apiBaseUrl, apiRequest, type ApiEnvelope, type ApiErrorEnvelope } from "./client";

export type UploadProgress = {
  percent: number;
  phase: "uploading" | "processing";
};

export type UploadedMedia = {
  filename?: string;
  folder?: string;
  height?: number;
  mimeType: "image/webp" | "video/webm" | "video/mp4";
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

export type MediaStorageUsage = {
  exceedsLimit: boolean;
  limitBytes: number;
  totalBytes: number;
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
      (parsed.pathname.startsWith("/uploads/") || parsed.pathname.startsWith("/api/media/drive/")) &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, apiBaseUrl).toString();
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function uploadMedia(
  file: File,
  signal?: AbortSignal,
  folder?: string,
  onProgress?: (progress: UploadProgress) => void,
) {
  const body = new FormData();
  body.append("file", file);
  if (folder) {
    body.append("folder", folder);
  }

  if (!onProgress || typeof XMLHttpRequest === "undefined") {
    const media = await apiRequest<UploadedMedia>("/media/upload", {
      body,
      method: "POST",
      signal,
    });
    return { ...media, url: resolveMediaUrl(media.url) };
  }

  const media = await new Promise<UploadedMedia>((resolvePromise, rejectPromise) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBaseUrl}/api/media/upload`);
    const token = getStoredTokens()?.accessToken;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(90, Math.max(1, Math.round((event.loaded / event.total) * 90)));
      onProgress({ percent, phase: "uploading" });
    };
    xhr.upload.onload = () => {
      onProgress({ percent: 95, phase: "processing" });
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      let payload: ApiEnvelope<UploadedMedia> | ApiErrorEnvelope | null = null;
      try {
        payload = JSON.parse(xhr.responseText) as ApiEnvelope<UploadedMedia> | ApiErrorEnvelope;
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload && payload.success) {
        onProgress({ percent: 100, phase: "processing" });
        resolvePromise(payload.data);
        return;
      }

      const errorMessage =
        payload && !payload.success && payload.error?.message
          ? payload.error.message
          : `Upload failed with status ${xhr.status}`;
      const errorCode = payload && !payload.success ? payload.error?.code : undefined;
      rejectPromise(new ApiError(errorMessage, xhr.status, errorCode));
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      rejectPromise(new ApiError("Network error while uploading media.", 0));
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      rejectPromise(new DOMException("Upload aborted", "AbortError"));
    };

    onProgress({ percent: 1, phase: "uploading" });
    xhr.send(body);
  });

  return { ...media, url: resolveMediaUrl(media.url) };
}

export async function importDriveMedia(url: string, folder?: string) {
  const media = await apiRequest<UploadedMedia>("/media/import-drive", {
    body: JSON.stringify({ folder, url }),
    method: "POST",
  });
  return { ...media, url: resolveMediaUrl(media.url) };
}

export const mediaApi = {
  storageUsage() {
    return apiRequest<MediaStorageUsage>("/media/storage");
  },
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

const storageUsageSessionKey = "httlncvn.mediaStorageUsage";

function readSessionStorageUsage(): MediaStorageUsage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(storageUsageSessionKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<MediaStorageUsage>;
    if (
      typeof parsed.totalBytes === "number" &&
      typeof parsed.limitBytes === "number" &&
      typeof parsed.exceedsLimit === "boolean"
    ) {
      return parsed as MediaStorageUsage;
    }
  } catch {
    // Ignore storage read errors.
  }
  return undefined;
}

export function useMediaStorageUsageQuery(enabled = true) {
  return useQuery({
    enabled,
    gcTime: Infinity,
    initialData: readSessionStorageUsage,
    queryFn: async () => {
      const usage = await mediaApi.storageUsage();
      try {
        window.sessionStorage.setItem(storageUsageSessionKey, JSON.stringify(usage));
      } catch {
        // Ignore storage write errors.
      }
      return usage;
    },
    queryKey: ["media-storage-session"] as const,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });
}
