"use client";

import { Text, Title, Button, Card, Input, Textarea, cn, Label, Switch } from "@/components/ui";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Globe2,
  ImageIcon,
  LayoutTemplate,
  Lock,
  Menu as MenuIcon,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { IconPicker, resolveIcon } from "@/components/page-builder/shared/iconList";
import {
  defaultPageHeroes,
  defaultSiteNavigationConfig,
  type FooterContactItem,
  type FooterLinkItem,
  type HeaderNavItem,
  type PageHeroConfig,
  type SiteNavigationConfig,
} from "@/domain/site-navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSiteNavigationQuery, useUpdateSiteNavigationMutation } from "@/hooks/siteNavigation";
import { importDriveMedia, mediaKeys, uploadMedia } from "@/api/media";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";

function isIntroVideoUrl(url?: string) {
  return Boolean(url && /\.(webm|mp4|mov|m4v)(\?.*)?$/i.test(url));
}

function detectVideoDurationSeconds(url: string): Promise<number | null> {
  if (!isIntroVideoUrl(url) || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = "";
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const seconds =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(30, Math.max(1, Math.round(video.duration)))
          : null;
      cleanup();
      resolve(seconds);
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

const HERO_PAGES = [
  { key: "/article", labelKey: "nav.article.label" },
  { key: "/course", labelKey: "nav.course.label" },
  { key: "/event", labelKey: "nav.event.label" },
  { key: "/church", labelKey: "nav.church.label" },
  { key: "/prayer-journal", labelKey: "nav.prayerJournal.label" },
  { key: "/about", labelKey: "nav.about.label" },
] as const;

export function AdminNavigation() {
  const { t, localize } = useTranslation();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const navQuery = useSiteNavigationQuery();
  const updateMutation = useUpdateSiteNavigationMutation();

  const [activeTab, setActiveTab] = useState<"header" | "footer" | "heroes" | "intro">("header");
  const [selectedHeroPage, setSelectedHeroPage] = useState<string>("/article");
  const [config, setConfig] = useState<SiteNavigationConfig>(defaultSiteNavigationConfig);
  const [isUploadingIntro, setIsUploadingIntro] = useState(false);
  const [introUploadProgress, setIntroUploadProgress] = useState<{ percent: number; phase: "uploading" | "processing" } | null>(null);
  const [introDriveUrl, setIntroDriveUrl] = useState("");
  const [introDriveError, setIntroDriveError] = useState<string | null>(null);
  const [mobileDriveUrls, setMobileDriveUrls] = useState<Record<string, string>>({});
  const [introGalleryTarget, setIntroGalleryTarget] = useState<null | { kind: "add" } | { kind: "mobile"; imageId: string }>(null);

  useEffect(() => {
    if (navQuery.data) {
      setConfig(navQuery.data);
    }
  }, [navQuery.data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(config);
      toast({
        title: t("admin.navigation.saveSuccess"),
        variant: "success",
      });
    } catch {
      toast({
        title: t("admin.navigation.saveError"),
        variant: "error",
      });
    }
  };

  const handleResetDefaults = async () => {
    const ok = await confirm({
      confirmLabel: t("admin.navigation.resetConfirmLabel"),
      description: t("admin.navigation.resetConfirmDesc"),
      title: t("admin.navigation.resetConfirmTitle"),
      variant: "warning",
    });
    if (!ok) return;
    setConfig(defaultSiteNavigationConfig);
  };

  const validateIntroFileSize = (file: File) => {
    const maxMb = 20;
    if (file.size > maxMb * 1024 * 1024) {
      toast({
        title: t("admin.navigation.introFileTooLarge", { limit: String(maxMb) }),
        variant: "error",
      });
      return false;
    }
    return true;
  };

  const handleIntroImageUpload = async (file?: File) => {
    if (!file || !validateIntroFileSize(file)) return;
    setIsUploadingIntro(true);
    setIntroUploadProgress({ percent: 1, phase: "uploading" });
    try {
      const media = await uploadMedia(file, undefined, undefined, setIntroUploadProgress);
      const detectedDuration = (await detectVideoDurationSeconds(media.url)) ?? 3;
      setConfig((prev) => ({
        ...prev,
        intro: {
          ...prev.intro,
          enabled: true,
          images: [
            ...prev.intro.images,
            { durationSeconds: detectedDuration, id: `intro-${Date.now()}`, url: media.url },
          ].slice(0, 3),
        },
      }));
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      toast({ title: t("admin.navigation.introUploadSuccess"), variant: "success" });
    } catch (error) {
      toast({
        title: error instanceof Error && error.message ? error.message : t("admin.navigation.introUploadError"),
        variant: "error",
      });
    } finally {
      setIsUploadingIntro(false);
      setIntroUploadProgress(null);
    }
  };

  const handleIntroMobileImageUpload = async (imageId: string, file?: File) => {
    if (!file || !validateIntroFileSize(file)) return;
    setIsUploadingIntro(true);
    setIntroUploadProgress({ percent: 1, phase: "uploading" });
    try {
      const media = await uploadMedia(file, undefined, undefined, setIntroUploadProgress);
      setConfig((prev) => ({
        ...prev,
        intro: {
          ...prev.intro,
          images: prev.intro.images.map((image) =>
            image.id === imageId ? { ...image, mobileUrl: media.url } : image,
          ),
        },
      }));
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      toast({ title: t("admin.navigation.introUploadSuccess"), variant: "success" });
    } catch (error) {
      toast({
        title: error instanceof Error && error.message ? error.message : t("admin.navigation.introUploadError"),
        variant: "error",
      });
    } finally {
      setIsUploadingIntro(false);
      setIntroUploadProgress(null);
    }
  };

  const handleIntroDriveImport = async (rawUrl: string, mobileImageId?: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    setIntroDriveError(null);
    setIsUploadingIntro(true);
    setIntroUploadProgress({ percent: 50, phase: "processing" });
    try {
      const media = await importDriveMedia(trimmed);
      if (mobileImageId) {
        setConfig((prev) => ({
          ...prev,
          intro: {
            ...prev.intro,
            images: prev.intro.images.map((image) =>
              image.id === mobileImageId ? { ...image, mobileUrl: media.url } : image,
            ),
          },
        }));
        setMobileDriveUrls((prev) => ({ ...prev, [mobileImageId]: "" }));
      } else {
        const detectedDuration = (await detectVideoDurationSeconds(media.url)) ?? 3;
        setConfig((prev) => ({
          ...prev,
          intro: {
            ...prev.intro,
            enabled: true,
            images: [
              ...prev.intro.images,
              { durationSeconds: detectedDuration, id: `intro-${Date.now()}`, url: media.url },
            ].slice(0, 3),
          },
        }));
        setIntroDriveUrl("");
      }
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      toast({ title: t("admin.navigation.introUploadSuccess"), variant: "success" });
    } catch {
      const message = "Can not get the image/video";
      setIntroDriveError(message);
      toast({ title: message, variant: "error" });
    } finally {
      setIsUploadingIntro(false);
      setIntroUploadProgress(null);
    }
  };

  const handleAddNavItem = () => {
    const nextId = `nav-${Date.now()}`;
    const newItem: HeaderNavItem = {
      descriptionEn: "",
      descriptionVi: "",
      href: "/about",
      icon: "users",
      id: nextId,
      guestVisible: true,
      labelEn: "New Link",
      labelVi: "Liên kết mới",
      visible: true,
    };
    setConfig((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        items: [...prev.header.items, newItem],
      },
    }));
  };

  const handleUpdateNavItem = (index: number, updates: Partial<HeaderNavItem>) => {
    setConfig((prev) => {
      const items = [...prev.header.items];
      items[index] = { ...items[index], ...updates };
      return {
        ...prev,
        header: {
          ...prev.header,
          items,
        },
      };
    });
  };

  const handleMoveNavItem = (index: number, direction: "up" | "down") => {
    setConfig((prev) => {
      const items = [...prev.header.items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return {
        ...prev,
        header: {
          ...prev.header,
          items,
        },
      };
    });
  };

  const handleDeleteNavItem = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        items: prev.header.items.filter((_, i) => i !== index),
      },
    }));
  };

  const handleUpdateHero = (pageKey: string, updates: Partial<PageHeroConfig>) => {
    setConfig((prev) => {
      const existing = prev.pageHeroes?.[pageKey] || defaultPageHeroes[pageKey] || {};
      return {
        ...prev,
        pageHeroes: {
          ...prev.pageHeroes,
          [pageKey]: {
            ...existing,
            ...updates,
          },
        },
      };
    });
  };

  const handleAddContact = () => {
    const newContact: FooterContactItem = {
      href: "mailto:info@httlncvn.local",
      icon: "mail",
      id: `contact-${Date.now()}`,
      labelEn: "Contact",
      labelVi: "Liên hệ",
      valueEn: "info@httlncvn.local",
      valueVi: "info@httlncvn.local",
    };
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        contacts: [...prev.footer.contacts, newContact],
      },
    }));
  };

  const handleUpdateContact = (index: number, updates: Partial<FooterContactItem>) => {
    setConfig((prev) => {
      const contacts = [...prev.footer.contacts];
      contacts[index] = { ...contacts[index], ...updates };
      return {
        ...prev,
        footer: {
          ...prev.footer,
          contacts,
        },
      };
    });
  };

  const handleDeleteContact = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        contacts: prev.footer.contacts.filter((_, i) => i !== index),
      },
    }));
  };

  const handleAddFooterLink = () => {
    const newLink: FooterLinkItem = {
      href: "/about",
      id: `flink-${Date.now()}`,
      labelEn: "Quick Link",
      labelVi: "Liên kết",
    };
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        links: [...prev.footer.links, newLink],
      },
    }));
  };

  const handleUpdateFooterLink = (index: number, updates: Partial<FooterLinkItem>) => {
    setConfig((prev) => {
      const links = [...prev.footer.links];
      links[index] = { ...links[index], ...updates };
      return {
        ...prev,
        footer: {
          ...prev.footer,
          links,
        },
      };
    });
  };

  const handleDeleteFooterLink = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        links: prev.footer.links.filter((_, i) => i !== index),
      },
    }));
  };

  const currentHeroConfig: PageHeroConfig =
    config.pageHeroes?.[selectedHeroPage] ||
    defaultPageHeroes[selectedHeroPage] ||
    {};

  return (
    <PageLayout
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="cursor-pointer"
            onClick={handleResetDefaults}
            type="button"
            variant="secondary"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("action.tryAgain") || "Reset"}
          </Button>
          <Button
            className="cursor-pointer bg-[var(--brand-primary)] text-[var(--text-inverse)]"
            disabled={updateMutation.isPending}
            onClick={handleSave}
            type="button"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? t("admin.articles.loading") : t("action.update")}
          </Button>
        </div>
      }
      description={t("admin.navigation.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.navigation.title")}
    >
      <div className="grid gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto">
          <button
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors shrink-0",
              activeTab === "intro"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => setActiveTab("intro")}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            {t("admin.navigation.tabIntro")}
          </button>
          <button
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors shrink-0",
              activeTab === "header"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => setActiveTab("header")}
            type="button"
          >
            <MenuIcon className="h-4 w-4" />
            {t("admin.navigation.tabHeader")}
          </button>
          <button
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors shrink-0",
              activeTab === "heroes"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => setActiveTab("heroes")}
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
            {t("admin.navigation.tabHeroes")}
          </button>
          <button
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors shrink-0",
              activeTab === "footer"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
            onClick={() => setActiveTab("footer")}
            type="button"
          >
            <LayoutTemplate className="h-4 w-4" />
            {t("admin.navigation.tabFooter")}
          </button>
        </div>

        {activeTab === "intro" ? (
          <Card className="grid gap-6 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Title as="h2" variant="subsectionStrong">{t("admin.navigation.introTitle")}</Title>
                <Text className="mt-1" variant="small">{t("admin.navigation.introDescription")}</Text>
              </div>
              <Switch
                checked={config.intro.enabled}
                onCheckedChange={(enabled) =>
                  setConfig((prev) => ({ ...prev, intro: { ...prev.intro, enabled } }))
                }
              />
            </div>

            <div>
              <Label className="mb-1.5 block" variant="overline">{t("admin.navigation.introImage")}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  accept=".mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.avif"
                  className="min-w-0 flex-1"
                  disabled={isUploadingIntro || config.intro.images.length >= 3}
                  onChange={(event) => void handleIntroImageUpload(event.target.files?.[0])}
                  type="file"
                />
                <Button
                  disabled={config.intro.images.length >= 3}
                  onClick={() => setIntroGalleryTarget({ kind: "add" })}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {t("media.picker.chooseFromGallery")}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-0 flex-1"
                  disabled={isUploadingIntro || config.intro.images.length >= 3}
                  onChange={(event) => {
                    setIntroDriveUrl(event.target.value);
                    if (introDriveError) setIntroDriveError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleIntroDriveImport(introDriveUrl);
                    }
                  }}
                  placeholder={t("admin.navigation.introDrivePlaceholder")}
                  type="url"
                  value={introDriveUrl}
                />
                <Button
                  disabled={isUploadingIntro || !introDriveUrl.trim() || config.intro.images.length >= 3}
                  onClick={() => void handleIntroDriveImport(introDriveUrl)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {t("admin.navigation.introDriveAdd")}
                </Button>
              </div>
              {introDriveError ? (
                <p className="mt-1.5 text-xs font-medium text-[var(--status-danger)]" role="alert">
                  {introDriveError}
                </p>
              ) : null}
              <Text className="mt-2" variant="small">
                {isUploadingIntro
                  ? t("admin.articles.loading")
                  : t("admin.navigation.introImageLimit", { count: String(config.intro.images.length) })}
              </Text>
              <div className="mt-2 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-xs text-[var(--status-warning-text)]">
                {t("admin.navigation.introUploadHint")}
              </div>
              {isUploadingIntro && introUploadProgress ? (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>
                      {introUploadProgress.phase === "processing"
                        ? t("media.gallery.processing")
                        : t("media.gallery.uploading")}
                    </span>
                    {introUploadProgress.phase === "uploading" ? (
                      <span className="font-medium tabular-nums">{introUploadProgress.percent}%</span>
                    ) : null}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <div
                      className={`h-full rounded-full bg-[var(--brand-primary)] transition-all duration-200 ${
                        introUploadProgress.phase === "processing" ? "animate-pulse" : ""
                      }`}
                      style={{
                        width: introUploadProgress.phase === "processing" ? "100%" : `${introUploadProgress.percent}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {config.intro.images.length ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {config.intro.images.map((image, index) => (
                  <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]" key={image.id}>
                    <div className="relative aspect-video overflow-hidden bg-[var(--bg-base)]">
                      {/\.(webm|mp4|mov|m4v)(\?.*)?$/i.test(image.url) ? (
                        <>
                          <video aria-hidden="true" autoPlay className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75" loop muted playsInline src={image.url} />
                          <video autoPlay className="absolute inset-0 h-full w-full object-contain object-center" loop muted playsInline src={image.url} />
                        </>
                      ) : (
                        <>
                          <Image alt="" aria-hidden="true" className="scale-110 object-cover blur-2xl brightness-75" fill sizes="(min-width: 1024px) 33vw, 100vw" src={image.url} unoptimized />
                          <Image alt="" className="object-contain object-center" fill sizes="(min-width: 1024px) 33vw, 100vw" src={image.url} unoptimized />
                        </>
                      )}
                    </div>
                    <div className="grid gap-3 p-4">
                      <Label variant="overline">{t("admin.navigation.introImagePeriod", { number: String(index + 1) })}</Label>
                      <Input
                        max={30}
                        min={1}
                        onChange={(event) =>
                          setConfig((prev) => ({
                            ...prev,
                            intro: {
                              ...prev.intro,
                              images: prev.intro.images.map((item) =>
                                item.id === image.id
                                  ? { ...item, durationSeconds: Math.min(30, Math.max(1, Number(event.target.value) || 1)) }
                                  : item,
                              ),
                            },
                          }))
                        }
                        type="number"
                        value={image.durationSeconds}
                      />
                      <Label variant="overline">{t("admin.navigation.introMobileImage")}</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          accept=".mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.avif"
                          className="min-w-0 flex-1"
                          disabled={isUploadingIntro}
                          onChange={(event) => void handleIntroMobileImageUpload(image.id, event.target.files?.[0])}
                          type="file"
                        />
                        <Button
                          onClick={() => setIntroGalleryTarget({ imageId: image.id, kind: "mobile" })}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          {t("media.picker.gallery")}
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="min-w-0 flex-1"
                          disabled={isUploadingIntro}
                          onChange={(event) => {
                            const val = event.target.value;
                            setMobileDriveUrls((prev) => ({ ...prev, [image.id]: val }));
                            if (introDriveError) setIntroDriveError(null);
                          }}
                          placeholder={t("admin.navigation.introDrivePlaceholder")}
                          type="url"
                          value={mobileDriveUrls[image.id] ?? ""}
                        />
                        <Button
                          disabled={isUploadingIntro || !(mobileDriveUrls[image.id] ?? "").trim()}
                          onClick={() => void handleIntroDriveImport(mobileDriveUrls[image.id] ?? "", image.id)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          {t("admin.navigation.introDriveAdd")}
                        </Button>
                      </div>
                      <Button
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            intro: { ...prev.intro, images: prev.intro.images.filter((item) => item.id !== image.id) },
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="danger"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("action.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">
                {t("admin.navigation.introImageEmpty")}
              </div>
            )}
          </Card>
        ) : null}

        {/* TAB 1: HEADER & NAVIGATION */}
        {activeTab === "header" ? (
          <div className="grid gap-8">
            <Card className="grid gap-4 p-6">
              <Title as="h2" variant="subsectionStrong">
                {t("admin.navigation.branding")}
              </Title>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.brandName")}
                  </Label>
                  <Input
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, brandName: e.target.value },
                      }))
                    }
                    placeholder="HTNC"
                    value={config.header.brandName ?? ""}
                  />
                </div>
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.tagline")}
                  </Label>
                  <Input
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: { ...prev.header, tagline: e.target.value },
                      }))
                    }
                    placeholder="Hội Thánh Tin Lành"
                    value={config.header.tagline ?? ""}
                  />
                </div>
              </div>
            </Card>

            <Card className="grid gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Title as="h2" variant="subsectionStrong">
                  {t("admin.navigation.menuItems")}
                </Title>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddNavItem}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addMenuItem")}
                </Button>
              </div>

              <div className="grid gap-3 pt-2">
                {config.header.items.map((item, index) => {
                  const IconComp = resolveIcon(item.icon);
                  return (
                    <div
                      className={cn(
                        "grid gap-4 rounded-xl border p-4 transition-all",
                        item.visible
                          ? "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-base)] opacity-60"
                      )}
                      key={item.id || index}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <Text as="p" tone="inherit" variant="inherit" className="font-bold text-[var(--text-primary)]">
                              {localize(item, "label")}
                            </Text>
                            <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-secondary)]">{item.href}</Text>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            aria-label="Move Up"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] disabled:opacity-30"
                            disabled={index === 0}
                            onClick={() => handleMoveNavItem(index, "up")}
                            type="button"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="Move Down"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] disabled:opacity-30"
                            disabled={index === config.header.items.length - 1}
                            onClick={() => handleMoveNavItem(index, "down")}
                            type="button"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="Toggle Visibility"
                            className={cn(
                              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] transition-colors",
                              item.visible
                                ? "text-[var(--status-success)] hover:bg-[var(--brand-soft)]"
                                : "text-[var(--text-tertiary)] hover:bg-[var(--brand-soft)]"
                            )}
                            onClick={() => handleUpdateNavItem(index, { visible: !item.visible })}
                            type="button"
                          >
                            {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            aria-label="Toggle Guest Access"
                            className={cn(
                              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] transition-colors",
                              item.guestVisible !== false
                                ? "text-[var(--status-success)] hover:bg-[var(--brand-soft)]"
                                : "text-[var(--text-tertiary)] hover:bg-[var(--brand-soft)]"
                            )}
                            onClick={() => handleUpdateNavItem(index, { guestVisible: item.guestVisible === false })}
                            title={item.guestVisible !== false ? "Visible to guests" : "Members only"}
                            type="button"
                          >
                            {item.guestVisible !== false ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            aria-label="Delete Menu Item"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--status-danger)] hover:bg-[var(--brand-soft)]"
                            onClick={() => handleDeleteNavItem(index)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <Label variant="caption" className="mb-1 block">
                            {t("admin.navigation.labelVi")}
                          </Label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { labelVi: e.target.value })}
                            value={item.labelVi}
                          />
                        </div>
                        <div>
                          <Label variant="caption" className="mb-1 block">
                            {t("admin.navigation.labelEn")}
                          </Label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { labelEn: e.target.value })}
                            value={item.labelEn}
                          />
                        </div>
                        <div>
                          <Label variant="caption" className="mb-1 block">
                            {t("admin.navigation.url")}
                          </Label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { href: e.target.value })}
                            placeholder="/about"
                            value={item.href}
                          />
                        </div>
                      </div>

                      <div>
                        <Label variant="caption" className="mb-2 block">
                          {t("admin.navigation.icon")}
                        </Label>
                        <IconPicker
                          onChange={(newIcon) => handleUpdateNavItem(index, { icon: newIcon })}
                          value={item.icon ?? "users"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Header CTA Button */}
            <Card className="grid gap-4 p-6">
              <div className="flex items-center justify-between">
                <Title as="h2" variant="subsectionStrong">
                  {t("admin.navigation.cta")}
                </Title>
                <Label variant="field" className="flex cursor-pointer items-center gap-2">
                  <Input
                    checked={config.header.cta.enabled}
                    className="h-4 w-4 rounded accent-[var(--brand-primary)]"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          cta: { ...prev.header.cta, enabled: e.target.checked },
                        },
                      }))
                    }
                    type="checkbox"
                  />
                  {t("admin.navigation.enableCta")}
                </Label>
              </div>

              {config.header.cta.enabled ? (
                <div className="grid gap-3 pt-2 sm:grid-cols-3">
                  <div>
                    <Label variant="caption" className="mb-1 block">
                      {t("admin.navigation.ctaLabelVi")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            cta: { ...prev.header.cta, labelVi: e.target.value },
                          },
                        }))
                      }
                      value={config.header.cta.labelVi}
                    />
                  </div>
                  <div>
                    <Label variant="caption" className="mb-1 block">
                      {t("admin.navigation.ctaLabelEn")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            cta: { ...prev.header.cta, labelEn: e.target.value },
                          },
                        }))
                      }
                      value={config.header.cta.labelEn}
                    />
                  </div>
                  <div>
                    <Label variant="caption" className="mb-1 block">
                      {t("admin.navigation.ctaUrl")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          header: {
                            ...prev.header,
                            cta: { ...prev.header.cta, href: e.target.value },
                          },
                        }))
                      }
                      placeholder="/contact"
                      value={config.header.cta.href}
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}

        {/* TAB 2: PAGE HEROES & BANNERS */}
        {activeTab === "heroes" ? (
          <div className="grid gap-8">
            <Card className="p-6">
              <div className="mb-6">
                <Title as="h2" variant="subsectionStrong">
                  {t("admin.navigation.heroesTitle")}
                </Title>
              </div>

              {/* Page Selector Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-4 mb-6">
                {HERO_PAGES.map((page) => (
                  <button
                    key={page.key}
                    onClick={() => setSelectedHeroPage(page.key)}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer",
                      selectedHeroPage === page.key
                        ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span>{t(page.labelKey as any)}</span>
                    <span className="text-[10px] opacity-70 font-mono">({page.key})</span>
                  </button>
                ))}
              </div>

              {/* Selected Page Hero Settings */}
              <div className="grid gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.eyebrowVi")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { eyebrowVi: e.target.value })
                      }
                      placeholder="Bài viết"
                      value={currentHeroConfig.eyebrowVi ?? ""}
                    />
                  </div>
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.eyebrowEn")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { eyebrowEn: e.target.value })
                      }
                      placeholder="Articles"
                      value={currentHeroConfig.eyebrowEn ?? ""}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.titleVi")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { titleVi: e.target.value })
                      }
                      placeholder="Bài viết & Tin tức"
                      value={currentHeroConfig.titleVi ?? ""}
                    />
                  </div>
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.titleEn")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { titleEn: e.target.value })
                      }
                      placeholder="Articles & News"
                      value={currentHeroConfig.titleEn ?? ""}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.descVi")}
                    </Label>
                    <Textarea
                      className="min-h-24"
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { descriptionVi: e.target.value })
                      }
                      value={currentHeroConfig.descriptionVi ?? ""}
                    />
                  </div>
                  <div>
                    <Label variant="overline" className="mb-1.5 block">
                      {t("admin.navigation.descEn")}
                    </Label>
                    <Textarea
                      className="min-h-24"
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { descriptionEn: e.target.value })
                      }
                      value={currentHeroConfig.descriptionEn ?? ""}
                    />
                  </div>
                </div>

                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.coverImage")}
                  </Label>
                  <Input
                    onChange={(e) =>
                      handleUpdateHero(selectedHeroPage, { coverImage: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    value={currentHeroConfig.coverImage ?? ""}
                  />
                </div>

                {/* Live Preview */}
                <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
                  <Text as="p" tone="inherit" variant="inherit" className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)] mb-4">
                    {t("admin.navigation.preview")}
                  </Text>
                  <div className="grid items-start gap-8 lg:grid-cols-2">
                    <div className="flex flex-col items-start gap-3">
                      {localize(currentHeroConfig, "eyebrow") ? (
                        <Text tone="gold" variant="eyebrow">
                          {localize(currentHeroConfig, "eyebrow")}
                        </Text>
                      ) : null}
                      <Title as="h3" className="font-serif" tone="brand" variant="pagePlain">
                        {localize(currentHeroConfig, "title", "Title")}
                      </Title>
                      <Text as="p" tone="inherit" variant="inherit" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {localize(currentHeroConfig, "description", "Description")}
                      </Text>
                    </div>

                    <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Hero preview"
                        className="h-full w-full object-cover"
                        src={currentHeroConfig.coverImage || "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {/* TAB 3: FOOTER & CONTACTS */}
        {activeTab === "footer" ? (
          <div className="grid gap-8">
            <Card className="grid gap-4 p-6">
              <Title as="h2" variant="subsectionStrong">
                {t("admin.navigation.footerBio")}
              </Title>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.communityTitle")}
                  </Label>
                  <Input
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, communityTitle: e.target.value },
                      }))
                    }
                    placeholder="Cộng đồng đức tin"
                    value={config.footer.communityTitle ?? ""}
                  />
                </div>
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.copyright")}
                  </Label>
                  <Input
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, copyrightTextVi: e.target.value },
                      }))
                    }
                    placeholder="Mọi quyền được bảo lưu."
                    value={config.footer.copyrightTextVi ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.descVi")}
                  </Label>
                  <Textarea
                    className="min-h-24"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, descriptionVi: e.target.value },
                      }))
                    }
                    value={config.footer.descriptionVi ?? ""}
                  />
                </div>
                <div>
                  <Label variant="overline" className="mb-1.5 block">
                    {t("admin.navigation.descEn")}
                  </Label>
                  <Textarea
                    className="min-h-24"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, descriptionEn: e.target.value },
                      }))
                    }
                    value={config.footer.descriptionEn ?? ""}
                  />
                </div>
              </div>
            </Card>

            <Card className="grid gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Title as="h2" variant="subsectionStrong">
                  {t("admin.navigation.footerContacts")}
                </Title>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddContact}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addContact")}
                </Button>
              </div>

              <div className="grid gap-4 pt-2">
                {config.footer.contacts.map((contact, index) => (
                  <div
                    className="grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
                    key={contact.id || index}
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                        #{index + 1}
                      </span>
                      <button
                        className="cursor-pointer text-xs font-semibold text-[var(--status-danger)] hover:underline"
                        onClick={() => handleDeleteContact(index)}
                        type="button"
                      >
                        {t("action.delete")}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label variant="caption" className="mb-1 block">
                          {t("admin.navigation.labelVi")}
                        </Label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { labelVi: e.target.value })}
                          value={contact.labelVi}
                        />
                      </div>
                      <div>
                        <Label variant="caption" className="mb-1 block">
                          {t("admin.navigation.labelEn")}
                        </Label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { labelEn: e.target.value })}
                          value={contact.labelEn}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label variant="caption" className="mb-1 block">
                          {t("admin.navigation.valueVi")}
                        </Label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { valueVi: e.target.value })}
                          value={contact.valueVi}
                        />
                      </div>
                      <div>
                        <Label variant="caption" className="mb-1 block">
                          {t("admin.navigation.valueEn")}
                        </Label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { valueEn: e.target.value })}
                          value={contact.valueEn}
                        />
                      </div>
                    </div>

                    <div>
                      <Label variant="caption" className="mb-1 block">
                        {t("admin.navigation.contactUrl")}
                      </Label>
                      <Input
                        onChange={(e) => handleUpdateContact(index, { href: e.target.value || undefined })}
                        placeholder="mailto:hello@httlncvn.local"
                        value={contact.href ?? ""}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="grid gap-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Title as="h2" variant="subsectionStrong">
                  {t("admin.navigation.footerLinks")}
                </Title>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddFooterLink}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addFooterLink")}
                </Button>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {config.footer.links.map((link, index) => (
                  <div
                    className="grid gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5"
                    key={link.id || index}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--brand-primary)]">
                        #{index + 1}
                      </span>
                      <button
                        className="cursor-pointer text-xs font-semibold text-[var(--status-danger)] hover:underline"
                        onClick={() => handleDeleteFooterLink(index)}
                        type="button"
                      >
                        {t("action.delete")}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        onChange={(e) => handleUpdateFooterLink(index, { labelVi: e.target.value })}
                        placeholder="Tiếng Việt"
                        value={link.labelVi}
                      />
                      <Input
                        onChange={(e) => handleUpdateFooterLink(index, { labelEn: e.target.value })}
                        placeholder="English"
                        value={link.labelEn}
                      />
                    </div>
                    <Input
                      onChange={(e) => handleUpdateFooterLink(index, { href: e.target.value })}
                      placeholder="/about"
                      value={link.href}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <MediaPickerModal
        onClose={() => setIntroGalleryTarget(null)}
        onSelect={(item) => {
          if (!introGalleryTarget) return;
          if (introGalleryTarget.kind === "add") {
            const newId = `intro-${Date.now()}`;
            setConfig((prev) => ({
              ...prev,
              intro: {
                ...prev.intro,
                images: [
                  ...prev.intro.images,
                  {
                    durationSeconds: 3,
                    id: newId,
                    url: item.url,
                  },
                ].slice(0, 3),
              },
            }));
            void detectVideoDurationSeconds(item.url).then((seconds) => {
              if (!seconds) return;
              setConfig((prev) => ({
                ...prev,
                intro: {
                  ...prev.intro,
                  images: prev.intro.images.map((img) =>
                    img.id === newId ? { ...img, durationSeconds: seconds } : img,
                  ),
                },
              }));
            });
          } else {
            setConfig((prev) => ({
              ...prev,
              intro: {
                ...prev.intro,
                images: prev.intro.images.map((img) =>
                  img.id === introGalleryTarget.imageId
                    ? { ...img, mobileUrl: item.url }
                    : img,
                ),
              },
            }));
          }
          setIntroGalleryTarget(null);
        }}
        open={Boolean(introGalleryTarget)}
      />
    </PageLayout>
  );
}
