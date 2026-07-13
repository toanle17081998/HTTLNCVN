import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

type PageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        actions={actions}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      {children}
    </div>
  );
}
