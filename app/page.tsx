import Image from 'next/image';
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
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="rounded-full overflow-hidden w-10 h-10 flex-shrink-0">
              <Image src="/lil-mascot.png" alt="$LIL mascot" width={40} height={40} className="object-cover w-full h-full" />
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
          <StatCard icon="💀" label="Dead Wallet" value={stats.dead}        pct={stats.deadPct}        delta={delta.dead}        />
          <StatCard icon="⚖️" label="LP Pair"     value={stats.lp}          pct={stats.lpPct}          delta={delta.lp}          />
          <StatCard icon="" iconSrc="/lil-token.png" label="Circulating" value={stats.circulating} pct={stats.circulatingPct} delta={delta.circulating} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-zinc-400 text-sm font-medium">💰 Total Removed from Circulation</span>
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
        
        <p className="text-center text-zinc-600 text-xs mt-8">
          Last live check: {updatedAt}
        </p>
      </div>
    </main>
  );
}
