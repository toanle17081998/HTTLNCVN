"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";

export type SectionVariantId =
  | "hero-1"
  | "hero-2"
  | "hero-3"
  | "feature-list-1"
  | "feature-list-2"
  | "feature-list-3"
  | "feature-list-4"
  | "feature-list-5"
  | "feature-list-6"
  | "cta-1"
  | "cta-2"
  | "cta-3"
  | "cta-4"
  | "cta-5"
  | "gallery-1"
  | "gallery-2"
  | "gallery-3"
  | "gallery-4"
  | "gallery-5";

const SKELETON_CACHE_KEY = "httlncvn.pageSkeletons";

const routeVariantPresets: Record<string, SectionVariantId[]> = {
  "/": ["hero-1", "feature-list-1", "cta-1", "gallery-1", "feature-list-6", "gallery-5", "feature-list-4", "cta-2"],
  "/about": ["hero-2", "feature-list-6", "feature-list-1", "gallery-1", "feature-list-4", "cta-1"],
  "/church": ["hero-3", "feature-list-3", "feature-list-2", "feature-list-5", "cta-2"],
  "/contact": ["hero-3", "feature-list-5", "feature-list-4", "cta-3"],
  "/event": ["hero-2", "gallery-2", "feature-list-1", "gallery-1", "gallery-4", "cta-4"],
};

const defaultRouteVariants: SectionVariantId[] = ["hero-3", "feature-list-5", "cta-1"];

function Section({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <section className={muted ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-base)]"}>
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">{children}</div>
    </section>
  );
}

function HeadingSkeleton({ centered = false }: { centered?: boolean }) {
  return (
    <div className={centered ? "mx-auto mb-10 max-w-3xl space-y-3 text-center" : "mb-10 max-w-3xl space-y-3"}>
      <Skeleton className={centered ? "mx-auto h-10 w-3/4" : "h-10 w-3/4"} />
      <Skeleton className={centered ? "mx-auto h-5 w-2/3" : "h-5 w-2/3"} />
    </div>
  );
}

// Hero 1: Split image slider (3 arched vertical slides on right)
function HeroSplitSliderSkeleton() {
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 w-32 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid h-80 grid-cols-3 items-center gap-3 lg:h-[28rem]">
          <Skeleton className="h-[85%] w-full rounded-t-full rounded-b-xl" />
          <Skeleton className="h-full w-full rounded-t-full rounded-b-xl" />
          <Skeleton className="h-[85%] w-full rounded-t-full rounded-b-xl" />
        </div>
      </div>
    </Section>
  );
}

// Hero 2: Centered welcome (centered copy + buttons above wide bottom image)
function HeroCenteredWelcomeSkeleton() {
  return (
    <Section>
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex w-full max-w-3xl flex-col items-center space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-[1.75rem] lg:h-[26rem]" />
      </div>
    </Section>
  );
}

// Hero 3: Split feature image (left copy + single CTA, right single feature image)
function HeroSplitFeatureSkeleton() {
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="pt-4">
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
        <Skeleton className="min-h-80 w-full rounded-[1.75rem] lg:min-h-[26rem]" />
      </div>
    </Section>
  );
}

// Feature list 1: Zig-zag cards
function FeatureZigzagSkeleton() {
  return (
    <Section>
      <HeadingSkeleton />
      <div className="space-y-6">
        {[0, 1].map((item) => (
          <div className="grid overflow-hidden rounded-[1.75rem] bg-[var(--bg-surface)] lg:grid-cols-2" key={item}>
            <Skeleton className={item ? "min-h-72 rounded-none lg:order-2" : "min-h-72 rounded-none"} />
            <div className="flex flex-col justify-center space-y-4 p-8 lg:p-12">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-11 w-28" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Feature list 2: Image card grid
function FeatureGridSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton centered />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)]" key={item}>
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Feature list 3: Tabbed ministries
function FeatureTabsSkeleton() {
  return (
    <Section>
      <HeadingSkeleton />
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2].map((item) => (
          <Skeleton className="h-11 w-36 rounded-lg" key={item} />
        ))}
      </div>
      <div className="mt-6 grid overflow-hidden rounded-[1.75rem] bg-[var(--bg-surface)] lg:grid-cols-2">
        <div className="space-y-4 p-8 lg:p-12">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-11 w-28" />
        </div>
        <Skeleton className="min-h-80 rounded-none" />
      </div>
    </Section>
  );
}

// Feature list 4: Community testimonials
function FeatureTestimonialsSkeleton() {
  return (
    <Section>
      <HeadingSkeleton centered />
      <div className="mx-auto grid max-w-4xl gap-8 rounded-[2rem] bg-[var(--bg-surface)] p-8 md:grid-cols-[12rem_1fr]">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-2 h-5 w-36" />
        </div>
      </div>
    </Section>
  );
}

// Feature list 5: Centered icon grid
function FeatureIconListSkeleton() {
  return (
    <Section>
      <HeadingSkeleton centered />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border-subtle)] p-7 text-center" key={item}>
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </Section>
  );
}

