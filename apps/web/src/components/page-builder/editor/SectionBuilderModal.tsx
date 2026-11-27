"use client";

import { Button, Text, Title, cn } from "@/components/ui";
import { useState, type ReactElement, type ReactNode } from "react";
import { Element, useEditor } from "@craftjs/core";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useTranslation } from "@/providers/I18nProvider";
import { ContentEditContext, SectionInsertContext } from "../shared/NodeFrame";
import { getButtonVariantClass } from "../shared/helpers";
import { defaultHeroSliderImages, HeroImageSliderBlock } from "../blocks/hero/HeroImageSliderBlock";
import { defaultGalleryImages, GalleryMarqueeBlock } from "../blocks/gallery/GalleryMarqueeBlock";
import { FeedCarouselBlock } from "../blocks/gallery/FeedCarouselBlock";
import { FeatureZigzagCardBlock, FeatureZigzagListBlock } from "../blocks/features/FeatureZigzagBlock";
import { FeatureGridListBlock } from "../blocks/features/FeatureGridListBlock";
import { FeatureIconListBlock } from "../blocks/features/FeatureIconListBlock";
import { FeatureOrbitListBlock } from "../blocks/features/FeatureOrbitListBlock";
import { FeatureTabbedListBlock } from "../blocks/features/FeatureTabbedListBlock";
import { FeatureTestimonialListBlock } from "../blocks/features/FeatureTestimonialListBlock";
import { CtaInvitationBlock } from "../blocks/cta/CtaInvitationBlock";
import { CtaSimpleBlock } from "../blocks/cta/CtaSimpleBlock";
import { SectionBlock } from "../blocks/layout/SectionBlock";
import { RowBlock, VerticalStackBlock } from "../blocks/layout/StackBlocks";
import { TextBlock } from "../blocks/basic/TextBlock";
import { RichTextBlock } from "../blocks/basic/RichTextBlock";
import { ButtonBlock } from "../blocks/basic/ButtonBlock";
import { ImageBlock } from "../blocks/basic/ImageBlock";
import { IconBoxBlock } from "../blocks/basic/IconBoxBlock";
import { ContentEditorDialog } from "./ContentEditorDialog";
import { localizeSectionExampleProps, sectionExampleCopy } from "./sectionExampleCopy";
import { sectionCategories, sectionCategoryKeys, sectionPresetNameKey, sectionPresets, type SectionCategory, type SectionPreset } from "./sectionPresets";
import type { FeedCardStyle } from "../shared/types";

const sampleImage = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85";

