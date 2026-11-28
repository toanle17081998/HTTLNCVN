"use client";

import Image, { type ImageProps } from "next/image";
import { Component, type ErrorInfo, type ReactNode, useState } from "react";
import { cn } from "./cn";

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("SafeImage fell back to native <img>:", error.message, info.componentStack);
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

  const useNativeImg = nativeImgForSrc === srcKey;
  const failed = failedSrc === srcKey;

  if ((isStringSrc && !srcString) || failed) {
    return <>{fallback}</>;
  }

  if (useNativeImg && isStringSrc) {
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