// Feature list 6: Core values orbit
function FeatureOrbitSkeleton() {
  const valueColumn = (key: string) => (
    <div className="grid gap-12" key={key}>
      {[0, 1].map((item) => (
        <div className="flex flex-col items-center gap-3 text-center" key={item}>
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <Section muted>
      <HeadingSkeleton centered />
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_22rem_1fr]">
        {valueColumn("left")}
        <Skeleton className="order-first mx-auto h-72 w-72 rounded-full lg:order-none" />
        {valueColumn("right")}
      </div>
    </Section>
  );
}

// CTA 1: Centered invitation (CtaInvitationBlock)
function CtaCenteredInvitationSkeleton() {
  return (
    <section className="bg-[var(--brand-primary)] px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <Skeleton className="h-4 w-28 bg-white/20" />
        <Skeleton className="h-10 w-3/4 bg-white/20" />
        <Skeleton className="h-5 w-2/3 bg-white/20" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-36 rounded-lg bg-white/30" />
          <Skeleton className="h-11 w-32 rounded-lg bg-white/20" />
        </div>
      </div>
    </section>
  );
}

// CTA 2: Stay connected (CtaSimpleBlock split layout)
function CtaSplitConnectedSkeleton() {
  return (
    <section className="bg-[var(--bg-surface)] px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="w-full max-w-xl space-y-3">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="h-11 w-40 shrink-0 rounded-lg" />
      </div>
    </section>
  );
}

// CTA 3: Centered simple action (CtaSimpleBlock center layout)
function CtaCenteredSimpleSkeleton() {
  return (
    <section className="bg-[var(--bg-surface)] px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="mt-1 h-11 w-36 rounded-lg" />
      </div>
    </section>
  );
}

// CTA 4: Image-overlay action
function CtaImageOverlaySkeleton() {
  return (
    <section className="relative overflow-hidden bg-[var(--brand-primary)]/90 px-5 py-20 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <Skeleton className="h-10 w-3/4 bg-white/20" />
        <Skeleton className="h-5 w-2/3 bg-white/20" />
        <Skeleton className="mt-2 h-11 w-40 rounded-lg bg-white/30" />
      </div>
    </section>
  );
}

// CTA 5: Accent invitation (split on brand accent)
function CtaAccentSplitSkeleton() {
  return (
    <section className="bg-[var(--brand-primary)] px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="w-full max-w-xl space-y-3">
          <Skeleton className="h-9 w-3/4 bg-white/20" />
          <Skeleton className="h-5 w-5/6 bg-white/20" />
        </div>
        <Skeleton className="h-11 w-40 shrink-0 rounded-lg bg-white/30" />
      </div>
    </section>
  );
}

// Gallery 1: Endless image loop (marquee)
function GalleryMarqueeSkeleton() {
  return (
    <section className="overflow-hidden bg-[var(--bg-base)] py-12">
      <div className="flex gap-5 px-5">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton className="h-56 min-w-72 flex-1 rounded-2xl" key={item} />
        ))}
      </div>
    </section>
  );
}

// Gallery 2: Editorial feed (3-col image-top cards)
function GalleryEditorialFeedSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]" key={item}>
            <Skeleton className="aspect-[16/9] rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Gallery 3: Minimal feed (3-col text-forward bordered list cards)
