const domains = [
  "Auth",
  "Member",
  "Blog",
  "Course",
  "Page",
  "Event",
  "Notification",
  "Prayer Journal",
];

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-20">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            HTNC Platform
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            Hoc tap, noi ket, va phuc vu trong mot nen tang chung.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-700">
            Modular monolith cho giai doan dau, chia theo domain ro rang de team
            co the phat trien nhanh ma van giu codebase gon gang.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {domains.map((domain) => (
            <div
              key={domain}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800"
            >
              {domain}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
