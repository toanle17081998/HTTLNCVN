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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-4 px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-semibold leading-tight text-zinc-950">
        {title}
      </h1>
      <p className="max-w-2xl text-lg leading-8 text-zinc-700">
        {description}
      </p>
    </main>
  );
}
