import { supabase, LilStatsRow } from '@/lib/supabase';
import type { Stats, Delta } from '@/lib/types';
import StatCard from '@/components/StatCard';
import SupplyBar from '@/components/SupplyBar';

const TOTAL_SUPPLY = 1_350_000_000;

function pct(value: number): string {
  return (value / TOTAL_SUPPLY * 100).toFixed(2);
}

function rowToStats(row: LilStatsRow): Stats {
  const { staked, locked, burned, dead, lp, circulating } = row;
  const totalRemoved = staked + locked + burned + dead + lp;
  return {
    staked,  stakedPct:  pct(staked),
    locked,  lockedPct:  pct(locked),
    burned,  burnedPct:  pct(burned),
    dead,    deadPct:    pct(dead),
    lp,      lpPct:      pct(lp),
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
  const { data: rows } = await supabase
    .from('lil_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2);

  const latest:   LilStatsRow | null = rows?.[0] ?? null;
  const previous: LilStatsRow | null = rows?.[1] ?? null;

  const stats: Stats | null = latest ? rowToStats(latest) : null;
  const delta: Delta = latest
    ? calcDelta(latest, previous)
    : { staked: null, locked: null, burned: null, dead: null, lp: null, circulating: null };

  const updatedAt = latest
    ? new Date(latest.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">🏰 $LIL Stats Hub</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Total Supply: <span className="text-white font-medium">1,350,000,000 $LIL</span>
            {updatedAt && <>{' · '}<span className="text-zinc-500">Last snapshot: {updatedAt}</span></>}
          </p>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <StatCard icon="🔒" label="Staked"      value={stats.staked}      pct={stats.stakedPct}      delta={delta.staked}      />
              <StatCard icon="🔐" label="Locked"      value={stats.locked}      pct={stats.lockedPct}      delta={delta.locked}      />
              <StatCard icon="🔥" label="Burned"      value={stats.burned}      pct={stats.burnedPct}      delta={delta.burned}      />
              <StatCard icon="💀" label="Dead Wallet" value={stats.dead}        pct={stats.deadPct}        delta={delta.dead}        />
              <StatCard icon="🏊" label="LP Pair"     value={stats.lp}          pct={stats.lpPct}          delta={delta.lp}          />
              <StatCard icon="💰" label="Circulating" value={stats.circulating} pct={stats.circulatingPct} delta={delta.circulating} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-zinc-400 text-sm font-medium">📊 Total Removed from Circulation</span>
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
              staked={stats.staked}  locked={stats.locked}
              burned={stats.burned}  dead={stats.dead}
              lp={stats.lp}          circulating={stats.circulating}
            />
          </>
        ) : (
          <div className="text-zinc-500 text-center py-20 space-y-2">
            <p className="text-lg">No snapshots yet.</p>
            <p className="text-sm">
              Trigger: <code className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">POST /api/snapshot</code>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
