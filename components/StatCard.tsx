import Image from 'next/image';

interface StatCardProps {
  icon: string;
  iconSrc?: string;   // optional image path — overrides emoji icon when set
  label: string;
  value: number;
  pct: string;
  delta?: number | null;
  wide?: boolean;
  provenance?: string;
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

export default function StatCard({ icon, iconSrc, label, value, pct, delta, wide, provenance }: StatCardProps) {
  return (
    <div className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm font-medium flex items-center gap-1.5">
          {iconSrc
            ? <Image src={iconSrc} alt={label} width={20} height={20} className="rounded-full object-cover" />
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
          className="absolute bottom-3 right-3 text-base opacity-20 select-none"
          title="Sourced from Fortifi Moat"
        >
          {provenance}
        </span>
      )}
    </div>
  );
}
