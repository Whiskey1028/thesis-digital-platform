export function Topbar({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Operations Console</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
      </div>
      <div className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl">
        Client-first workflow enabled
      </div>
    </header>
  );
}
