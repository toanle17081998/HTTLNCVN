"use client";

import { SafeImage as Image } from "@/components/ui/SafeImage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSiteNavigationQuery } from "@/hooks/siteNavigation";
import { ChurchLogo } from "./ChurchLogo";

type IntroPhase = "loading" | "logo" | "images" | "waiting" | "exiting" | "fading" | "done";

const minLogoDisplayMs = 500;
const logoDurationMs = 600;
const fadeOutDurationMs = 500;
const exitDurationMs = 800;

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(webm|mp4|mov|m4v)(\?.*)?$/i.test(url));
}

function IntroImage({
  mobileUrl,
  onVideoFailure,
  paused = false,
  priority,
  url,
}: {
  mobileUrl?: string;
  onVideoFailure?: () => void;
  paused?: boolean;
  priority?: boolean;
  url: string;
}) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const activeUrl = isMobile && mobileUrl ? mobileUrl : url;
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!paused) return;
    bgVideoRef.current?.pause();
    fgVideoRef.current?.pause();
  }, [paused]);

  useEffect(() => {
    const video = fgVideoRef.current;
    if (!video || !onVideoFailure || paused) return;
    if (video.error) {
      onVideoFailure();
      return;
    }

    let cancelled = false;
    const handleStalled = () => {
      if (!video.ended && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) onVideoFailure();
    };
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("error", onVideoFailure);
    if (video.paused && !video.ended) {
      video.muted = true;
      void video.play().catch(() => {
        if (!cancelled) onVideoFailure();
      });
    }
    return () => {
      cancelled = true;
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("error", onVideoFailure);
    };
  }, [activeUrl, onVideoFailure, paused]);

  if (isVideoUrl(activeUrl)) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[var(--bg-base)]">
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full scale-110 transform-gpu object-cover blur-2xl brightness-75"
          muted
          onEnded={(event) => event.currentTarget.pause()}
          playsInline
          preload="auto"
          ref={bgVideoRef}
          src={activeUrl}
        />
        <video
          autoPlay
          className="absolute inset-0 h-full w-full object-contain object-center"
          muted
          onEnded={(event) => event.currentTarget.pause()}
          playsInline
          preload="auto"
          ref={fgVideoRef}
          src={activeUrl}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--bg-base)]">
      <picture aria-hidden="true" className="absolute inset-0 block scale-110 blur-2xl brightness-75">
        {mobileUrl ? <source media="(max-width: 767px)" srcSet={mobileUrl} /> : null}
        <Image alt="" className="object-cover" fill priority={priority} sizes="100vw" src={url} unoptimized />
      </picture>
      <picture className="absolute inset-0 block">
        {mobileUrl ? <source media="(max-width: 767px)" srcSet={mobileUrl} /> : null}
        <Image alt="" className="object-contain object-center" fill priority={priority} sizes="100vw" src={url} unoptimized />
      </picture>
    </div>
  );
}

function RevealingIntroImage({
  mobileUrl,
  onVideoFailure,
  paused = false,
  priority,
  url,
}: {
  mobileUrl?: string;
  onVideoFailure?: () => void;
  paused?: boolean;
  priority: boolean;
  url: string;
}) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <div
      className="absolute inset-0"
      style={{
        clipPath: isRevealed
          ? "polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)"
          : "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
        transform: isRevealed ? "scale(1)" : "scale(1.12)",
        transition: "clip-path 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms ease",
      }}
    >
      <IntroImage mobileUrl={mobileUrl} onVideoFailure={onVideoFailure} paused={paused} priority={priority} url={url} />
    </div>
  );
}

