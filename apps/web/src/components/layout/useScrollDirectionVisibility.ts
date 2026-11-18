"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollDirectionVisibility() {
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function updateVisibility() {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const isNearTop = currentScrollY < 24;

      setIsAtTop(isNearTop);
      if (isNearTop || scrollDelta < -1) {
        setIsVisible(true);
      } else if (scrollDelta > 6) {
        setIsVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    }

    function handleScroll() {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateVisibility);
        tickingRef.current = true;
      }
    }

    const initialFrame = window.requestAnimationFrame(updateVisibility);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { isAtTop, isVisible };
}
