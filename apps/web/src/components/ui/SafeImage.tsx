"use client";

import Image, { type ImageProps } from "next/image";
import { Component, type ReactNode, useState } from "react";
import { cn } from "./cn";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function getAllowedNextImageHosts(): Set<string> {
  const hosts = new Set(["images.unsplash.com", "lh3.googleusercontent.com"]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.protocol === "https:" && !LOCAL_HOSTNAMES.has(parsed.hostname)) {
        hosts.add(parsed.hostname);
      }
    } catch {
      // Ignore malformed NEXT_PUBLIC_API_URL
    }
  }
  return hosts;
}

const ALLOWED_NEXT_IMAGE_HOSTS = getAllowedNextImageHosts();

function canUseNextImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) {
    return true;
  }
  try {
    const parsed = new URL(src);
    return parsed.protocol === "https:" && ALLOWED_NEXT_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

type ImageErrorBoundaryProps = {
  children: ReactNode;
  onCatch: () => void;
  resetKey: string;
};

type ImageErrorBoundaryState = {
  hasError: boolean;
};

class ImageErrorBoundary extends Component<ImageErrorBoundaryProps, ImageErrorBoundaryState> {
  state: ImageErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ImageErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onCatch();
  }

  componentDidUpdate(prevProps: ImageErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export type SafeImageProps = ImageProps & {
  fallback?: ReactNode;
};

export function SafeImage({
  alt,
  className,
  fallback = null,
  fetchPriority,
  fill,
  onError,
  src,
  style,
  ...rest
}: SafeImageProps) {
  const isStringSrc = typeof src === "string";
  const srcString = isStringSrc ? src.trim() : "";
  const srcKey = isStringSrc ? srcString : "static-import";

  const [nativeImgForSrc, setNativeImgForSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const shouldUseNativeImg =
    isStringSrc && (nativeImgForSrc === srcKey || !canUseNextImage(srcString));
  const failed = failedSrc === srcKey;

  if ((isStringSrc && !srcString) || failed) {
    return <>{fallback}</>;
  }

  if (shouldUseNativeImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        aria-hidden={rest["aria-hidden"]}
        className={cn(fill && "absolute inset-0 h-full w-full", className)}
        decoding={rest.decoding}
        draggable={rest.draggable}
        fetchPriority={fetchPriority}
        height={fill ? undefined : rest.height}
        id={rest.id}
        loading={rest.loading}
        onError={(event) => {
          setFailedSrc(srcKey);
          onError?.(event);
        }}
        referrerPolicy={rest.referrerPolicy}
        sizes={rest.sizes}
        src={srcString}
        style={style}
        title={rest.title}
        width={fill ? undefined : rest.width}
      />
    );
  }

  return (
    <ImageErrorBoundary onCatch={() => setNativeImgForSrc(srcKey)} resetKey={srcKey}>
      <Image
        {...rest}
        alt={alt}
        className={className}
        fetchPriority={fetchPriority}
        fill={fill}
        onError={(event) => {
          setFailedSrc(srcKey);
          onError?.(event);
        }}
        src={isStringSrc ? srcString : src}
        style={style}
      />
    </ImageErrorBoundary>
  );
}
