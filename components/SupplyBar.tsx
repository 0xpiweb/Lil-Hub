const TOTAL = 1_350_000_000;

interface Segment {
  label: string;
  value: number;
  color: string;
}

export default function SupplyBar({
  staked, locked, dead, lp, circulating,
}: {
  staked: number; 
  locked: number; 
  dead: number; 
  lp: number; 
  circulating: number;
}) {
  const segments: Segment[] = [
    { label: 'Staked',     value: staked,      color: 'bg-blue-500'   },
    { label: 'Locked',     value: locked,      color: 'bg-violet-500' },
    { label: 'Total Burned', value: dead,        color: 'bg-red-600'    },
    { label: 'LP',         value: lp,          color: 'bg-yellow-500' },
    { label: 'Circulating', value: circulating, color: 'bg-emerald-600' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 col-span-full">
      <p className="text-zinc-400 text-sm font-medium mb-3">Supply Breakdown</p>

      {/* Stacked bar */}
      <div className="flex w-full h-4 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${(s.value / TOTAL * 100).toFixed(4)}%` }}
            title={`${s.label}: ${s.value.toLocaleString('en-US')}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${s.color}`} />
            {s.label} — {(s.value / TOTAL * 100).toFixed(2)}%
          </div>
        ))}
      </div>
    </div>
  );
}
