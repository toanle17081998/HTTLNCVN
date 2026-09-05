"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { Element, useEditor } from "@craftjs/core";
import { X } from "lucide-react";
import { cn } from "@/components/ui";
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
import { ButtonBlock } from "../blocks/basic/ButtonBlock";
import { ImageBlock } from "../blocks/basic/ImageBlock";
import { IconBoxBlock } from "../blocks/basic/IconBoxBlock";
import { ContentEditorDialog } from "./ContentEditorDialog";
import type { FeedCardStyle } from "../shared/types";

export type SectionCategory = "Hero" | "Feature list" | "CTA" | "Gallery";
export type SectionPreset = { category: SectionCategory; id: string; name: string; variant: number };

export const sectionVariantNames: Record<SectionCategory, string[]> = {
  Hero: ["Split image slider", "Centered welcome", "Split feature image"],
  "Feature list": ["Zig-zag cards", "Image card grid", "Tabbed ministries", "Community testimonials", "Centered icon grid", "Core values orbit"],
  CTA: ["Centered invitation", "Stay connected", "Split action", "Image-overlay action", "Accent invitation"],
  Gallery: ["Endless image loop", "Editorial feed", "Minimal feed", "Split-card feed", "Featured feed"],
};

export const sectionPresets: SectionPreset[] = (Object.entries(sectionVariantNames) as Array<[SectionCategory, string[]]>).flatMap(([category, names]) => names.map((name, index) => ({
  category,
  id: `${category.toLowerCase().replace(" ", "-")}-${index + 1}`,
  name,
  variant: index + 1,
})));

const sampleImage = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=85";

