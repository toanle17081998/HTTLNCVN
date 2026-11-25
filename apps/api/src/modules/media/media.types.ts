export type UploadedMediaFile = {
  mimetype: string;
  originalname: string;
  path: string;
  size: number;
};

export type MediaUploadDto = {
  filename?: string;
  folder?: string;
  height?: number;
  mimeType: 'image/webp' | 'video/webm';
  originalName: string;
  size: number;
  url: string;
  width?: number;
};

export type MediaFolderDto = {
  count: number;
  name: string;
};

export type MediaGalleryItemDto = {
  filename: string;
  folder: string;
  height?: number;
  originalName: string;
  size: number;
  updatedAt: string;
  url: string;
  width?: number;
};

export type MediaGalleryResponseDto = {
  folders: MediaFolderDto[];
  items: MediaGalleryItemDto[];
  totalCount: number;
  uncategorizedCount: number;
};
