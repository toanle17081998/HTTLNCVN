"use client";

import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import {
  getToolbarItemKey,
  toolbarActionButtonClass,
  toolbarButtonActiveClass,
  toolbarButtonClass,
  toolbarGroups,
  type ToolbarItemKey,
} from "./articleEditorTypes";
import { ToolbarIcon } from "./ArticleEditorIcons";

type ArticleEditorToolbarProps = {
  activeToolbarKeys: ToolbarItemKey[];
  onRunCommand: (command: string, value?: string) => void;
  onAddLink: () => void;
  onAddImage: () => void;
  onAddVideo: () => void;
  onAddColumns: () => void;
  onAddTable: () => void;
};

export function ArticleEditorToolbar({
  activeToolbarKeys,
  onRunCommand,
  onAddLink,
  onAddImage,
  onAddVideo,
  onAddColumns,
  onAddTable,
}: ArticleEditorToolbarProps) {
  const { t } = useTranslation();
  const getToolbarLabel = (command: string, value: string | undefined, fallback: string) =>
    t(`editor.toolbar.${command}.${value ?? "default"}` as any, { defaultValue: fallback });

  return (
    <div className="flex w-full min-w-0 max-w-full shrink-0 items-center gap-2 overflow-x-auto overflow-y-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 py-3">
      {/* Format groups */}
      {toolbarGroups.map((group, index) => (
        <div
          key={index}
          className="inline-flex shrink-0 items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-sm"
        >
          {group.map((item) => {
            const isActive = activeToolbarKeys.includes(getToolbarItemKey(item));
            return (
              <button
                aria-label={getToolbarLabel(item.command, item.value, item.label)}
                aria-pressed={isActive}
                className={cn(
                  toolbarButtonClass,
                  isActive && toolbarButtonActiveClass,
                  item.className,
                )}
                key={`${item.command}-${item.label}`}
                onClick={() => onRunCommand(item.command, item.value)}
                onMouseDown={(e) => e.preventDefault()}
                title={getToolbarLabel(item.command, item.value, item.label)}
                type="button"
              >
                <ToolbarIcon name={item.icon} />
              </button>
            );
          })}
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex shrink-0 gap-2 lg:ml-auto">
        {(
          [
            { key: "action:link", label: t("editor.action.link"), icon: "link", onClick: onAddLink },
            { key: "action:image", label: t("editor.action.image"), icon: "image", onClick: onAddImage },
            { key: "action:video", label: t("editor.action.video"), icon: "video", onClick: onAddVideo },
            { key: "action:columns", label: t("editor.action.columns"), icon: "columns", onClick: onAddColumns },
            { key: "action:table", label: t("editor.action.table"), icon: "table", onClick: onAddTable },
          ] as const
        ).map(({ key, label, icon, onClick }) => (
          <button
            key={key}
            aria-pressed={activeToolbarKeys.includes(key as ToolbarItemKey)}
            className={cn(
              toolbarActionButtonClass,
              activeToolbarKeys.includes(key as ToolbarItemKey) && toolbarButtonActiveClass,
            )}
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
            type="button"
          >
            <ToolbarIcon name={icon} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