export function createSectionPreset(preset: SectionPreset): ReactElement {
  const centered = preset.variant % 2 === 1;

  if (preset.category === "Hero") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} columns={2} gap="var(--section-space-lg)" padding="var(--section-hero-padding)">
        <Element canvas is={VerticalStackBlock} justifyContent="space-between" gap="var(--section-space-md)" minHeight="var(--section-hero-slider-height)" mobileAlignItems="center">
          <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" mobileAlignItems="center">
            <TextBlock align="left" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text="Discover a place made for you" weight="var(--section-weight-bold)" />
            <TextBlock align="left" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text="Find meaningful community, grow in faith, and take your next step with us." />
          </Element>
          <Element canvas is={RowBlock} alignItems="center" gap="var(--section-space-sm)" mobileAlignItems="center">
            <ButtonBlock href="/contact" label="Plan a visit" mobileAlign="center" />
            <ButtonBlock href="/about" label="Learn more" mobileAlign="center" variant="ghost" />
          </Element>
        </Element>
        <HeroImageSliderBlock />
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} gap="var(--section-space-lg)" minHeight="var(--section-hero-min-height)" padding="var(--section-hero-padding)">
        <Element canvas is={VerticalStackBlock} alignItems="center" gap="var(--section-space-md)" justifyContent="center" mobileAlignItems="center">
          <TextBlock align="center" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text="Recovery and support" weight="var(--section-weight-bold)" />
          <TextBlock align="center" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text="People and resources for every season of life." />
          <Element canvas is={RowBlock} alignItems="center" gap="var(--section-space-sm)" justifyContent="center" mobileAlignItems="center">
            <ButtonBlock href="/contact" label="Get resources" mobileAlign="center" />
            <ButtonBlock href="/about" label="Stay connected" mobileAlign="center" variant="secondary" />
          </Element>
        </Element>
        <ImageBlock alt="Community gathering" borderRadius="var(--section-radius-card)" height="var(--section-media-height)" kind="image" url={sampleImage} />
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} columns={2} gap="var(--section-space-lg)" padding="var(--section-hero-padding)">
      <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" justifyContent="space-between" minHeight="var(--section-media-height)" mobileAlignItems="center">
        <Element canvas is={VerticalStackBlock} gap="var(--section-space-md)" mobileAlignItems="center">
          <TextBlock align="left" color="var(--page-builder-hero-title)" lineHeight="var(--section-title-line-height)" mobileAlign="center" size="var(--section-title-size)" tag="h1" text="A church for the whole family" weight="var(--section-weight-bold)" />
          <TextBlock align="left" color="var(--text-secondary)" mobileAlign="center" size="var(--section-body-size)" text="Experience inspiring worship, biblical teaching, and meaningful connections for people of all ages and backgrounds." />
        </Element>
        <Element canvas is={RowBlock} gap="var(--section-space-sm)" mobileAlignItems="center">
          <ButtonBlock href="/contact" label="Plan a visit" mobileAlign="center" />
        </Element>
      </Element>
      <ImageBlock alt="Church community gathering" borderRadius="var(--section-radius-card)" height="var(--section-media-height)" kind="image" url={defaultHeroSliderImages[0]} />
    </Element>;
  }

  if (preset.category === "Feature list") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureZigzagListBlock}>
          <FeatureZigzagCardBlock description="Create a welcoming digital home that helps people connect and take their next step." imageAlt="People gathering together" imageUrl={defaultHeroSliderImages[2]} title="A place to belong" />
          <FeatureZigzagCardBlock description="Share resources, events, and opportunities with your community wherever they are." imageAlt="Community resources" imageUrl={defaultHeroSliderImages[1]} title="Stay connected" />
        </Element>
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureGridListBlock}>
          <FeatureZigzagCardBlock description="Discover engaging programs and caring environments where children learn and grow." imageAlt="Kids ministry" imageUrl={defaultHeroSliderImages[0]} layout="vertical" title="Kids & Family" />
          <FeatureZigzagCardBlock description="Connect with peers, build meaningful friendships, and navigate life together." imageAlt="Youth gathering" imageUrl={defaultHeroSliderImages[1]} layout="vertical" title="Youth & Students" />
          <FeatureZigzagCardBlock description="Find support, encouragement, and practical care for every stage of your journey." imageAlt="Community support" imageUrl={defaultHeroSliderImages[2]} layout="vertical" title="Care & Support" />
        </Element>
      </Element>;
    }

    if (preset.variant === 3) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <FeatureTabbedListBlock />
      </Element>;
    }

    if (preset.variant === 4) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <FeatureTestimonialListBlock />
      </Element>;
    }

    if (preset.variant === 5) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <Element canvas is={FeatureIconListBlock}>
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="handHeart" padding="var(--section-space-none)" removable title="Compassion" />
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="users" padding="var(--section-space-none)" removable title="Community" />
          <IconBoxBlock alignItems="center" background="transparent" borderWidth="var(--section-space-none)" icon="shield" padding="var(--section-space-none)" removable title="Discipleship" />
        </Element>
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
      <FeatureOrbitListBlock />
    </Element>;
  }

  if (preset.category === "CTA") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaInvitationBlock />
      </Element>;
    }

    if (preset.variant === 2) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaSimpleBlock layout="split" title="Stay connected with our community" />
      </Element>;
    }

    if (preset.variant === 3) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
        <CtaSimpleBlock layout="center" title="Ready to take your next step?" />
      </Element>;
    }

    if (preset.variant === 4) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--brand-primary)" backgroundImage={sampleImage} padding="var(--section-space-none)">
        <CtaSimpleBlock background="rgba(0,0,0,0.6)" layout="center" title="Experience worship this Sunday" />
      </Element>;
    }

    return <Element canvas is={SectionBlock} sectionName={preset.name} background="var(--page-builder-cta-bg)" padding="var(--section-space-none)">
      <CtaSimpleBlock background="var(--page-builder-cta-bg)" layout="split" title="Ready to take your next step?" />
    </Element>;
  }

  if (preset.category === "Gallery") {
    if (preset.variant === 1) {
      return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
        <GalleryMarqueeBlock />
      </Element>;
    }
    const cardStyles: FeedCardStyle[] = ["cinematic", "editorial", "minimal", "split", "cinematic"];
    return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
      <TextBlock align={centered ? "center" : "left"} size="var(--section-heading-size)" tag="h2" text="Explore our latest content" weight="var(--section-weight-bold)" />
      <TextBlock align={centered ? "center" : "left"} color="var(--text-secondary)" text="Choose articles, courses, or events to feature in this gallery." />
      <FeedCarouselBlock cardStyle={cardStyles[preset.variant - 1]} feedType="articles" itemsPerScreen={preset.variant === 4 ? 2 : preset.variant === 5 ? 1 : 3} selectedItemIds={[]} slideWidth={preset.variant === 5 ? "var(--section-gallery-feature-width)" : "var(--section-gallery-standard-width)"} />
    </Element>;
  }

  return <Element canvas is={SectionBlock} sectionName={preset.name} padding="var(--section-space-xl) var(--section-gutter)">
    <TextBlock align={centered ? "center" : "left"} size="var(--section-heading-size)" tag="h2" text={preset.name} weight="var(--section-weight-bold)" />
  </Element>;
}

