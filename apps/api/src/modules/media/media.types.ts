export type UploadedMediaFile = {
  mimetype: string;
  originalname: string;
  path: string;
  size: number;
};

export type MediaUploadDto = {
  height?: number;
  mimeType: 'image/webp' | 'video/webm';
  originalName: string;
  size: number;
  url: string;
  width?: number;
};
