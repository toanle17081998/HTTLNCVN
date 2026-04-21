import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
}: RoutePlaceholderProps) {
  return (
    <PageLayout
      actions={
        <>
          <Button variant="secondary">View draft</Button>
          <Button>Create</Button>
        </>
      }
      description={description}
      eyebrow={eyebrow}
      title={title}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Workspace
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Noi dung chinh cua module se duoc dat tai day, dung chung header,
            breadcrumb, sidebar va cac control co san.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Planning", "Content", "Review"].map((item) => (
              <div
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                key={item}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {item}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Ready
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Quick actions
          </h2>
          <div className="mt-4 grid gap-2">
            <Button className="w-full" variant="secondary">
              Import data
            </Button>
            <Button className="w-full" variant="ghost">
              Manage settings
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