function GalleryMinimalFeedSkeleton() {
  return (
    <Section>
      <HeadingSkeleton centered />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="flex min-h-72 flex-col justify-between border-y border-[var(--border-strong)] px-2 py-6" key={item}>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Section>
  );
}

// Gallery 4: Split-card feed (2-col horizontal image + text cards)
function GallerySplitFeedSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            className="grid min-h-64 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] sm:grid-cols-[0.9fr_1.1fr]"
            key={item}
          >
            <Skeleton className="min-h-48 rounded-none" />
            <div className="space-y-4 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// Gallery 5: Featured feed (single wide centered cinematic overlay card)
function GalleryFeaturedFeedSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton centered />
      <div className="mx-auto max-w-3xl">
        <div className="relative aspect-[16/10] min-h-[22rem] overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="relative flex h-full flex-col justify-between">
            <Skeleton className="h-7 w-28 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-3/4 bg-white/25" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-2/3 bg-white/20" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Skeleton className="h-2.5 w-7 rounded-full" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
        </div>
      </div>
    </Section>
  );
}

export const sectionVariantSkeletons: Record<SectionVariantId, () => ReactNode> = {
  "hero-1": HeroSplitSliderSkeleton,
  "hero-2": HeroCenteredWelcomeSkeleton,
  "hero-3": HeroSplitFeatureSkeleton,
  "feature-list-1": FeatureZigzagSkeleton,
  "feature-list-2": FeatureGridSkeleton,
  "feature-list-3": FeatureTabsSkeleton,
  "feature-list-4": FeatureTestimonialsSkeleton,
  "feature-list-5": FeatureIconListSkeleton,
  "feature-list-6": FeatureOrbitSkeleton,
  "cta-1": CtaCenteredInvitationSkeleton,
  "cta-2": CtaSplitConnectedSkeleton,
  "cta-3": CtaCenteredSimpleSkeleton,
  "cta-4": CtaImageOverlaySkeleton,
  "cta-5": CtaAccentSplitSkeleton,
  "gallery-1": GalleryMarqueeSkeleton,
  "gallery-2": GalleryEditorialFeedSkeleton,
  "gallery-3": GalleryMinimalFeedSkeleton,
  "gallery-4": GallerySplitFeedSkeleton,
  "gallery-5": GalleryFeaturedFeedSkeleton,
};

const validVariantIds = new Set<string>(Object.keys(sectionVariantSkeletons));

type CraftSerializedNode = {
  nodes?: string[];
  props?: Record<string, unknown>;
  type?: { resolvedName?: string } | string;
};

function getNodeTypeName(node: CraftSerializedNode | undefined): string {
  if (!node?.type) return "";
  return typeof node.type === "string" ? node.type : (node.type.resolvedName ?? "");
}

function collectDescendantNodes(
  nodesMap: Record<string, CraftSerializedNode>,
  rootId: string,
): CraftSerializedNode[] {
  const result: CraftSerializedNode[] = [];
  const queue = [rootId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodesMap[id];
    if (!node) continue;
    result.push(node);
    if (Array.isArray(node.nodes)) {
      queue.push(...node.nodes);
    }
  }
  return result;
}

function inferSectionVariant(
  nodesMap: Record<string, CraftSerializedNode>,
  sectionId: string,
): SectionVariantId {
  const sectionNode = nodesMap[sectionId];
  const descendants = collectDescendantNodes(nodesMap, sectionId);
  const typeNames = new Set(descendants.map(getNodeTypeName));

  if (typeNames.has("HeroImageSliderBlock")) return "hero-1";
  if (typeNames.has("FeatureZigzagListBlock")) return "feature-list-1";
  if (typeNames.has("FeatureGridListBlock")) return "feature-list-2";
  if (typeNames.has("FeatureTabbedListBlock")) return "feature-list-3";
  if (typeNames.has("FeatureTestimonialListBlock")) return "feature-list-4";
  if (typeNames.has("FeatureIconListBlock")) return "feature-list-5";
  if (typeNames.has("FeatureOrbitListBlock")) return "feature-list-6";
  if (typeNames.has("CtaInvitationBlock")) return "cta-1";

  const ctaSimple = descendants.find((node) => getNodeTypeName(node) === "CtaSimpleBlock");
  if (ctaSimple) {
    if (sectionNode?.props?.backgroundImage) return "cta-4";
    const layout = ctaSimple.props?.layout;
    if (layout === "center") return "cta-3";
    const bg = String(ctaSimple.props?.background ?? sectionNode?.props?.background ?? "");
    if (bg.includes("brand") || bg.includes("cta-bg")) return "cta-5";
    return "cta-2";
  }

  if (typeNames.has("GalleryMarqueeBlock")) return "gallery-1";

  const feedNode = descendants.find((node) => getNodeTypeName(node) === "FeedCarouselBlock");
  if (feedNode) {
    const cardStyle = String(feedNode.props?.cardStyle ?? "cinematic");
    if (cardStyle === "editorial") return "gallery-2";
    if (cardStyle === "minimal") return "gallery-3";
    if (cardStyle === "split") return "gallery-4";
    return "gallery-5";
  }

  const columns = Number(sectionNode?.props?.columns ?? 1);
  if (typeNames.has("ImageBlock")) {
    return columns >= 2 ? "hero-3" : "hero-2";
  }

  if (typeNames.has("IconBoxBlock")) return "feature-list-5";
  return "hero-2";
}

