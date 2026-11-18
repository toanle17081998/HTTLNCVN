import { Skeleton } from "@/components/ui";

type SectionKind =
  | "cta"
  | "feed"
  | "gallery"
  | "grid"
  | "hero"
  | "icons"
  | "orbit"
  | "tabs"
  | "testimonials"
  | "zigzag";

const sectionPresets: Record<string, SectionKind[]> = {
  "/": ["hero", "zigzag", "cta", "gallery", "orbit", "feed", "testimonials", "cta"],
  "/about": ["hero", "orbit", "zigzag", "gallery", "testimonials", "cta"],
  "/church": ["hero", "tabs", "grid", "icons", "cta"],
  "/contact": ["hero", "icons", "testimonials", "cta"],
  "/event": ["hero", "feed", "zigzag", "gallery", "feed", "cta"],
};

function Section({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
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

function HeroSkeleton() {
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
        <Skeleton className="min-h-80 w-full rounded-[2rem] lg:min-h-[28rem]" />
      </div>
    </Section>
  );
}

function OrbitSkeleton() {
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

function ZigzagSkeleton() {
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

function TabsSkeleton() {
  return (
    <Section>
      <HeadingSkeleton />
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2].map((item) => <Skeleton className="h-11 w-36" key={item} />)}
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

function GridSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton />
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

function IconListSkeleton() {
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

function FeedSkeleton() {
  return (
    <Section muted>
      <HeadingSkeleton />
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)]" key={item}>
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

function GallerySkeleton() {
  return (
    <section className="overflow-hidden bg-[var(--bg-base)] py-10">
      <div className="flex gap-5 px-5">
        {[0, 1, 2, 3].map((item) => <Skeleton className="h-52 min-w-72 rounded-2xl" key={item} />)}
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <Section>
      <HeadingSkeleton centered />
      <div className="mx-auto grid max-w-4xl gap-8 rounded-[2rem] bg-[var(--bg-surface)] p-8 md:grid-cols-[12rem_1fr]">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
    </Section>
  );
}

function CtaSkeleton() {
  return (
    <section className="bg-[var(--brand-primary)] px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <Skeleton className="h-9 w-2/3 bg-white/20" />
        <Skeleton className="h-5 w-1/2 bg-white/20" />
        <Skeleton className="h-11 w-32 bg-white/30" />
      </div>
    </section>
  );
}

const sectionSkeletons: Record<SectionKind, () => React.ReactNode> = {
  cta: CtaSkeleton,
  feed: FeedSkeleton,
  gallery: GallerySkeleton,
  grid: GridSkeleton,
  hero: HeroSkeleton,
  icons: IconListSkeleton,
  orbit: OrbitSkeleton,
  tabs: TabsSkeleton,
  testimonials: TestimonialsSkeleton,
  zigzag: ZigzagSkeleton,
};

export function PageBuilderSkeleton({ path }: { path: string }) {
  const sections = sectionPresets[path] ?? ["hero", "icons", "cta"];

  return (
    <div aria-busy="true" aria-label="Loading page" className="w-full">
      {sections.map((kind, index) => {
        const SkeletonSection = sectionSkeletons[kind];
        return <SkeletonSection key={`${kind}-${index}`} />;
      })}
    </div>
  );
}