export function createSectionPreset(preset: SectionPreset, contentLocale: Locale): ReactElement {
  const copy = (text: string) => sectionExampleCopy(contentLocale, text);
  const centered = preset.variant % 2 === 1;

  if (preset.category === "Hero") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} columns={2} gap="var(--section-space-lg)" padding="var(--section-hero-padding)">
        <Element canvas is={VerticalStackBlock} justifyContent="space-between" gap="var(--section-space-md)" minHeight="var(--section-hero-slider-height)" mobileAlignItems="center">
          <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" mobileAlignItems="center">
            <TextBlock align="left" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text={copy("Discover a place made for you")} weight="var(--section-weight-bold)" />
            <TextBlock align="left" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text={copy("Find meaningful community, grow in faith, and take your next step with us.")} />
          </Element>
          <Element canvas is={RowBlock} alignItems="center" gap="var(--section-space-sm)" mobileAlignItems="center">
            <ButtonBlock href="/contact" label={copy("Plan a visit")} mobileAlign="center" />
            <ButtonBlock href="/about" label={copy("Learn more")} mobileAlign="center" variant="ghost" />
          </Element>
        </Element>
        <HeroImageSliderBlock />
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} gap="var(--section-space-lg)" minHeight="var(--section-hero-min-height)" padding="var(--section-hero-padding)">
        <Element canvas is={VerticalStackBlock} alignItems="center" gap="var(--section-space-md)" justifyContent="center" mobileAlignItems="center">
          <TextBlock align="center" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text={copy("Recovery and support")} weight="var(--section-weight-bold)" />
          <TextBlock align="center" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text={copy("People and resources for every season of life.")} />
          <Element canvas is={RowBlock} alignItems="center" gap="var(--section-space-sm)" justifyContent="center" mobileAlignItems="center">
            <ButtonBlock href="/contact" label={copy("Get resources")} mobileAlign="center" />
            <ButtonBlock href="/about" label={copy("Stay connected")} mobileAlign="center" variant="secondary" />
          </Element>
        </Element>
        <ImageBlock alt={copy("Community gathering")} borderRadius="var(--section-radius-card)" height="var(--section-media-height)" kind="image" url={sampleImage} />
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} columns={2} gap="var(--section-space-lg)" padding="var(--section-hero-padding)">
      <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" justifyContent="space-between" minHeight="var(--section-media-height)" mobileAlignItems="center">
        <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" mobileAlignItems="center">
          <TextBlock align="left" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text={copy("A church for the whole family")} weight="var(--section-weight-bold)" />
          <TextBlock align="left" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text={copy("Experience inspiring worship, biblical teaching, and meaningful connections for people of all ages and backgrounds.")} />
        </Element>
        <Element canvas is={RowBlock} gap="var(--section-space-sm)" mobileAlignItems="center">
          <ButtonBlock href="/contact" label={copy("Plan a visit")} mobileAlign="center" />
        </Element>
      </Element>
      <ImageBlock alt={copy("Church community gathering")} borderRadius="var(--section-radius-card)" height="var(--section-media-height)" kind="image" url={defaultHeroSliderImages[0]} />
    </Element>;
  }

  if (preset.category === "Paragraph") {
    if (preset.variant === 4) {
      return (
        <Element
          canvas
          columns={1}
          gap="var(--section-space-lg)"
          is={SectionBlock}
          padding="var(--section-space-xl) var(--section-gutter)"
          sectionName={preset.name}
        >
          <Element
            alignItems="stretch"
            allowTextInsert
            canvas
            gap="var(--section-space-sm)"
            is={VerticalStackBlock}
          >
            <RichTextBlock
              align="left"
              content={copy("## Section Title\n\nWrite **rich text** or paste *Markdown* content here.\n\n- Bullet point one\n- Bullet point two")}
              removable
            />
          </Element>
        </Element>
      );
    }

    const columnCount = Math.min(3, Math.max(1, preset.variant));
    const headingTag = columnCount === 1 ? "h2" : "h3";
    const headingSize = columnCount === 1 ? "var(--section-heading-size)" : "var(--section-card-title-size)";

    return (
      <Element
        canvas
        columns={columnCount}
        gap="var(--section-space-lg)"
        is={SectionBlock}
        padding="var(--section-space-xl) var(--section-gutter)"
        sectionName={preset.name}
      >
        {Array.from({ length: columnCount }).map((_, index) => (
          <Element
            alignItems="stretch"
            allowTextInsert
            canvas
            gap="var(--section-space-sm)"
            is={VerticalStackBlock}
            key={index}
          >
            <TextBlock
              align="left"
              color="var(--text-primary)"
              lineHeight="var(--section-heading-leading)"
              removable
              size={headingSize}
              tag={headingTag}
              text={columnCount === 1 ? copy("Section heading") : copy("Column {number} heading").replace("{number}", String(index + 1))}
              weight="var(--section-weight-bold)"
            />
            <TextBlock
              align="left"
              color="var(--text-secondary)"
              lineHeight="var(--section-body-leading)"
              removable
              size="var(--section-body-size)"
              tag="p"
              text={copy("Write your paragraph content here. Use the buttons below to add more headers or paragraphs vertically.")}
              weight="400"
            />
          </Element>
        ))}
      </Element>
    );
  }

  if (preset.category === "Feature list") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureZigzagListBlock} {...localizeSectionExampleProps(FeatureZigzagListBlock.craft.props, contentLocale)}>
          <FeatureZigzagCardBlock buttonLabel={copy("Learn more")} description={copy("Create a welcoming digital home that helps people connect and take their next step.")} imageAlt={copy("People gathering together")} imageUrl={defaultHeroSliderImages[2]} title={copy("A place to belong")} />
          <FeatureZigzagCardBlock buttonLabel={copy("Learn more")} description={copy("Share resources, events, and opportunities with your community wherever they are.")} imageAlt={copy("Community resources")} imageUrl={defaultHeroSliderImages[1]} title={copy("Stay connected")} />
        </Element>
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureGridListBlock} {...localizeSectionExampleProps(FeatureGridListBlock.craft.props, contentLocale)}>
          <FeatureZigzagCardBlock buttonLabel={copy("Learn more")} description={copy("Discover engaging programs and caring environments where children learn and grow.")} imageAlt={copy("Kids ministry")} imageUrl={defaultHeroSliderImages[0]} layout="vertical" title={copy("Kids & Family")} />
          <FeatureZigzagCardBlock buttonLabel={copy("Learn more")} description={copy("Connect with peers, build meaningful friendships, and navigate life together.")} imageAlt={copy("Youth gathering")} imageUrl={defaultHeroSliderImages[1]} layout="vertical" title={copy("Youth & Students")} />
          <FeatureZigzagCardBlock buttonLabel={copy("Learn more")} description={copy("Find support, encouragement, and practical care for every stage of your journey.")} imageAlt={copy("Community support")} imageUrl={defaultHeroSliderImages[2]} layout="vertical" title={copy("Care & Support")} />
        </Element>
      </Element>;
    }

    if (preset.variant === 3) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <FeatureTabbedListBlock {...localizeSectionExampleProps(FeatureTabbedListBlock.craft.props, contentLocale)} />
      </Element>;
    }

    if (preset.variant === 4) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <FeatureTestimonialListBlock {...localizeSectionExampleProps(FeatureTestimonialListBlock.craft.props, contentLocale)} />
      </Element>;
    }

    if (preset.variant === 5) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureIconListBlock} {...localizeSectionExampleProps(FeatureIconListBlock.craft.props, contentLocale)}>
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="handHeart" padding="var(--section-space-none)" removable title={copy("Compassion")} />
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="users" padding="var(--section-space-none)" removable title={copy("Community")} />
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="shield" padding="var(--section-space-none)" removable title={copy("Discipleship")} />
        </Element>
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
      <FeatureOrbitListBlock {...localizeSectionExampleProps(FeatureOrbitListBlock.craft.props, contentLocale)} />
    </Element>;
  }

  if (preset.category === "CTA") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaInvitationBlock {...localizeSectionExampleProps(CtaInvitationBlock.craft.props, contentLocale)} />
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaSimpleBlock {...localizeSectionExampleProps(CtaSimpleBlock.craft.props, contentLocale)} layout="split" title={copy("Stay connected with our community")} />
      </Element>;
    }

    if (preset.variant === 3) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaSimpleBlock {...localizeSectionExampleProps(CtaSimpleBlock.craft.props, contentLocale)} layout="center" title={copy("Ready to take your next step?")} />
      </Element>;
    }

    if (preset.variant === 4) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--brand-primary)" backgroundImage={sampleImage} padding="var(--section-space-none)">
        <CtaSimpleBlock {...localizeSectionExampleProps(CtaSimpleBlock.craft.props, contentLocale)} background="rgba(0,0,0,0.6)" layout="center" title={copy("Experience worship this Sunday")} />
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
      <CtaSimpleBlock {...localizeSectionExampleProps(CtaSimpleBlock.craft.props, contentLocale)} background="var(--page-builder-cta-bg)" layout="split" title={copy("Ready to take your next step?")} />
    </Element>;
  }

  if (preset.category === "Gallery") {
    if (preset.variant === 1) {
      const { images, subtitle, title } = GalleryMarqueeBlock.craft.props;
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <GalleryMarqueeBlock {...localizeSectionExampleProps({ images, subtitle, title }, contentLocale)} />
      </Element>;
    }
    const cardStyles: FeedCardStyle[] = ["cinematic", "editorial", "minimal", "split", "cinematic"];
    return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
      <TextBlock align={centered ? "center" : "left"} size="var(--section-heading-size)" tag="h2" text={copy("Explore our latest content")} weight="var(--section-weight-bold)" />
      <TextBlock align={centered ? "center" : "left"} color="var(--text-secondary)" text={copy("Choose articles, courses, or events to feature in this gallery.")} />
      <FeedCarouselBlock cardStyle={cardStyles[preset.variant - 1]} emptyMessage={copy(FeedCarouselBlock.craft.props.emptyMessage)} feedType="articles" itemsPerScreen={preset.variant === 4 ? 2 : preset.variant === 5 ? 1 : 3} selectedItemIds={[]} slideWidth={preset.variant === 5 ? "var(--section-gallery-feature-width)" : "var(--section-gallery-standard-width)"} />
    </Element>;
  }

  return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
    <TextBlock align={centered ? "center" : "left"} size="var(--section-heading-size)" tag="h2" text={preset.name} weight="var(--section-weight-bold)" />
  </Element>;
}