export function LandingIntro({ onComplete }: { onComplete?: () => void }) {
  const navigationQuery = useSiteNavigationQuery();
  const hasStarted = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const shouldAnimatePage = useRef(false);
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [isPageReady, setIsPageReady] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("loading");
  const intro = navigationQuery.data?.intro;
  const images = useMemo(() => intro?.images ?? [], [intro?.images]);
  const hasIntro = Boolean(intro?.enabled && images.length);
  const canStart = hasIntro || isPageReady;

  const advanceIntro = useCallback(() => {
    if (activeImage < images.length - 1) {
      setActiveImage((current) => current === activeImage ? current + 1 : current);
    } else {
      setPhase((current) => current === "images" ? "waiting" : current);
    }
  }, [activeImage, images.length]);

  const skipVideo = useCallback(() => {
    const image = images[activeImage];
    if (!image) return;
    setFailedImages((current) => current.includes(image.id) ? current : [...current, image.id]);
    advanceIntro();
  }, [activeImage, advanceIntro, images]);

  useEffect(() => {
    startedAtRef.current = performance.now();
    document.documentElement.classList.add("landing-intro-active");
    return () => document.documentElement.classList.remove("landing-intro-active");
  }, []);

  useEffect(() => {
    const markReady = () => setIsPageReady(true);
    if (document.documentElement.dataset.landingPageReady === "true") {
      const timer = window.setTimeout(markReady, 0);
      return () => window.clearTimeout(timer);
    }
    const fallbackTimer = window.setTimeout(markReady, 10_000);
    window.addEventListener("httlncvn:landing-page-ready", markReady);
    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("httlncvn:landing-page-ready", markReady);
    };
  }, []);

  useEffect(() => {
    if (
      navigationQuery.isLoading ||
      (!navigationQuery.data && !navigationQuery.isError) ||
      !canStart ||
      hasStarted.current
    ) return;

    if (!hasIntro) {
      hasStarted.current = true;
      const elapsed = startedAtRef.current !== null ? performance.now() - startedAtRef.current : 0;
      const remaining = Math.max(0, minLogoDisplayMs - elapsed);
      const fadeTimer = window.setTimeout(() => setPhase("fading"), remaining);
      return () => {
        hasStarted.current = false;
        window.clearTimeout(fadeTimer);
      };
    }

    hasStarted.current = true;
    shouldAnimatePage.current = true;

    images.forEach((image) => {
      const targetUrl =
        window.matchMedia("(max-width: 767px)").matches && image.mobileUrl ? image.mobileUrl : image.url;
      if (isVideoUrl(targetUrl)) return;
      const preload = new window.Image();
      preload.decoding = "async";
      preload.fetchPriority = "high";
      preload.src = targetUrl;
    });
    setPhase("logo");
    const logoTimer = window.setTimeout(() => {
      setActiveImage(0);
      setPhase("images");
    }, logoDurationMs);

    return () => {
      hasStarted.current = false;
      window.clearTimeout(logoTimer);
    };
  }, [canStart, hasIntro, images, navigationQuery.data, navigationQuery.isError, navigationQuery.isLoading]);

  useEffect(() => {
    if (phase !== "images" || !images[activeImage]) return;
    const durationMs = Math.min(30, Math.max(1, images[activeImage].durationSeconds)) * 1000;
    const timer = window.setTimeout(advanceIntro, durationMs);

    return () => window.clearTimeout(timer);
  }, [activeImage, advanceIntro, images, phase]);

  useEffect(() => {
    if (phase !== "waiting" || !isPageReady) return;
    const timer = window.setTimeout(() => setPhase("exiting"), 0);
    return () => window.clearTimeout(timer);
  }, [isPageReady, phase]);

  useEffect(() => {
    if (phase !== "fading") return;
    const timer = window.setTimeout(() => setPhase("done"), fadeOutDurationMs);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    if (shouldAnimatePage.current) {
      window.dispatchEvent(new Event("httlncvn:page-appear"));
    }
    const timer = window.setTimeout(() => setPhase("done"), exitDurationMs);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    document.documentElement.classList.remove("landing-intro-active");
    onComplete?.();
  }, [onComplete, phase]);

  if (phase === "done") return null;

  const showImages = phase === "images" || phase === "waiting" || phase === "exiting";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] overflow-hidden bg-[var(--bg-base)] transition-opacity duration-500 ease-out ${phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
        } ${phase === "exiting" ? "landing-intro-diamond-exit" : ""}`}
    >
      {showImages
        ? images.map((image, index) =>
          index <= activeImage && !failedImages.includes(image.id) ? (
            <div
              className="absolute inset-0"
              key={image.id}
              style={{ zIndex: index + 1 }}
            >
              <RevealingIntroImage
                mobileUrl={image.mobileUrl}
                onVideoFailure={index === activeImage && phase === "images" ? skipVideo : undefined}
                paused={index < activeImage || phase === "waiting" || phase === "exiting"}
                priority={index === 0}
                url={image.url}
              />
            </div>
          ) : null,
        )
        : null}

      <div
        className="absolute inset-0 z-0 grid place-items-center"
      >
        <ChurchLogo className="h-28 w-28 drop-shadow-2xl sm:h-36 sm:w-36 lg:h-60 lg:w-60" />
      </div>
    </div>
  );
}
