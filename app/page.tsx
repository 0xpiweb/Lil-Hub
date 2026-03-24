import { fetchMoatEvents } from '@/lib/fetchMoatEvents';
import { fetchChainBalances } from '@/lib/fetchChainBalances';
import { supabase, LilStatsRow } from '@/lib/supabase';
import type { Stats, Delta } from '@/lib/types';
import StatCard from '@/components/StatCard';
import SupplyBar from '@/components/SupplyBar';

const TOTAL_SUPPLY = 1_350_000_000;

function pct(value: number): string {
  return (value / TOTAL_SUPPLY * 100).toFixed(2);
}

function rowToStats(row: LilStatsRow): Stats {
  // 1. We don't pull 'burned' from the row here
  const { staked, locked, dead, lp, circulating } = row;
  
  // 2. Calculate totalRemoved without the double-counted burned variable
  const totalRemoved = staked + locked + dead + lp;

  return {
    staked,     stakedPct:      pct(staked),
    locked,     lockedPct:      pct(locked),
    // 3. We use row.burned directly here so the stat card still works, 
    // but it won't break the 'totalRemoved' math.
    burned:     row.burned,     burnedPct:      pct(row.burned),
    dead,       deadPct:        pct(dead),
    lp,         lpPct:          pct(lp),
    totalRemoved, totalRemovedPct: pct(totalRemoved),
    circulating,  circulatingPct:  pct(circulating),
  };
}

function calcDelta(latest: LilStatsRow, previous: LilStatsRow | null): Delta {
  if (!previous) {
    return { staked: null, locked: null, burned: null, dead: null, lp: null, circulating: null };
  }
  return {
    staked:      latest.staked      - previous.staked,
    locked:      latest.locked      - previous.locked,
    burned:      latest.burned      - previous.burned,
    dead:        latest.dead        - previous.dead,
    lp:          latest.lp          - previous.lp,
    circulating: latest.circulating - previous.circulating,
  };
}

export const revalidate = 60;

export default async function Dashboard() {
  // 1. Fetch EVERYTHING in parallel
  const [moat, chain, supabaseRes] = await Promise.all([
    fetchMoatEvents(),
    fetchChainBalances(),
    supabase.from('lil_stats').select('*').order('created_at', { ascending: false }).limit(1)
  ]);

  const rows = supabaseRes.data;

  // 2. Build the latest data object with safety defaults
  const latest: any = {
    staked: moat?.staked || 0,
    locked: moat?.locked || 0,
    burned: moat?.burned || 0,
    dead: chain?.dead || 0,
    lp: chain?.lp || 0,
    created_at: new Date().toISOString()
  };

  // 3. Calculate circulating & totalRemoved manually for the UI
  const circVal = TOTAL_SUPPLY - (latest.staked + latest.locked + latest.dead + latest.lp);
  latest.circulating = circVal;

  // 4. Process for UI
  const stats = rowToStats(latest);
  const previous = rows && rows[0] ? rows[0] : latest;
  const delta = calcDelta(latest, previous);

  const updatedAt = new Date().toLocaleString('en-US', { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 min-w-[40px] rounded-full bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img src="/mascot.png" className="h-full w-full object-cover" alt="mascot" />
            </div>
            $LIL Stats Hub
          </h1>
          <p className="text-zinc-400 mt-1 text-sm flex items-center gap-2 flex-wrap">
            <span>Total Supply: <span className="text-white font-medium">1,350,000,000 $LIL</span></span>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Live Network</span>
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard icon="🏛️" label="Staked"      value={stats.staked}      pct={stats.stakedPct}      delta={delta.staked}      provenance="🏰" />
          <StatCard icon="🔐" label="Locked"      value={stats.locked}      pct={stats.lockedPct}      delta={delta.locked}      provenance="🏰" />
          <StatCard icon="🔥" label="Burned"      value={stats.burned}      pct={stats.burnedPct}      delta={delta.burned}      provenance="🏰" />
          <StatCard icon="🔥" label="Total Burned" value={stats.dead}        pct={stats.deadPct}        delta={delta.dead}        provenance="💀" />
          <StatCard icon="⚖️" label="LP Pair"     value={stats.lp}          pct={stats.lpPct}          delta={delta.lp}          provenanceSrc="/pharaoh.svg" />
          <StatCard icon="" iconSrc="/token.png" label="Circulating" value={stats.circulating} pct={stats.circulatingPct} delta={delta.circulating} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-zinc-400 text-sm font-medium">💰 $LIL Not in Circulation</span>
          <div className="flex items-center gap-3">
            <span className="text-white text-xl font-bold">
              {Math.round(stats.totalRemoved).toLocaleString('en-US')} $LIL
            </span>
            <span className="bg-emerald-950 text-emerald-400 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {stats.totalRemovedPct}%
            </span>
          </div>
        </div>

        <SupplyBar 
          staked={stats.staked}
          locked={stats.locked}
          dead={stats.dead}
          lp={stats.lp}
          circulating={stats.circulating}
        />
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mt-4">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-3">System Legend</p>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">🏛️</span>
                <p className="text-xs text-zinc-500"><span className="text-zinc-300 font-medium">Staked</span> — Amount of $LIL staked in The Moat. <a href="https://moats.app/moat/0x7a4d20261a765bd9ba67d49fbf8189843eec3393" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Moat</a></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">🔐</span>
                <p className="text-xs text-zinc-500"><span className="text-zinc-300 font-medium">Locked</span> — Amount of $LIL locked in The Moat. <a href="https://moats.app/moat/0x7a4d20261a765bd9ba67d49fbf8189843eec3393" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Moat</a></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">🔥</span>
                <p className="text-xs text-zinc-500"><span className="text-zinc-300 font-medium">Burned</span> — Amount of $LIL burned in The Moat. <a href="https://moats.app/moat/0x7a4d20261a765bd9ba67d49fbf8189843eec3393" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Moat</a></p>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">🔥</span>
                <p className="text-xs text-zinc-500"><span className="text-zinc-300 font-medium">Total Burned</span> — Cumulative total of $LIL burned. <a href="https://snowtrace.io/token/0x22683BbaDD01473969F23709879187705a253763?a=0x000000000000000000000000000000000000dead" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Dead Wallet</a></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">⚖️</span>
                <p className="text-xs text-zinc-500"><span className="text-zinc-300 font-medium">LP Pair</span> — $LIL liquidity provided on Pharaoh Exchange. <a href="https://pharaoh.exchange/liquidity/v2/0x8acc49857a1259d25eb3ca0aa15b398d0e149ef2" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Add Liquidity</a></p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Last live check: {updatedAt}
        </p>
      </div>
    </main>
  );
}
