interface StatCardProps {
  icon: string;
  iconSrc?: string;   // optional image path — overrides emoji icon when set
  label: string;
  value: number;
  pct: string;
  delta?: number | null;
  wide?: boolean;
  provenance?: string;
  provenanceSrc?: string; // optional image for provenance badge
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function DeltaChip({ delta }: { delta: number }) {
  const positive = delta >= 0;
  const arrow    = positive ? '▲' : '▼';
  const color    = positive ? 'text-emerald-400' : 'text-red-400';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {positive ? '+' : ''}{fmt(delta)}
    </span>
  );
}

export default function StatCard({ icon, iconSrc, label, value, pct, delta, wide, provenance, provenanceSrc }: StatCardProps) {
  return (
    <div className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm font-medium flex items-center gap-1.5">
          {iconSrc
            ? <div className="h-6 w-6 min-w-[24px] rounded-full bg-white overflow-hidden flex-shrink-0 flex items-center justify-center"><img src={iconSrc} className="h-full w-full object-cover" alt="token" /></div>
            : <span>{icon}</span>
          }
          {label}
        </span>
        <span className="bg-emerald-950 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
          {pct}%
        </span>
      </div>

      <p className="text-white text-2xl font-bold tracking-tight">
        {fmt(value)}
        <span className="text-zinc-500 text-base font-normal ml-1">$LIL</span>
      </p>

      <div className="h-4">
        {delta != null ? (
          <div className="flex items-center gap-1 text-zinc-400 text-xs">
            <span>24h:</span>
            <DeltaChip delta={delta} />
          </div>
        ) : (
          <span className="text-zinc-600 text-xs">Awaiting first snapshot</span>
        )}
      </div>

      {provenance && (
        <span
          className="absolute bottom-3 right-3 text-[14px] opacity-100 select-none"
          title="Sourced from Fortifi Moat"
        >
          {provenance}
        </span>
      )}
      {provenanceSrc && (
        <img
          src={provenanceSrc}
          alt="source"
          className="absolute bottom-3 right-3 h-4 w-4 opacity-100 select-none"
          title="Pharaoh Exchange"
        />
      )}
    </div>
  );
}
