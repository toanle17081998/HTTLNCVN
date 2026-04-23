"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

type ErrorDisplayProps = {
  statusCode?: number | string;
  title?: string;
  message?: string;
  reset?: () => void;
};

export function ErrorDisplay({
  statusCode = 500,
  title,
  message,
  reset,
}: ErrorDisplayProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const defaultTitle = statusCode === 404 
    ? t("error.404.title", { defaultValue: "Page Not Found" })
    : statusCode === 403
    ? t("error.403.title", { defaultValue: "Access Denied" })
    : t("error.500.title", { defaultValue: "Something went wrong" });

  const defaultMessage = statusCode === 404
    ? t("error.404.message", { defaultValue: "The page you are looking for doesn't exist or has been moved." })
    : statusCode === 403
    ? t("error.403.message", { defaultValue: "You don't have permission to access this resource." })
    : t("error.500.message", { defaultValue: "An unexpected error occurred. Our team has been notified." });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <AlertCircle className="h-12 w-12" />
      </div>

      <h1 className="mb-2 text-6xl font-black tracking-tighter text-[var(--text-primary)]">
        {statusCode}
      </h1>
      
      <h2 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">
        {title ?? defaultTitle}
      </h2>
      
      <p className="mb-10 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        {message ?? defaultMessage}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="secondary"
          className="h-12 gap-2 rounded-2xl px-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("action.goBack", { defaultValue: "Go Back" })}
        </Button>

        {reset ? (
          <Button
            onClick={() => reset()}
            variant="primary"
            className="h-12 gap-2 rounded-2xl px-6"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("action.tryAgain", { defaultValue: "Try Again" })}
          </Button>
        ) : (
          <Button
            onClick={() => router.push("/")}
            variant="primary"
            className="h-12 gap-2 rounded-2xl px-6"
          >
            <Home className="h-4 w-4" />
            {t("action.goHome", { defaultValue: "Go Home" })}
          </Button>
        )}
      </div>
    </div>
  );
}
