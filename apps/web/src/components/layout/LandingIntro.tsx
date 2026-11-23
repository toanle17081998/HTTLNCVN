"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSiteNavigationQuery } from "@/hooks/siteNavigation";
import { ChurchLogo } from "./ChurchLogo";

type IntroPhase = "loading" | "logo" | "images" | "waiting" | "exiting" | "done";

const logoDurationMs = 600;
const exitDurationMs = 800;

function IntroImage({ mobileUrl, priority, url }: { mobileUrl?: string; priority?: boolean; url: string }) {
  return (
    <picture className="absolute inset-0 block">
      {mobileUrl ? <source media="(max-width: 767px)" srcSet={mobileUrl} /> : null}
      <Image alt="" className="object-cover" fill priority={priority} sizes="100vw" src={url} unoptimized />
    </picture>
  );
}

function RevealingIntroImage({ mobileUrl, priority, url }: { mobileUrl?: string; priority: boolean; url: string }) {
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
      <IntroImage mobileUrl={mobileUrl} priority={priority} url={url} />
    </div>
  );
}

export function LandingIntro({ onComplete }: { onComplete?: () => void }) {
  const navigationQuery = useSiteNavigationQuery();
  const hasStarted = useRef(false);
  const shouldAnimatePage = useRef(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isPageReady, setIsPageReady] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("loading");
  const intro = navigationQuery.data?.intro;
  const images = useMemo(() => intro?.images ?? [], [intro?.images]);

  useEffect(() => {
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
      !navigationQuery.data ||
      hasStarted.current
    ) return;
    hasStarted.current = true;
    if (!intro?.enabled || images.length === 0) {
      const timer = window.setTimeout(() => setPhase("done"), 0);
      return () => window.clearTimeout(timer);
    }
    shouldAnimatePage.current = true;

    images.forEach((image) => {
      const preload = new window.Image();
      preload.decoding = "async";
      preload.fetchPriority = "high";
      preload.src = window.matchMedia("(max-width: 767px)").matches && image.mobileUrl
        ? image.mobileUrl
        : image.url;
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
  }, [images, intro?.enabled, navigationQuery.data, navigationQuery.isLoading]);

  useEffect(() => {
    if (phase !== "images" || !images[activeImage]) return;
    const durationMs = Math.min(30, Math.max(1, images[activeImage].durationSeconds)) * 1000;
    const timer = window.setTimeout(() => {
      if (activeImage < images.length - 1) {
        setActiveImage((current) => current + 1);
      } else {
        setPhase("waiting");
      }
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [activeImage, images, phase]);

  useEffect(() => {
    if (phase !== "waiting" || !isPageReady) return;
    const timer = window.setTimeout(() => setPhase("exiting"), 0);
    return () => window.clearTimeout(timer);
  }, [isPageReady, phase]);

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
      className={`fixed inset-0 z-[100] overflow-hidden bg-[var(--bg-base)] ${phase === "exiting" ? "landing-intro-diamond-exit" : ""}`}
    >
      {showImages
        ? images.map((image, index) =>
            index <= activeImage ? (
              <div
                className="absolute inset-0"
                key={image.id}
                style={{ zIndex: index + 1 }}
              >
                {index === activeImage ? (
                  <RevealingIntroImage mobileUrl={image.mobileUrl} priority={index === 0} url={image.url} />
                ) : (
                  <IntroImage mobileUrl={image.mobileUrl} url={image.url} />
                )}
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
