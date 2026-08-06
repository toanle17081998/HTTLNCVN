import { ChurchLogo } from "@/components/layout/ChurchLogo";

type LoadingOverlayProps = {
  text?: string;
};

export function LoadingOverlay({ text }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-base)]/80 backdrop-blur-md transition-opacity">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 animate-ping rounded-full bg-[var(--brand-muted)] opacity-75" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface)] shadow-lg ring-1 ring-[var(--border-subtle)]">
          <ChurchLogo className="h-10 w-10 animate-pulse" />
        </div>
      </div>
      {text && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
