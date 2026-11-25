"use client";

import { MediaGalleryManager } from "@/components/media/MediaGalleryManager";
import { Text, Title } from "@/components/ui";

export default function AdminMediaPage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <div>
        <Title as="h1" variant="page">
          Media Gallery
        </Title>
        <Text className="mt-1" tone="secondary" variant="small">
          Organize uploaded images into folders and reuse them across articles, courses, events, and pages.
        </Text>
      </div>
      <MediaGalleryManager mode="manager" />
    </div>
  );
}
