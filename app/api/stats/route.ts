import { NextResponse } from 'next/server';
import { fetchMoatEvents } from '@/lib/fetchMoatEvents';
import { fetchChainBalances } from '@/lib/fetchChainBalances';
import type { Stats } from '@/lib/types';

export const revalidate = 60;

const TOTAL_SUPPLY = 1_350_000_000;

function pct(value: number): string {
  return (value / TOTAL_SUPPLY * 100).toFixed(2);
}

export async function GET() {
  try {
    const [moat, chain] = await Promise.all([
      fetchMoatEvents(),
      fetchChainBalances(),
    ]);

    const { staked, locked, burned } = moat;
    const { dead, lp } = chain;

    const totalRemoved = staked + locked + burned + dead + lp;
    const circulating  = TOTAL_SUPPLY - totalRemoved;

    const stats: Stats = {
      staked,  stakedPct:  pct(staked),
      locked,  lockedPct:  pct(locked),
      burned,  burnedPct:  pct(burned),
      dead,    deadPct:    pct(dead),
      lp,      lpPct:      pct(lp),
      totalRemoved, totalRemovedPct: pct(totalRemoved),
      circulating,  circulatingPct:  pct(circulating),
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('/api/stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
