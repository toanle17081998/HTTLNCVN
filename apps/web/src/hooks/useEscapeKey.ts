"use client";

import { useEffect, useRef } from "react";

const escapeHandlers: Array<() => void> = [];

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  escapeHandlers[escapeHandlers.length - 1]?.();
}

export function useEscapeKey(onEscape: () => void, enabled = true) {
  const handlerRef = useRef(onEscape);

  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const handler = () => handlerRef.current();
    escapeHandlers.push(handler);
    if (escapeHandlers.length === 1) document.addEventListener("keydown", handleKeyDown);

    return () => {
      const index = escapeHandlers.indexOf(handler);
      if (index !== -1) escapeHandlers.splice(index, 1);
      if (escapeHandlers.length === 0) document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
