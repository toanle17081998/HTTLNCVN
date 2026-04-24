"use client";

import type { FormEvent } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { TableFormState } from "./articleEditorTypes";

type TableInsertModalProps = {
  tableForm: TableFormState;
  onTableFormChange: (form: TableFormState) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function TableInsertModal({
  tableForm,
  onTableFormChange,
  onSubmit,
  onClose,
}: TableInsertModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      style={{ backgroundColor: "var(--bg-scrim)" }}
    >
      <form
        className="grid max-h-[calc(100vh-3rem)] w-full max-w-md gap-4 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("editor.table.title")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("editor.table.description")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="table-rows" label={t("editor.table.rows")}>
            <Input
              id="table-rows"
              max={12}
              min={1}
              onChange={(e) => onTableFormChange({ ...tableForm, rows: e.target.value })}
              required
              type="number"
              value={tableForm.rows}
            />
          </FormField>
          <FormField htmlFor="table-columns" label={t("editor.table.columns")}>
            <Input
              id="table-columns"
              max={8}
              min={1}
              onChange={(e) => onTableFormChange({ ...tableForm, columns: e.target.value })}
              required
              type="number"
              value={tableForm.columns}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button type="submit">{t("editor.table.insert")}</Button>
        </div>
      </form>
    </div>
  );
}
