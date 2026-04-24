"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Trash2, Save, Info, AlertCircle } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { Toaster, toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastInput = {
  title: string;
  description?: string;
  durationMs?: number;
  variant?: ToastVariant;
};

type ConfirmVariant = "delete" | "update" | "info" | "warning";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type FeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (input: ToastInput) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function ConfirmVariantIcon({ variant }: { variant: ConfirmVariant }) {
  const baseClasses = "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm";
  
  if (variant === "delete") {
    return (
      <span
        className={cn(baseClasses)}
        style={{ backgroundColor: "var(--status-danger-bg)", color: "var(--status-danger)" }}
      >
        <Trash2 className="h-6 w-6" />
      </span>
    );
  }

  if (variant === "update") {
    return (
      <span
        className={cn(baseClasses)}
        style={{ backgroundColor: "var(--status-info-bg)", color: "var(--status-info)" }}
      >
        <Save className="h-6 w-6" />
      </span>
    );
  }

  if (variant === "warning") {
    return (
      <span
        className={cn(baseClasses)}
        style={{ backgroundColor: "var(--status-warning-bg)", color: "var(--status-warning)" }}
      >
        <AlertTriangle className="h-6 w-6" />
      </span>
    );
  }

  return (
    <span
      className={cn(baseClasses)}
      style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand-primary)" }}
    >
      <Info className="h-6 w-6" />
    </span>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const toast = useCallback(
    ({ durationMs = 3000, variant = "info", title, description }: ToastInput) => {
      const options = {
        duration: durationMs,
        description: description,
      };

      switch (variant) {
        case "success":
          sonnerToast.success(title, options);
          break;
        case "error":
          sonnerToast.error(title, options);
          break;
        case "warning":
          sonnerToast.warning(title, options);
          break;
        default:
          sonnerToast.info(title, options);
          break;
      }
    },
    [],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        const variant = options.variant ?? "info";
        
        // Default values based on variant
        let defaultTitle = t("common.confirm");
        let defaultConfirmLabel = t("common.confirm");
        let defaultDescription = "";

        if (variant === "delete") {
          defaultTitle = t("action.delete_confirm_title", { defaultValue: "Are you sure you want to delete?" });
          defaultConfirmLabel = t("action.delete", { defaultValue: "Delete" });
          defaultDescription = t("action.delete_confirm_desc", { defaultValue: "This action cannot be undone." });
        } else if (variant === "update") {
          defaultTitle = t("action.update_confirm_title", { defaultValue: "Confirm Update" });
          defaultConfirmLabel = t("action.update", { defaultValue: "Update" });
          defaultDescription = t("action.update_confirm_desc", { defaultValue: "Are you sure you want to save these changes?" });
        }

        setConfirmState({
          cancelLabel: options.cancelLabel ?? t("common.cancel", { defaultValue: "Cancel" }),
          confirmLabel: options.confirmLabel ?? defaultConfirmLabel,
          title: options.title ?? defaultTitle,
          description: options.description ?? defaultDescription,
          variant,
          ...options,
          resolve,
        });
      });
    },
    [t],
  );

  useEffect(() => {
    if (!confirmState) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        confirmState.resolve(false);
        setConfirmState(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmState]);

  const value = useMemo<FeedbackContextValue>(() => ({ confirm, toast }), [confirm, toast]);

  function closeConfirm(result: boolean) {
    if (!confirmState) {
      return;
    }

    confirmState.resolve(result);
    setConfirmState(null);
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            borderRadius: '1rem',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }
        }}
      />

      {confirmState ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "var(--bg-scrim)" }}
            onClick={() => closeConfirm(false)}
          />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-[var(--shadow-lg)] animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <ConfirmVariantIcon variant={confirmState.variant ?? "info"} />
              
              <div className="mt-5">
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {confirmState.title}
                </h2>
                {confirmState.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {confirmState.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button 
                onClick={() => closeConfirm(false)} 
                variant="secondary"
                className="order-2 w-full rounded-xl sm:order-1 sm:w-32"
              >
                {confirmState.cancelLabel}
              </Button>
              <Button
                onClick={() => closeConfirm(true)}
                variant={confirmState.variant === "delete" ? "danger" : "primary"}
                className="order-1 w-full rounded-xl sm:order-2 sm:w-32"
              >
                {confirmState.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
}
