export interface Stats {
  staked: number;
  locked: number;
  burned: number;
  dead: number;
  lp: number;
  totalRemoved: number;
  circulating: number;
  stakedPct: string;
  lockedPct: string;
  burnedPct: string;
  deadPct: string;
  lpPct: string;
  totalRemovedPct: string;
  circulatingPct: string;
}

export interface Delta {
  staked: number | null;
  locked: number | null;
  burned: number | null;
  dead: number | null;
  lp: number | null;
  circulating: number | null;
}
