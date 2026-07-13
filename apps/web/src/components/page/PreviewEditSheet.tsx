"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";

type PreviewEditSheetProps = {
  editHref: string;
  previewHref: string;
};

export function PreviewEditSheet({ editHref, previewHref }: PreviewEditSheetProps) {
  return (
    <Card className="rounded-2xl p-4">
      <div className="flex flex-wrap gap-3">
        <Link href={previewHref}>
          <Button variant="secondary">Preview</Button>
        </Link>
        <Link href={editHref}>
          <Button>Edit</Button>
        </Link>
      </div>
    </Card>
  );
}
