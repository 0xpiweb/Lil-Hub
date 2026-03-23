import axios from 'axios';

const API_BASE   = process.env.EVENTS_API_BASE!;
const MOAT_ADDR  = process.env.MOAT_ADDRESS!;
const NETWORK    = 'avalanche';

async function sumEventType(eventType: string): Promise<bigint> {
  const { data } = await axios.get(`${API_BASE}/events`, {
    params: { contractAddress: MOAT_ADDR, network: NETWORK, eventType, limit: 1000 },
    timeout: 12000,
  });
  const results: { args?: { amount?: string } }[] = data?.results ?? [];
  return results.reduce((sum, e) => sum + BigInt(e?.args?.amount ?? '0'), 0n);
}

function fromWei(wei: bigint): number {
  // Divide by 10^16 via BigInt then by 100 — preserves 2 decimal places
  return Number(wei / 10n ** 16n) / 100;
}

export async function fetchMoatEvents() {
  const [stakedWei, withdrawnWei, lockedWei, lockExitedWei, burnedWei] =
    await Promise.all([
      sumEventType('Staked'),
      sumEventType('Withdrawn'),
      sumEventType('Locked'),
      sumEventType('LockExited'),
      sumEventType('Burned'),
    ]);

  return {
    staked: fromWei(stakedWei - withdrawnWei),
    locked: fromWei(lockedWei - lockExitedWei),
    burned: fromWei(burnedWei),
  };
}
