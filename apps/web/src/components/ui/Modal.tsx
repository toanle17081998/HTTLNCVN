import type { FormEventHandler, HTMLAttributes } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { cn } from "./cn";

type ModalProps = Pick<HTMLAttributes<HTMLDivElement>, "children" | "className"> & {
  labelledBy: string;
  onClose: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function Modal({ children, className, labelledBy, onClose, onSubmit }: ModalProps) {
  useEscapeKey(onClose);
  const panelProps = {
    "aria-labelledby": labelledBy,
    "aria-modal": true as const,
    className: cn(
      "flex max-h-[calc(100dvh-3rem)] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl",
      className,
    ),
    role: "dialog",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
      {onSubmit ? (
        <form {...panelProps} onSubmit={onSubmit}>{children}</form>
      ) : (
        <div {...panelProps}>{children}</div>
      )}
    </div>
  );
}

export function ModalHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header className={cn("relative z-10 shrink-0 bg-[var(--bg-surface)] p-5 shadow-[0_5px_12px_-6px_rgb(0_0_0_/_0.35)]", className)} {...props} />;
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <footer className={cn("relative z-10 shrink-0 bg-[var(--bg-surface)] p-5 shadow-[0_-5px_12px_-6px_rgb(0_0_0_/_0.35)]", className)} {...props} />;
}
