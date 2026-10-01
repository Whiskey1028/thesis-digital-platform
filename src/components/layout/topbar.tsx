export function Topbar({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-4 sm:mb-6">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400 sm:text-sm">
        Operations Console
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:mt-3 sm:leading-7">
        {description}
      </p>
    </header>
  );
}
