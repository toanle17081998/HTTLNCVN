"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input, Textarea, cn } from "@/components/ui";
import { useArticlesQuery } from "@/services/article";
import { useCoursesQuery } from "@/services/course";
import { useEventsQuery } from "@/services/event";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, isAnchorTarget, parseNumberLike, resolveFeedCardHref, useIsMobile, withUnitFallback } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import { FeedCard } from "./FeedCard";
import type { BoxProps, FeedCardStyle, FeedItem, FeedType, SizeValue } from "../../shared/types";

type FeedProps = BoxProps & {
  autoPlay?: boolean;
  cardStyle?: FeedCardStyle;
  columns?: number | string;
  emptyMessage?: string;
  feedType?: FeedType;
  href?: string;
  gap?: SizeValue;
  intervalMs?: number | string;
  itemsPerScreen?: number | string;
  selectedItemIds?: string[];
  slideWidth?: SizeValue;
};

export function FeedCarouselBlock({
  autoPlay = true,
  background = "transparent",
  cardStyle = "cinematic",
  columns = 3,
  emptyMessage = "No content yet.",
  feedType = "articles",
  gap = "var(--section-space-sm)",
  href = "/",
  intervalMs = 5000,
  itemsPerScreen = 1,
  selectedItemIds = [],
  slideWidth = "56%",
  ...props
}: FeedProps) {
  const { enabled } = useEditor((state: any) => ({ enabled: state.options.enabled }));
  const isMobile = useIsMobile();
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const articlesQuery = useArticlesQuery({ status: "published", take: 8 });
  const coursesQuery = useCoursesQuery({ status: "published", take: 8 });
  const eventsQuery = useEventsQuery({ audience: "public", status: "published", upcoming: true, take: 8 });

  const articleItems = articlesQuery.data?.items ?? [];
  const courseItems = coursesQuery.data?.items ?? [];
  const eventItems = eventsQuery.data?.items ?? [];

  const allItems: FeedItem[] =
    feedType === "courses"
      ? courseItems.map((course) => ({
        accent: "var(--brand-primary)",
        coverImage: course.cover_image_url,
        description: course.summary_vi ?? course.summary_en ?? "Published course",
        href: `/course/${course.slug}`,
        id: course.id,
        kicker: course.category?.name_vi ?? course.category?.name_en ?? "",
        slug: course.slug,
        title: course.title_vi || course.title_en,
      }))
      : feedType === "events"
        ? eventItems.map((event) => ({
          accent: event.color ?? undefined,
          coverImage: event.cover_image_url ?? null,
          description: event.description ?? "",
          href: "/event",
          id: event.id,
          kicker: event.location ?? "",
          slug: event.slug,
          title: event.title,
        }))
        : articleItems.map((article) => ({
          accent: "var(--brand-primary)",
          coverImage: article.cover_image_url,
          description: (article.category?.name_vi || article.category?.name_en) ?? "Published article",
          href: `/article/${article.slug}`,
          id: article.id,
          kicker: article.status,
          slug: article.slug,
          title: article.title_vi || article.title_en,
        }));
  const items = selectedItemIds.length
    ? allItems.filter((item) => item.id && selectedItemIds.includes(item.id))
    : allItems;

  const isLoading =
    feedType === "articles"
      ? articlesQuery.isLoading
      : feedType === "courses"
        ? coursesQuery.isLoading
        : feedType === "events"
          ? eventsQuery.isLoading
          : false;

  const slideInterval = Math.max(1000, parseNumberLike(intervalMs, 5000));
  const visibleItems = isMobile ? 1 : Math.min(4, Math.max(1, Math.floor(parseNumberLike(itemsPerScreen, 1))));
  const lastStartIndex = Math.max(0, items.length - visibleItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, lastStartIndex);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [feedType]);

  useEffect(() => {
    if (!autoPlay || enabled || lastStartIndex === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % (lastStartIndex + 1));
    }, slideInterval);

    return () => window.clearInterval(timer);
  }, [autoPlay, enabled, items.length, lastStartIndex, slideInterval]);

  const gapValue = isMobile ? "var(--section-space-xs)" : withUnitFallback(gap, "var(--section-space-sm)") ?? "var(--section-space-sm)";
  const effectiveSlideWidth = isMobile
    ? "86%"
    : visibleItems > 1
      ? `calc((100% - (${gapValue} * ${visibleItems - 1})) / ${visibleItems})`
      : withUnitFallback(slideWidth, "56%") ?? "56%";
  const trackOffset = visibleItems > 1
    ? `calc(0px - (${safeActiveIndex} * (${effectiveSlideWidth} + ${gapValue})))`
    : `calc(50% - (${effectiveSlideWidth} / 2) - (${safeActiveIndex} * (${effectiveSlideWidth} + ${gapValue})))`;

  function goToSlide(index: number) {
    if (!items.length) return;
    const availableStarts = lastStartIndex + 1;
    const nextIndex = (index + availableStarts) % availableStarts;
    setActiveIndex(nextIndex);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isAnchorTarget(event.target)) return;
    if (items.length <= 1) return;
    dragStartXRef.current = event.clientX;
    dragDeltaRef.current = 0;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (isAnchorTarget(event.target)) return;
    if (dragStartXRef.current === null) return;
    const delta = event.clientX - dragStartXRef.current;
    dragDeltaRef.current = delta;
    setDragOffset(delta);
  }

  function finishDrag() {
    if (dragStartXRef.current === null) return;
    const threshold = 60;
    const delta = dragDeltaRef.current;

    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        goToSlide(safeActiveIndex + 1);
      } else {
        goToSlide(safeActiveIndex - 1);
      }
    }

    dragStartXRef.current = null;
    dragDeltaRef.current = 0;
    setDragOffset(0);
  }

  return (
    <NodeFrame>
      <div className="grid gap-4" style={buildBoxStyle({ ...props, background })}>
        {isLoading ? (
          <div
            className="grid"
            style={{
              gap: withUnitFallback(gap, "var(--section-space-sm)"),
              gridTemplateColumns: `repeat(${Math.max(1, parseNumberLike(columns, 3))}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: Math.max(1, parseNumberLike(columns, 3)) }).map((_, index) => (
              <div
                className="h-40 animate-pulse rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                key={index}
              />
            ))}
          </div>
        ) : items.length ? (
          <div className="relative grid gap-4">
            <div className="relative mx-auto w-full overflow-hidden">
              <div
                className="overflow-hidden py-2"
                onPointerCancel={finishDrag}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                style={{ touchAction: "pan-y" }}
              >
                <div
                  className="flex items-stretch transition-transform duration-500 ease-out"
                  style={{
                    gap: gapValue,
                    paddingLeft: "0px",
                    transform: `translateX(calc(${trackOffset} + ${dragOffset}px))`,
                  }}
                >
                  {items.map((item, index) => (
                    <div
                      className="flex shrink-0 flex-col self-stretch"
                      key={`${feedType}-${index}-${item.href}-${item.title}`}
                      style={{ flexBasis: effectiveSlideWidth }}
                    >
                      <FeedCard
                        accent={item.accent}
                        coverImage={item.coverImage}
                        description={item.description}
                        href={resolveFeedCardHref(item, href)}
                        isActive={index >= safeActiveIndex && index < safeActiveIndex + visibleItems}
                        kicker={item.kicker}
                        style={cardStyle}
                        title={item.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {lastStartIndex > 0 ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  aria-label="Previous slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:scale-95"
                  onClick={() => goToSlide(safeActiveIndex - 1)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: lastStartIndex + 1 }).map((_, index) => (
                    <button
                      aria-label={`Go to slide ${index + 1}`}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        index === safeActiveIndex
                          ? "h-2.5 w-7 bg-[var(--brand-primary)]"
                          : "h-2.5 w-2.5 bg-[var(--border-subtle)]",
                      )}
                      key={`feed-dot-${index}`}
                      onClick={() => setActiveIndex(index)}
                      type="button"
                    />
                  ))}
                </div>
                <button
                  aria-label="Next slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:scale-95"
                  onClick={() => goToSlide(safeActiveIndex + 1)}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 text-sm text-[var(--text-secondary)]">
            {emptyMessage}
          </div>
        )}
      </div>
    </NodeFrame>
  );
}

function FeedCarouselBlockSettings() {
  const {
    actions: { setProp },
    autoPlay,
    cardStyle,
    columns,
    emptyMessage,
    feedType,
    gap,
    href,
    intervalMs,
    itemsPerScreen,
    slideWidth,
  } = useNode((node) => ({
    autoPlay: node.data.props.autoPlay,
    cardStyle: node.data.props.cardStyle,
    columns: node.data.props.columns,
    emptyMessage: node.data.props.emptyMessage,
    feedType: node.data.props.feedType,
    gap: node.data.props.gap,
    href: node.data.props.href,
    intervalMs: node.data.props.intervalMs,
    itemsPerScreen: node.data.props.itemsPerScreen,
    slideWidth: node.data.props.slideWidth,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Feed type">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.feedType = value))}
          value={feedType ?? "articles"}
        >
          <option value="articles">Articles</option>
          <option value="courses">Courses</option>
          <option value="events">Events</option>
        </NativeSelect>
      </Field>
      <Field label="Card layout style">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.cardStyle = value))}
          value={cardStyle ?? "cinematic"}
        >
          <option value="cinematic">Cinematic (Photo overlay)</option>
          <option value="editorial">Editorial (Image on top)</option>
          <option value="minimal">Minimal (Clean list)</option>
          <option value="split">Split (Side by side)</option>
        </NativeSelect>
      </Field>
      <Field label="Items per view">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.itemsPerScreen = Number(value)))}
          value={String(itemsPerScreen ?? 1)}
        >
          <option value="1">1 Card</option>
          <option value="2">2 Cards</option>
          <option value="3">3 Cards</option>
          <option value="4">4 Cards</option>
        </NativeSelect>
      </Field>
      <Field label="Card width (for 1 item view)">
        <Input
          onChange={(event) => setProp((props: any) => (props.slideWidth = event.target.value))}
          value={String(slideWidth ?? "56%")}
        />
      </Field>
      <Field label="Auto play">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.autoPlay = value === "true"))}
          value={String(Boolean(autoPlay))}
        >
          <option value="true">On</option>
          <option value="false">Off</option>
        </NativeSelect>
      </Field>
      <Field label="Interval (ms)">
        <Input
          onChange={(event) => setProp((props: any) => (props.intervalMs = event.target.value))}
          value={String(intervalMs ?? 5000)}
        />
      </Field>
      <Field label="Gap">
        <Input onChange={(event) => setProp((props: any) => (props.gap = event.target.value))} value={String(gap ?? "16px")} />
      </Field>
      <Field label="Feed card href">
        <Input
          onChange={(event) => setProp((props: any) => (props.href = event.target.value))}
          placeholder="Leave blank for built-in post links, or use /article/{slug}"
          value={href}
        />
      </Field>
      <Field label="Empty state">
        <Textarea
          className="min-h-24"
          onChange={(event) => setProp((props: any) => (props.emptyMessage = event.target.value))}
          value={emptyMessage}
        />
      </Field>
      <BoxSettings />
    </div>
  );
}

FeedCarouselBlock.craft = {
  displayName: "Feed Carousel",
  props: {
    ...defaultBoxProps({
      background: "transparent",
      width: "100%",
    }),
    autoPlay: true,
    cardStyle: "cinematic",
    columns: 3,
    emptyMessage: "No content yet.",
    feedType: "articles",
    gap: "var(--section-space-sm)",
    href: "",
    intervalMs: 5000,
    itemsPerScreen: 1,
    selectedItemIds: [],
    slideWidth: "56%",
  },
  related: { settings: FeedCarouselBlockSettings },
};
