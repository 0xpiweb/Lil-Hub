import axios from 'axios';

const RPC_URL   = process.env.AVAX_RPC_URL!;
const LIL_TOKEN = process.env.LIL_TOKEN_ADDRESS!;
const DEAD_ADDR = process.env.DEAD_ADDRESS!;
const LP_ADDR   = process.env.LP_ADDRESS!;

// ABI-encode balanceOf(address): selector + address padded to 32 bytes
function encodeBalanceOf(address: string): string {
  const selector = '70a08231';
  const padded   = address.toLowerCase().replace('0x', '').padStart(64, '0');
  return `0x${selector}${padded}`;
}

async function balanceOf(address: string): Promise<number> {
  const { data } = await axios.post(
    RPC_URL,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        { to: LIL_TOKEN, data: encodeBalanceOf(address) },
        'latest',
      ],
    },
    { timeout: 10000 }
  );

  if (!data?.result || data.result === '0x') return 0;
  const wei = BigInt(data.result);
  return Number(wei / 10n ** 16n) / 100;
}

export async function fetchChainBalances() {
  const [dead, lp] = await Promise.all([
    balanceOf(DEAD_ADDR),
    balanceOf(LP_ADDR),
  ]);
  return { dead, lp };
}