export function createPresetNodeTree(element: ReactElement, query: any) {
  return query.parseReactElement(element).toNodeTree();
}

export function SectionPresetPreview({ contentLocale, preset }: { contentLocale: Locale; preset: SectionPreset }) {
  const { t } = useTranslation();
  const copy = (text: string) => sectionExampleCopy(contentLocale, text);

  if (preset.category === "Hero") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 grid-cols-2 items-center gap-6 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid gap-3">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-bold leading-tight text-[var(--text-primary)]">{copy("Discover a place made for you")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{copy("Find meaningful community, grow in faith, and take your next step with us.")}</span>
            <div className="flex gap-2 pt-2">
              <span className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">{copy("Plan a visit")}</span>
              <span className="rounded-lg border border-[var(--brand-primary)] bg-transparent px-4 py-2 text-xs font-semibold text-[var(--brand-primary)]">{copy("Learn more")}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-2 h-44">
            <div className="h-[85%] overflow-hidden rounded-t-full rounded-b-lg border border-[var(--border-subtle)] bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${defaultHeroSliderImages[0]})` }} />
            <div className="h-full overflow-hidden rounded-t-full rounded-b-lg border border-[var(--border-subtle)] bg-cover bg-center shadow-md" style={{ backgroundImage: `url(${defaultHeroSliderImages[1]})` }} />
            <div className="h-[85%] overflow-hidden rounded-t-full rounded-b-lg border border-[var(--border-subtle)] bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${defaultHeroSliderImages[2]})` }} />
          </div>
        </div>
      );
    }

    if (preset.variant === 2) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-2 text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{copy("Recovery and support")}</span>
            <span className="max-w-md text-xs text-[var(--text-secondary)]">{copy("People and resources for every season of life.")}</span>
            <div className="flex gap-2 pt-1">
              <span className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">{copy("Get resources")}</span>
              <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]">{copy("Stay connected")}</span>
            </div>
          </div>
          <div className="h-24 w-full overflow-hidden rounded-lg bg-cover bg-center border border-[var(--border-subtle)]" style={{ backgroundImage: `url(${sampleImage})` }} />
        </div>
      );
    }

    return (
      <div className="grid min-h-72 grid-cols-2 items-center gap-6 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <div className="grid gap-3">
          <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
          <span className="text-2xl font-bold leading-tight text-[var(--text-primary)]">{copy("A church for the whole family")}</span>
          <span className="text-xs text-[var(--text-secondary)]">{copy("Experience inspiring worship, biblical teaching, and meaningful connections.")}</span>
          <div className="pt-2">
            <span className="inline-block rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">{copy("Plan a visit")}</span>
          </div>
        </div>
        <div className="h-44 w-full overflow-hidden rounded-xl bg-cover bg-center border border-[var(--border-subtle)] shadow-sm" style={{ backgroundImage: `url(${defaultHeroSliderImages[0]})` }} />
      </div>
    );
  }

  if (preset.category === "Paragraph") {
    if (preset.variant === 4) {
      return (
        <div className="grid min-h-72 content-center gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <Text as="span" tone="gold" variant="eyebrow">{t("pageBuilder.preset.paragraph-4")}</Text>
          <div className="grid gap-2">
            <span className="text-base font-bold text-[var(--text-primary)]">{copy("Section Title")}</span>
            <span className="text-xs leading-5 text-[var(--text-secondary)]">
              {copy("Supports Markdown headings, lists, links, quotes, tables, and rich HTML with a built-in toolbar and live preview.")}
            </span>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--text-secondary)]">
              <li>{copy("Bullet point one")}</li>
              <li>{copy("Bullet point two")}</li>
            </ul>
          </div>
        </div>
      );
    }

    const columnCount = Math.min(3, Math.max(1, preset.variant));
    return (
      <div className="grid min-h-72 content-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
        <div
          className={cn(
            "grid gap-4",
            columnCount === 1 ? "grid-cols-1" : columnCount === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {Array.from({ length: columnCount }).map((_, index) => (
            <div className={cn("grid content-start gap-2", index > 0 && "border-l border-[var(--border-subtle)] pl-4")} key={index}>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {columnCount === 1 ? copy("Section heading") : copy("Column {number}").replace("{number}", String(index + 1))}
              </span>
              <span className="text-xs leading-5 text-[var(--text-secondary)]">
                {copy("Clean vertical text column with editable headers and paragraphs.")}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="rounded border border-dashed border-[var(--border-strong)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">{copy("+ Header")}</span>
                <span className="rounded border border-dashed border-[var(--border-strong)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">{copy("+ Paragraph")}</span>
                <span className="rounded border border-dashed border-[var(--border-strong)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">{copy("+ Rich Text / Markdown")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preset.category === "Feature list") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid gap-0.5">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <Title as="span" variant="card">{copy("Ways to grow together")}</Title>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5">
              <div className="h-16 w-full rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${defaultHeroSliderImages[2]})` }} />
              <div className="grid gap-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">{copy("A place to belong")}</span>
                <span className="line-clamp-2 text-[10px] leading-3 text-[var(--text-secondary)]">{copy("Create a welcoming home that helps people connect.")}</span>
                <span className="text-[10px] font-semibold text-[var(--brand-primary)]">{copy("Learn more →")}</span>
              </div>
            </div>
            <div className="grid grid-cols-[1.2fr_0.8fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5">
              <div className="grid gap-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">{copy("Stay connected")}</span>
                <span className="line-clamp-2 text-[10px] leading-3 text-[var(--text-secondary)]">{copy("Share resources, events, and opportunities.")}</span>
                <span className="text-[10px] font-semibold text-[var(--brand-primary)]">{copy("Learn more →")}</span>
              </div>
              <div className="h-16 w-full rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${defaultHeroSliderImages[1]})` }} />
            </div>
          </div>
        </div>
      );
    }

    if (preset.variant === 2) {
      return (
        <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid justify-items-center text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <Title as="span" variant="card">{copy("Everyone has a next step")}</Title>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { img: defaultHeroSliderImages[0], title: copy("Kids & Family") },
              { img: defaultHeroSliderImages[1], title: copy("Youth & Students") },
              { img: defaultHeroSliderImages[2], title: copy("Care & Support") },
            ].map((item, index) => (
              <div className="flex flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-sm" key={index}>
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.img})` }} />
                <div className="p-2 text-center">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (preset.variant === 3) {
      return (
        <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid gap-0.5">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <Title as="span" variant="card">{copy("Find your place to grow")}</Title>
          </div>
          <div className="grid grid-cols-2 items-center gap-3">
            <div className="grid gap-1">
              {[copy("Kids and families"), copy("Groups and community"), copy("Care and support")].map((title, index) => (
                <div className={cn("rounded-md px-3 py-1.5 text-xs font-semibold", index === 0 ? "bg-[var(--bg-card)] text-[var(--brand-primary)]" : "text-[var(--text-secondary)]")} key={index}>
                  {title}
                </div>
              ))}
            </div>
            <div className="h-32 w-full overflow-hidden rounded-lg bg-cover bg-center border border-[var(--border-subtle)] shadow-sm" style={{ backgroundImage: `url(${defaultHeroSliderImages[0]})` }} />
          </div>
        </div>
      );
    }

    if (preset.variant === 4) {
      return (
        <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid gap-0.5">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <Title as="span" variant="card">{copy("Lives changed through community")}</Title>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] p-3">
            <blockquote className="text-xs italic text-[var(--text-primary)]">{copy("“This church helped our family find real community and grow closer to Jesus together.”")}</blockquote>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div>
                <strong className="block text-[var(--text-primary)]">Jordan Lee</strong>
                <span className="text-[var(--text-secondary)]">{copy("Community member")}</span>
              </div>
              <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 font-bold text-[var(--brand-primary)]">{copy("Fellowship family")}</span>
            </div>
          </div>
          <div className="flex border-t border-[var(--border-subtle)] pt-1 text-[11px] text-[var(--text-secondary)] gap-3">
            <span className="font-bold text-[var(--brand-primary)]">{copy("Fellowship family")}</span>
            <span>{copy("Local outreach")}</span>
          </div>
        </div>
      );
    }

    if (preset.variant === 5) {
      return (
        <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid justify-items-center text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <Title as="span" variant="card">{copy("Serve in a fellowship ministry")}</Title>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "❤️", title: copy("Compassion") },
              { icon: "👥", title: copy("Community") },
              { icon: "🛡️", title: copy("Discipleship") },
            ].map((item, index) => (
              <div className="grid justify-items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3" key={index}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="grid justify-items-center text-center">
          <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
          <Title as="span" variant="card">{copy("Values that shape our church")}</Title>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="grid gap-2 text-center">
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">{copy("Faith first")}</span></div>
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">{copy("Serve with love")}</span></div>
          </div>
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-xs shadow-md">
            {copy("Values")}
          </div>
          <div className="grid gap-2 text-center">
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">{copy("Grow together")}</span></div>
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">{copy("Live generously")}</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (preset.category === "CTA" && preset.variant === 1) {
    return <div className="grid min-h-56 content-between justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">{copy("You belong here")}</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">{copy("Join us this Sunday in person or online. We would love to welcome you and your family.")}</span>
      <div className="grid w-full grid-cols-3 gap-2">
        {[{ time: "08:00 AM", title: copy("Early Gathering") }, { time: "10:00 AM", title: copy("Main Service") }, { time: "06:00 PM", title: copy("Youth") }].map((item, index) => <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-left" key={index}><span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)]">{item.time}</span><span className="block text-xs font-semibold text-[var(--text-inverse)]">{item.title}</span></div>)}
      </div>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "CTA" && preset.variant === 2) {
    return <div className="grid min-h-56 content-center justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">{copy("Stay connected")}</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">{copy("Receive church news, stories, and upcoming gathering details.")}</span>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "CTA") {
    return <div className="grid min-h-56 content-center justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">{t(sectionPresetNameKey(preset))}</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">{copy("Editable title, subtitle, and action button.")}</span>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "Gallery") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-1 text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">{copy("Endless image loop")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{copy("Continuous horizontal scrolling photo marquee.")}</span>
          </div>
          <div className="flex gap-2 overflow-hidden py-1">
            {defaultGalleryImages.slice(0, 4).map((img, index) => (
              <div
                className="h-28 w-44 shrink-0 rounded-lg bg-cover bg-center border border-[var(--border-subtle)] shadow-sm"
                key={index}
                style={{ backgroundImage: `url(${img.url})` }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (preset.variant === 2) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-1 text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">{copy("Editorial feed")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{copy("Equal-height multi-column cards with top cover images and structured typography.")}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { cat: copy("ARTICLE"), desc: copy("Discover how we serve our neighborhood through weekly programs."), title: copy("Faith in action") },
              { cat: copy("SERMON"), desc: copy("Walking through timeless scripture to guide our modern journeys."), title: copy("Living with purpose") },
              { cat: copy("COMMUNITY"), desc: copy("Connect with small groups gathering throughout the week."), title: copy("Life together") },
            ].map((item, index) => (
              <div className="flex flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-sm" key={index}>
                <div
                  className="h-20 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${defaultGalleryImages[index % defaultGalleryImages.length].url})` }}
                />
                <div className="flex flex-1 flex-col justify-between gap-1 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)]">{item.cat}</span>
                  <span className="text-xs font-semibold leading-tight text-[var(--text-primary)]">{item.title}</span>
                  <span className="line-clamp-2 text-[11px] leading-4 text-[var(--text-secondary)]">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (preset.variant === 3) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-1 text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">{copy("Minimal feed")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{copy("Clean editorial text feed with refined typography and top/bottom borders.")}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { cat: copy("STORIES"), desc: copy("Reflections and testimonies from our congregation."), title: copy("Walking in faith") },
              { cat: copy("TEACHING"), desc: copy("Key takeaways from our current Sunday sermon series."), title: copy("Grace upon grace") },
              { cat: copy("OUTREACH"), desc: copy("Serving our local community with hands of hope."), title: copy("Love in action") },
            ].map((item, index) => (
              <div className="flex flex-col justify-between border-y border-[var(--border-strong)] bg-transparent p-3" key={index}>
                <div className="grid gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-px w-4 bg-[var(--accent-gold)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{item.cat}</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{item.title}</span>
                  <span className="text-[11px] leading-4 text-[var(--text-secondary)]">{item.desc}</span>
                </div>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">{copy("Read more →")}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (preset.variant === 4) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-1 text-center">
            <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">{copy("Split-card feed")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{copy("Horizontal dual-pane cards featuring prominent photography alongside story details.")}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { cat: copy("HIGHLIGHT"), desc: copy("Experience our vibrant Sunday worship and community fellowship."), title: copy("Worship gathering") },
              { cat: copy("MINISTRY"), desc: copy("Empowering the next generation to grow in knowledge and truth."), title: copy("Youth fellowship") },
            ].map((item, index) => (
              <div className="grid grid-cols-[0.8fr_1.2fr] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-sm" key={index}>
                <div
                  className="h-full min-h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${defaultGalleryImages[(index + 1) % defaultGalleryImages.length].url})` }}
                />
                <div className="flex flex-col justify-center gap-1 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)]">{item.cat}</span>
                  <span className="text-xs font-semibold leading-tight text-[var(--text-primary)]">{item.title}</span>
                  <span className="line-clamp-2 text-[11px] leading-4 text-[var(--text-secondary)]">{item.desc}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">{copy("View details")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Variant 5: Featured feed
    return (
      <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <div className="grid justify-items-center gap-1 text-center">
          <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
          <span className="text-2xl font-semibold text-[var(--text-primary)]">{copy("Featured feed")}</span>
          <span className="text-xs text-[var(--text-secondary)]">{copy("Heroic cinematic showcase highlighting our marquee story or upcoming series.")}</span>
        </div>
        <div
          className="relative flex h-36 items-end overflow-hidden rounded-xl bg-cover bg-center p-4 text-[var(--text-inverse)] shadow-md"
          style={{ backgroundImage: `url(${defaultGalleryImages[0].url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative grid gap-1">
            <span className="inline-flex w-fit rounded-full bg-[var(--accent-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              {copy("FEATURED STORY")}
            </span>
            <span className="text-base font-semibold text-white">{copy("Join us for special worship & community night")}</span>
            <span className="text-xs text-white/80">{copy("Every Sunday at 10:00 AM • Main Sanctuary")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-72 content-center justify-items-center gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
      <Text as="span" tone="gold" variant="eyebrow">{t(sectionCategoryKeys[preset.category])}</Text>
      <span className="text-2xl font-semibold text-[var(--text-primary)]">{t(sectionPresetNameKey(preset))}</span>
      <span className="text-xs text-[var(--text-secondary)]">{t("pageBuilder.presetPreviewDescription")}</span>
    </div>
  );
}

export function SectionBuilderProvider({ children, contentLocale }: { children: ReactNode; contentLocale: Locale }) {
  const { actions, query } = useEditor();
  const { t } = useTranslation();
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<SectionCategory>("Hero");
  const [selectedId, setSelectedId] = useState(sectionPresets[0].id);
  const visiblePresets = sectionPresets.filter((preset) => preset.category === category);
  const selectedPreset = sectionPresets.find((preset) => preset.id === selectedId) ?? visiblePresets[0];

  function chooseCategory(nextCategory: SectionCategory) {
    setCategory(nextCategory);
    setSelectedId(sectionPresets.find((preset) => preset.category === nextCategory)?.id ?? "");
  }

  function insertSection() {
    if (insertIndex === null || !selectedPreset) return;
    actions.addNodeTree(createPresetNodeTree(createSectionPreset(selectedPreset, contentLocale), query), "ROOT", insertIndex);
    setInsertIndex(null);
  }

  return (
    <ContentEditContext.Provider value={{ editingId, setEditingId }}>
      <SectionInsertContext.Provider value={setInsertIndex}>
        {children}
        <ContentEditorDialog />
        {insertIndex !== null ? (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4" onMouseDown={() => setInsertIndex(null)}>
            <div className="grid max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-[var(--bg-elevated)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                <div>
                  <Text as="p" tone="inherit" variant="inherit" className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{t("pageBuilder.sectionLibrary")}</Text>
                  <Title as="h3" tone="inherit" variant="cardSoft">{t("pageBuilder.addSection")}</Title>
                </div>
                <Button variant="unstyled" aria-label={t("action.close")} className="rounded-lg border border-[var(--border-subtle)] p-2" onClick={() => setInsertIndex(null)} type="button">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid min-h-0 md:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="grid content-start gap-1 overflow-y-auto border-r border-[var(--border-subtle)] p-4">
                  {sectionCategories.map((item) => (
                    <Button
                      variant="unstyled"
                      className={cn(
                        "rounded-lg px-4 py-3 text-left text-sm font-medium",
                        category === item ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "hover:bg-[var(--brand-soft)]",
                      )}
                      key={item}
                      onClick={() => chooseCategory(item)}
                      type="button"
                    >
                      {t(sectionCategoryKeys[item])}
                    </Button>
                  ))}
                </div>
                <div className="grid min-h-0 gap-5 overflow-y-auto p-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
                  <div className="grid content-start gap-2">
                    {visiblePresets.map((preset) => (
                      <Button
                        variant="unstyled"
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left",
                          selectedPreset?.id === preset.id ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]" : "border-[var(--border-subtle)]",
                        )}
                        key={preset.id}
                        onClick={() => setSelectedId(preset.id)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold">{t(sectionPresetNameKey(preset))}</span>
                        <span className="mt-1 block text-xs text-[var(--text-tertiary)]">
                          {t("pageBuilder.styleVariant", { variant: String(preset.variant) })}
                        </span>
                      </Button>
                    ))}
                  </div>
                  <div className="grid content-start gap-4">
                    {selectedPreset ? <SectionPresetPreview contentLocale={contentLocale} preset={selectedPreset} /> : null}
                    <Button
                      variant="unstyled"
                      className={cn(
                        "justify-self-end rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300",
                        getButtonVariantClass("primary"),
                      )}
                      onClick={insertSection}
                      type="button"
                    >
                      {t("pageBuilder.addSectionToPage")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SectionInsertContext.Provider>
    </ContentEditContext.Provider>
  );
}
