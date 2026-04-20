import { PageLayout, navItems } from "@/components/layout";
import { Button, Card, FormField, Input, Select, Textarea } from "@/components/ui";

export function HomePage() {
  return (
    <PageLayout
      actions={
        <>
          <Button variant="secondary">Invite member</Button>
          <Button>Create course</Button>
        </>
      }
      description="Modular monolith cho giai doan dau, chia theo domain ro rang de team co the phat trien nhanh ma van giu codebase gon gang."
      eyebrow="HTNC Platform"
      title="Hoc tap, noi ket, va phuc vu trong mot nen tang chung."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Active modules", "8"],
          ["Draft updates", "12"],
          ["Pending reviews", "4"],
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Modules
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {navItems.slice(1).map((item) => (
              <div
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                key={item.href}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Shared form controls
          </h2>
          <form className="mt-4 grid gap-4">
            <FormField htmlFor="title" label="Title">
              <Input id="title" placeholder="Nhap tieu de" />
            </FormField>
            <FormField htmlFor="module" label="Module">
              <Select id="module" defaultValue="course">
                <option value="course">Course</option>
                <option value="blog">Blog</option>
                <option value="event">Event</option>
              </Select>
            </FormField>
            <FormField htmlFor="note" label="Note">
              <Textarea id="note" placeholder="Ghi chu ngan" rows={3} />
            </FormField>
            <Button type="submit">Save draft</Button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