export function extractSectionVariantsFromCraftJson(rawJson: string): SectionVariantId[] {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, CraftSerializedNode>;
    const root = parsed?.ROOT;
    if (!root || !Array.isArray(root.nodes)) return [];
    const variants: SectionVariantId[] = [];
    for (const childId of root.nodes) {
      if (getNodeTypeName(parsed[childId]) === "SectionBlock") {
        variants.push(inferSectionVariant(parsed, childId));
      }
    }
    return variants;
  } catch {
    return [];
  }
}

const skeletonCacheListeners = new Set<() => void>();
const skeletonSnapshotCache = new Map<string, SectionVariantId[] | null>();

function subscribeSkeletonCache(listener: () => void) {
  skeletonCacheListeners.add(listener);
  return () => {
    skeletonCacheListeners.delete(listener);
  };
}

export function rememberPageSkeletonVariants(path: string, rawJson: string) {
  const variants = extractSectionVariantsFromCraftJson(rawJson);
  if (variants.length === 0) return;
  try {
    const existingRaw = window.localStorage.getItem(SKELETON_CACHE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, SectionVariantId[]>) : {};
    existing[path] = variants;
    window.localStorage.setItem(SKELETON_CACHE_KEY, JSON.stringify(existing));
    skeletonSnapshotCache.set(path, variants);
    skeletonCacheListeners.forEach((listener) => listener());
  } catch {
    // Ignore storage errors.
  }
}

function readCachedPageSkeletonVariants(path: string): SectionVariantId[] | null {
  if (skeletonSnapshotCache.has(path)) {
    return skeletonSnapshotCache.get(path) ?? null;
  }
  try {
    const raw = window.localStorage.getItem(SKELETON_CACHE_KEY);
    if (!raw) {
      skeletonSnapshotCache.set(path, null);
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const list = parsed?.[path];
    if (!Array.isArray(list) || list.length === 0) {
      skeletonSnapshotCache.set(path, null);
      return null;
    }
    const valid = list.filter((item): item is SectionVariantId => typeof item === "string" && validVariantIds.has(item));
    const result = valid.length > 0 ? valid : null;
    skeletonSnapshotCache.set(path, result);
    return result;
  } catch {
    return null;
  }
}

export function SectionVariantSkeleton({ variantId }: { variantId: SectionVariantId }) {
  const SkeletonComponent = sectionVariantSkeletons[variantId];
  return <SkeletonComponent />;
}

export function PageBuilderSkeleton({
  path,
  variants,
}: {
  path: string;
  variants?: SectionVariantId[];
}) {
  const cachedVariants = useSyncExternalStore(
    subscribeSkeletonCache,
    () => readCachedPageSkeletonVariants(path),
    () => null,
  );
  const resolvedVariants = variants ?? cachedVariants ?? routeVariantPresets[path] ?? defaultRouteVariants;

  return (
    <div aria-busy="true" aria-label="Loading page" className="w-full">
      {resolvedVariants.map((variantId, index) => (
        <SectionVariantSkeleton key={`${variantId}-${index}`} variantId={variantId} />
      ))}
    </div>
  );
}
