"use client";

import { useEffect, useState } from "react";
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
  Trash2,
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input, Textarea, cn } from "@/components/ui";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { IconPicker, resolveIcon } from "@/components/page-builder/shared/iconList";
import {
  defaultPageHeroes,
  defaultSiteNavigationConfig,
  useSiteNavigationQuery,
  useUpdateSiteNavigationMutation,
  type FooterContactItem,
  type FooterLinkItem,
  type HeaderNavItem,
  type PageHeroConfig,
  type SiteNavigationConfig,
} from "@/services/siteNavigation";

const HERO_PAGES = [
  { key: "/article", labelKey: "nav.article.label" },
  { key: "/course", labelKey: "nav.course.label" },
  { key: "/event", labelKey: "nav.event.label" },
  { key: "/church", labelKey: "nav.church.label" },
  { key: "/prayer-journal", labelKey: "nav.prayerJournal.label" },
  { key: "/about", labelKey: "nav.about.label" },
] as const;

export function AdminNavigation() {
  const { t, locale } = useTranslation();
  const { toast, confirm } = useFeedback();
  const navQuery = useSiteNavigationQuery();
  const updateMutation = useUpdateSiteNavigationMutation();

  const [activeTab, setActiveTab] = useState<"header" | "footer" | "heroes">("header");
  const [selectedHeroPage, setSelectedHeroPage] = useState<string>("/article");
  const [config, setConfig] = useState<SiteNavigationConfig>(defaultSiteNavigationConfig);

  useEffect(() => {
    if (navQuery.data) {
      setConfig(navQuery.data);
    }
  }, [navQuery.data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(config);
      toast({
        title: t("admin.navigation.saveSuccess" as any),
        variant: "success",
      });
    } catch {
      toast({
        title: t("admin.navigation.saveError" as any),
        variant: "error",
      });
    }
  };

  const handleResetDefaults = async () => {
    const ok = await confirm({
      confirmLabel: t("admin.navigation.resetConfirmLabel" as any),
      description: t("admin.navigation.resetConfirmDesc" as any),
      title: t("admin.navigation.resetConfirmTitle" as any),
      variant: "warning",
    });
    if (!ok) return;
    setConfig(defaultSiteNavigationConfig);
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
            {t("action.tryAgain" as any) || "Reset"}
          </Button>
          <Button
            className="cursor-pointer bg-[var(--brand-primary)] text-[var(--text-inverse)]"
            disabled={updateMutation.isPending}
            onClick={handleSave}
            type="button"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? t("admin.articles.loading" as any) : t("action.update" as any)}
          </Button>
        </div>
      }
      description={t("admin.navigation.description" as any)}
      eyebrow={t("admin.common.admin")}
      title={t("admin.navigation.title" as any)}
    >
      <div className="grid gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto">
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
            {t("admin.navigation.tabHeader" as any)}
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
            {t("admin.navigation.tabHeroes" as any)}
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
            {t("admin.navigation.tabFooter" as any)}
          </button>
        </div>

        {/* TAB 1: HEADER & NAVIGATION */}
        {activeTab === "header" ? (
          <div className="grid gap-8">
            <Card className="grid gap-4 p-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t("admin.navigation.branding" as any)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.brandName" as any)}
                  </label>
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.tagline" as any)}
                  </label>
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
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t("admin.navigation.menuItems" as any)}
                </h2>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddNavItem}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addMenuItem" as any)}
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
                            <p className="font-bold text-[var(--text-primary)]">
                              {locale === "vi" ? item.labelVi || item.labelEn : item.labelEn || item.labelVi}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">{item.href}</p>
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
                          <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                            {t("admin.navigation.labelVi" as any)}
                          </label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { labelVi: e.target.value })}
                            value={item.labelVi}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                            {t("admin.navigation.labelEn" as any)}
                          </label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { labelEn: e.target.value })}
                            value={item.labelEn}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                            {t("admin.navigation.url" as any)}
                          </label>
                          <Input
                            onChange={(e) => handleUpdateNavItem(index, { href: e.target.value })}
                            placeholder="/about"
                            value={item.href}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                          {t("admin.navigation.icon" as any)}
                        </label>
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
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t("admin.navigation.cta" as any)}
                </h2>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <input
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
                  {t("admin.navigation.enableCta" as any)}
                </label>
              </div>

              {config.header.cta.enabled ? (
                <div className="grid gap-3 pt-2 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                      {t("admin.navigation.ctaLabelVi" as any)}
                    </label>
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
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                      {t("admin.navigation.ctaLabelEn" as any)}
                    </label>
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
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                      {t("admin.navigation.ctaUrl" as any)}
                    </label>
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
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t("admin.navigation.heroesTitle" as any)}
                </h2>
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
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.eyebrowVi" as any)}
                    </label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { eyebrowVi: e.target.value })
                      }
                      placeholder="Bài viết"
                      value={currentHeroConfig.eyebrowVi ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.eyebrowEn" as any)}
                    </label>
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
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.titleVi" as any)}
                    </label>
                    <Input
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { titleVi: e.target.value })
                      }
                      placeholder="Bài viết & Tin tức"
                      value={currentHeroConfig.titleVi ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.titleEn" as any)}
                    </label>
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
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.descVi" as any)}
                    </label>
                    <Textarea
                      className="min-h-24"
                      onChange={(e) =>
                        handleUpdateHero(selectedHeroPage, { descriptionVi: e.target.value })
                      }
                      value={currentHeroConfig.descriptionVi ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t("admin.navigation.descEn" as any)}
                    </label>
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.coverImage" as any)}
                  </label>
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
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)] mb-4">
                    {t("admin.navigation.preview" as any)}
                  </p>
                  <div className="grid items-start gap-8 lg:grid-cols-2">
                    <div className="flex flex-col items-start gap-3">
                      {(locale === "vi" ? currentHeroConfig.eyebrowVi : currentHeroConfig.eyebrowEn) ? (
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                          {locale === "vi" ? currentHeroConfig.eyebrowVi : currentHeroConfig.eyebrowEn}
                        </p>
                      ) : null}
                      <h3 className="font-serif text-3xl font-bold text-[var(--brand-primary)]">
                        {(locale === "vi" ? currentHeroConfig.titleVi : currentHeroConfig.titleEn) || "Title"}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {(locale === "vi" ? currentHeroConfig.descriptionVi : currentHeroConfig.descriptionEn) ||
                          "Description"}
                      </p>
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
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t("admin.navigation.footerBio" as any)}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.communityTitle" as any)}
                  </label>
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.copyright" as any)}
                  </label>
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.descVi" as any)}
                  </label>
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t("admin.navigation.descEn" as any)}
                  </label>
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
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t("admin.navigation.footerContacts" as any)}
                </h2>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddContact}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addContact" as any)}
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
                        {t("action.delete" as any)}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                          {t("admin.navigation.labelVi" as any)}
                        </label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { labelVi: e.target.value })}
                          value={contact.labelVi}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                          {t("admin.navigation.labelEn" as any)}
                        </label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { labelEn: e.target.value })}
                          value={contact.labelEn}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                          {t("admin.navigation.valueVi" as any)}
                        </label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { valueVi: e.target.value })}
                          value={contact.valueVi}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                          {t("admin.navigation.valueEn" as any)}
                        </label>
                        <Input
                          onChange={(e) => handleUpdateContact(index, { valueEn: e.target.value })}
                          value={contact.valueEn}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                        {t("admin.navigation.contactUrl" as any)}
                      </label>
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
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {t("admin.navigation.footerLinks" as any)}
                </h2>
                <Button
                  className="cursor-pointer gap-1.5"
                  onClick={handleAddFooterLink}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin.navigation.addFooterLink" as any)}
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
                        {t("action.delete" as any)}
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
    </PageLayout>
  );
}