export function createPresetNodeTree(element: ReactElement, query: any) {
  return query.parseReactElement(element).toNodeTree();
}

export function SectionPresetPreview({ preset }: { preset: SectionPreset }) {
  if (preset.category === "Hero") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 grid-cols-2 items-center gap-6 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Hero</span>
            <span className="text-2xl font-bold leading-tight text-[var(--text-primary)]">Discover a place made for you</span>
            <span className="text-xs text-[var(--text-secondary)]">Find meaningful community, grow in faith, and take your next step with us.</span>
            <div className="flex gap-2 pt-2">
              <span className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">Plan a visit</span>
              <span className="rounded-lg border border-[var(--brand-primary)] bg-transparent px-4 py-2 text-xs font-semibold text-[var(--brand-primary)]">Learn more</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Hero</span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">Recovery and support</span>
            <span className="max-w-md text-xs text-[var(--text-secondary)]">People and resources for every season of life.</span>
            <div className="flex gap-2 pt-1">
              <span className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">Get resources</span>
              <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]">Stay connected</span>
            </div>
          </div>
          <div className="h-24 w-full overflow-hidden rounded-lg bg-cover bg-center border border-[var(--border-subtle)]" style={{ backgroundImage: `url(${sampleImage})` }} />
        </div>
      );
    }

    return (
      <div className="grid min-h-72 grid-cols-2 items-center gap-6 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <div className="grid gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Hero</span>
          <span className="text-2xl font-bold leading-tight text-[var(--text-primary)]">A church for the whole family</span>
          <span className="text-xs text-[var(--text-secondary)]">Experience inspiring worship, biblical teaching, and meaningful connections.</span>
          <div className="pt-2">
            <span className="inline-block rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-inverse)]">Plan a visit</span>
          </div>
        </div>
        <div className="h-44 w-full overflow-hidden rounded-xl bg-cover bg-center border border-[var(--border-subtle)] shadow-sm" style={{ backgroundImage: `url(${defaultHeroSliderImages[0]})` }} />
      </div>
    );
  }

  if (preset.category === "Feature list") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid gap-0.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Ways to grow together</span>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5">
              <div className="h-16 w-full rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${defaultHeroSliderImages[2]})` }} />
              <div className="grid gap-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">A place to belong</span>
                <span className="line-clamp-2 text-[10px] leading-3 text-[var(--text-secondary)]">Create a welcoming home that helps people connect.</span>
                <span className="text-[10px] font-semibold text-[var(--brand-primary)]">Learn more →</span>
              </div>
            </div>
            <div className="grid grid-cols-[1.2fr_0.8fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5">
              <div className="grid gap-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">Stay connected</span>
                <span className="line-clamp-2 text-[10px] leading-3 text-[var(--text-secondary)]">Share resources, events, and opportunities.</span>
                <span className="text-[10px] font-semibold text-[var(--brand-primary)]">Learn more →</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Everyone has a next step</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { img: defaultHeroSliderImages[0], title: "Kids & Family" },
              { img: defaultHeroSliderImages[1], title: "Youth & Students" },
              { img: defaultHeroSliderImages[2], title: "Care & Support" },
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Find your place to grow</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-3">
            <div className="grid gap-1">
              {["Kids and families", "Groups and community", "Care and support"].map((title, index) => (
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Lives changed through community</span>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] p-3">
            <blockquote className="text-xs italic text-[var(--text-primary)]">“This church helped our family find real community and grow closer to Jesus together.”</blockquote>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div>
                <strong className="block text-[var(--text-primary)]">Jordan Lee</strong>
                <span className="text-[var(--text-secondary)]">Community member</span>
              </div>
              <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 font-bold text-[var(--brand-primary)]">Fellowship family</span>
            </div>
          </div>
          <div className="flex border-t border-[var(--border-subtle)] pt-1 text-[11px] text-[var(--text-secondary)] gap-3">
            <span className="font-bold text-[var(--brand-primary)]">Fellowship family</span>
            <span>Local outreach</span>
          </div>
        </div>
      );
    }

    if (preset.variant === 5) {
      return (
        <div className="grid min-h-72 content-between gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid justify-items-center text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Serve in a fellowship ministry</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "❤️", title: "Compassion" },
              { icon: "👥", title: "Community" },
              { icon: "🛡️", title: "Discipleship" },
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
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Feature list</span>
          <span className="text-xl font-bold text-[var(--text-primary)]">Values that shape our church</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="grid gap-2 text-center">
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">Faith first</span></div>
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">Serve with love</span></div>
          </div>
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-xs shadow-md">
            Values
          </div>
          <div className="grid gap-2 text-center">
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">Grow together</span></div>
            <div className="rounded border border-[var(--border-subtle)] p-1.5"><span className="text-xs font-bold">Live generously</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (preset.category === "CTA" && preset.variant === 1) {
    return <div className="grid min-h-56 content-between justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">You belong here</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">Join us this Sunday in person or online. We would love to welcome you and your family.</span>
      <div className="grid w-full grid-cols-3 gap-2">
        {[{ time: "08:00 AM", title: "Early Gathering" }, { time: "10:00 AM", title: "Main Service" }, { time: "06:00 PM", title: "Youth" }].map((item, index) => <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-left" key={index}><span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--accent-gold)]">{item.time}</span><span className="block text-xs font-semibold text-[var(--text-inverse)]">{item.title}</span></div>)}
      </div>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "CTA" && preset.variant === 2) {
    return <div className="grid min-h-56 content-center justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">Stay connected</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">Receive church news, stories, and upcoming gathering details.</span>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "CTA") {
    return <div className="grid min-h-56 content-center justify-items-center gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--page-builder-cta-bg)] p-6 text-center text-[var(--page-builder-cta-text)]">
      <span className="text-3xl font-semibold">{preset.name}</span>
      <span className="max-w-md text-sm text-[var(--page-builder-cta-muted)]">Editable title, subtitle, and action button.</span>
      <span className="h-9 w-32 rounded-lg bg-[var(--page-builder-cta-button-bg)]" />
    </div>;
  }

  if (preset.category === "Gallery") {
    if (preset.variant === 1) {
      return (
        <div className="grid min-h-72 content-between gap-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="grid justify-items-center gap-1 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Gallery</span>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">Endless image loop</span>
            <span className="text-xs text-[var(--text-secondary)]">Continuous horizontal scrolling photo marquee.</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Gallery</span>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">Editorial feed</span>
            <span className="text-xs text-[var(--text-secondary)]">Equal-height multi-column cards with top cover images and structured typography.</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { cat: "ARTICLE", desc: "Discover how we serve our neighborhood through weekly programs.", title: "Faith in action" },
              { cat: "SERMON", desc: "Walking through timeless scripture to guide our modern journeys.", title: "Living with purpose" },
              { cat: "COMMUNITY", desc: "Connect with small groups gathering throughout the week.", title: "Life together" },
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Gallery</span>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">Minimal feed</span>
            <span className="text-xs text-[var(--text-secondary)]">Clean editorial text feed with refined typography and top/bottom borders.</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { cat: "STORIES", desc: "Reflections and testimonies from our congregation.", title: "Walking in faith" },
              { cat: "TEACHING", desc: "Key takeaways from our current Sunday sermon series.", title: "Grace upon grace" },
              { cat: "OUTREACH", desc: "Serving our local community with hands of hope.", title: "Love in action" },
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
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">Read more →</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Gallery</span>
            <span className="text-2xl font-semibold text-[var(--text-primary)]">Split-card feed</span>
            <span className="text-xs text-[var(--text-secondary)]">Horizontal dual-pane cards featuring prominent photography alongside story details.</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { cat: "HIGHLIGHT", desc: "Experience our vibrant Sunday worship and community fellowship.", title: "Worship gathering" },
              { cat: "MINISTRY", desc: "Empowering the next generation to grow in knowledge and truth.", title: "Youth fellowship" },
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">View details</span>
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
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">Gallery</span>
          <span className="text-2xl font-semibold text-[var(--text-primary)]">Featured feed</span>
          <span className="text-xs text-[var(--text-secondary)]">Heroic cinematic showcase highlighting our marquee story or upcoming series.</span>
        </div>
        <div
          className="relative flex h-36 items-end overflow-hidden rounded-xl bg-cover bg-center p-4 text-[var(--text-inverse)] shadow-md"
          style={{ backgroundImage: `url(${defaultGalleryImages[0].url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative grid gap-1">
            <span className="inline-flex w-fit rounded-full bg-[var(--accent-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              FEATURED STORY
            </span>
            <span className="text-base font-semibold text-white">Join us for special worship & community night</span>
            <span className="text-xs text-white/80">Every Sunday at 10:00 AM • Main Sanctuary</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-72 content-center justify-items-center gap-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">{preset.category}</span>
      <span className="text-2xl font-semibold text-[var(--text-primary)]">{preset.name}</span>
      <span className="text-xs text-[var(--text-secondary)]">Editable title, subtitle, description, images, and links.</span>
    </div>
  );
}

export function SectionBuilderProvider({ children }: { children: ReactNode }) {
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
    actions.addNodeTree(createPresetNodeTree(createSectionPreset(selectedPreset), query), "ROOT", insertIndex);
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{t("pageBuilder.sectionLibrary")}</p>
                  <h3 className="text-xl font-semibold">{t("pageBuilder.addSection")}</h3>
                </div>
                <button aria-label="Close" className="rounded-lg border border-[var(--border-subtle)] p-2" onClick={() => setInsertIndex(null)} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid min-h-0 md:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="grid content-start gap-1 overflow-y-auto border-r border-[var(--border-subtle)] p-4">
                  {(["Hero", "Feature list", "CTA", "Gallery"] as SectionCategory[]).map((item) => {
                    const label =
                      item === "Hero"
                        ? t("pageBuilder.categoryHero")
                        : item === "Feature list"
                          ? t("pageBuilder.categoryFeatureList")
                          : item === "CTA"
                            ? t("pageBuilder.categoryCta")
                            : t("pageBuilder.categoryGallery");
                    return (
                      <button
                        className={cn(
                          "rounded-lg px-4 py-3 text-left text-sm font-medium",
                          category === item ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]" : "hover:bg-[var(--brand-soft)]",
                        )}
                        key={item}
                        onClick={() => chooseCategory(item)}
                        type="button"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid min-h-0 gap-5 overflow-y-auto p-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
                  <div className="grid content-start gap-2">
                    {visiblePresets.map((preset) => (
                      <button
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left",
                          selectedPreset?.id === preset.id ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]" : "border-[var(--border-subtle)]",
                        )}
                        key={preset.id}
                        onClick={() => setSelectedId(preset.id)}
                        type="button"
                      >
                        <span className="block text-sm font-semibold">{preset.name}</span>
                        <span className="mt-1 block text-xs text-[var(--text-tertiary)]">
                          {t("pageBuilder.styleVariant", { variant: String(preset.variant) })}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="grid content-start gap-4">
                    {selectedPreset ? <SectionPresetPreview preset={selectedPreset} /> : null}
                    <button
                      className={cn(
                        "justify-self-end rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300",
                        getButtonVariantClass("primary"),
                      )}
                      onClick={insertSection}
                      type="button"
                    >
                      {t("pageBuilder.addSectionToPage")}
                    </button>
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
