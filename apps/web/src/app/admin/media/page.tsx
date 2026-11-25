"use client";

import { MediaGalleryManager } from "@/components/media/MediaGalleryManager";
import { Text, Title } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

export default function AdminMediaPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 py-2">
      <div>
        <Title as="h1" variant="page">
          {t("media.gallery.title")}
        </Title>
        <Text className="mt-1" tone="secondary" variant="small">
          {t("media.gallery.description")}
        </Text>
      </div>
      <MediaGalleryManager mode="manager" />
    </div>
  );
}
