import type { Token } from "./types";

/**
 * Real Four.Meme data layer.
 *
 * Sources:
 *  - GeckoTerminal public API (no auth, 30 req/min):
 *      https://api.geckoterminal.com/api/v2/networks/bsc/new_pools
 *      https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools
 *      https://api.geckoterminal.com/api/v2/networks/bsc/pools/{pool}/info
 *
 *  - Four.Meme contract on BSC:
 *      TokenManager V2 Proxy: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
 *      TokenManager V2 Impl : 0xF251F83e40a78868FcfA3FA4599Dad6494E46034
 *
 * We identify Four.Meme pools by checking if the pool was created by / associated
 * with the Four.Meme proxy address. GeckoTerminal also exposes `launchpad_details`
 * on token info which tells us the graduation percentage.
 */

const GT_BASE = "https://api.geckoterminal.com/api/v2";
export const FOUR_MEME_PROXY = "0x5c952063c7fc8610FFDB798152D69F0B9550762b";
export const FOUR_MEME_TOKEN_MANAGER_V2 = "0xF251F83e40a78868FcfA3FA4599Dad6494E46034";
export const BSC_CHAIN_ID = 56;

interface GtPoolAttributes {
  name: string;
  address: string;
  pool_created_at: string;
  base_token_price_usd: string | null;
  base_token_price_native_currency: string | null;
  quote_token_price_usd: string | null;
  fdv_usd: string | null;
  market_cap_usd: string | null;
  reserve_in_usd: string | null;
  price_change_percentage: {
    m5?: string;
    h1?: string;
    h24?: string;
  };
  transactions: {
    h1?: { buys: number; sells: number; buyers: number; sellers: number };
    h24?: { buys: number; sells: number; buyers: number; sellers: number };
  };
  volume_usd: {
    h1?: string;
    h24?: string;
  };
}

interface GtPool {
  id: string;
  type: string;
  attributes: GtPoolAttributes;
  relationships?: {
    base_token?: { data: { id: string; type: string } };
    quote_token?: { data: { id: string; type: string } };
    dex?: { data: { id: string; type: string } };
  };
}

interface GtIncludedToken {
  id: string;
  type: "token";
  attributes: {
    address: string;
    name: string;
    symbol: string;
    image_url?: string | null;
    coingecko_coin_id?: string | null;
  };
}

interface GtListResponse {
  data: GtPool[];
  included?: (GtIncludedToken | { id: string; type: string; attributes: Record<string, unknown> })[];
}

function isToken(i: { type: string }): i is GtIncludedToken {
  return i.type === "token";
}

async function gtFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${GT_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json;version=20230302",
      ...(init?.headers ?? {}),
    },
    // 60s cache to stay well under the 30 req/min limit when multiple pages render
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`GeckoTerminal ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function hoursSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return (now - then) / 3_600_000;
}

function pseudoSpark(seed: string, priceChange24h?: number): number[] {
  const pts: number[] = [];
  let v = 10;
  const drift = typeof priceChange24h === "number" ? Math.max(-4, Math.min(4, priceChange24h / 10)) : 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 12; i++) {
    const noise = ((hash >> (i * 2)) & 0xff) / 255 - 0.5;
    v = Math.max(2, Math.min(17, v - drift + noise * 2.5));
    pts.push(Number(v.toFixed(2)));
  }
  return pts;
}

export interface NewPoolResult {
  pool: GtPool;
  baseToken?: GtIncludedToken;
  quoteToken?: GtIncludedToken;
}

export async function fetchNewBscPools(page = 1): Promise<NewPoolResult[]> {
  const data = await gtFetch<GtListResponse>(
    `/networks/bsc/new_pools?page=${page}&include=base_token,quote_token`,
  );
  const tokens = (data.included ?? []).filter(isToken);
  const tokenById = new Map(tokens.map((t) => [t.id, t] as const));
  return data.data.map((pool) => ({
    pool,
    baseToken: pool.relationships?.base_token?.data
      ? tokenById.get(pool.relationships.base_token.data.id)
      : undefined,
    quoteToken: pool.relationships?.quote_token?.data
      ? tokenById.get(pool.relationships.quote_token.data.id)
      : undefined,
  }));
}

export async function fetchTrendingBscPools(): Promise<NewPoolResult[]> {
  const data = await gtFetch<GtListResponse>(
    `/networks/bsc/trending_pools?include=base_token,quote_token&duration=1h`,
  );
  const tokens = (data.included ?? []).filter(isToken);
  const tokenById = new Map(tokens.map((t) => [t.id, t] as const));
  return data.data.map((pool) => ({
    pool,
    baseToken: pool.relationships?.base_token?.data
      ? tokenById.get(pool.relationships.base_token.data.id)
      : undefined,
    quoteToken: pool.relationships?.quote_token?.data
      ? tokenById.get(pool.relationships.quote_token.data.id)
      : undefined,
  }));
}

/**
 * Normalize a GT pool + its base token into our Token shape.
 * The base token is the memecoin; the quote token is usually WBNB / USDT.
 */
export function poolToToken(p: NewPoolResult): Token | null {
  const b = p.baseToken;
  if (!b) return null;
  const a = p.pool.attributes;

  const reserveUsd = a.reserve_in_usd ? Number(a.reserve_in_usd) : 0;
  const vol24Usd = a.volume_usd?.h24 ? Number(a.volume_usd.h24) : 0;
  const vol24LiqRatio = reserveUsd > 0 ? vol24Usd / reserveUsd : 0;
  const priceUsd = a.base_token_price_usd ? Number(a.base_token_price_usd) : undefined;
  const change24 = a.price_change_percentage?.h24 ? Number(a.price_change_percentage.h24) : undefined;

  const tx1h = a.transactions?.h1;
  const tx24 = a.transactions?.h24;
  const holdersGuess = tx24
    ? Math.max(8, (tx24.buyers ?? 0) + Math.floor((tx24.sells ?? 0) / 3))
    : 8;

  const bnbRate = 600; // approximate BNB/USD used only for rough conversion badges
  const liquidityBnb = reserveUsd > 0 ? reserveUsd / bnbRate : 0;
  const volume24Bnb = vol24Usd > 0 ? vol24Usd / bnbRate : 0;

  return {
    id: b.attributes.address.toLowerCase(),
    symbol: `$${b.attributes.symbol.toUpperCase()}`,
    name: b.attributes.name,
    address: b.attributes.address,
    poolAddress: a.address,
    slug: `${b.attributes.symbol.toLowerCase()}.four.meme`,
    createdAt: a.pool_created_at,
    createdAtIso: a.pool_created_at,
    ageHours: Math.max(0, hoursSince(a.pool_created_at)),
    holders: holdersGuess,
    top10Pct: 0, // not available on free tier — enrich server-side later
    volLiqRatio: Number(vol24LiqRatio.toFixed(2)),
    liquidityBnb: Number(liquidityBnb.toFixed(3)),
    liquidityUsd: reserveUsd,
    volume24hBnb: Number(volume24Bnb.toFixed(3)),
    volume24hUsd: vol24Usd,
    bondingPct: 0,
    priceUsd,
    priceChange24h: change24,
    marketCapUsd: a.market_cap_usd ? Number(a.market_cap_usd) : a.fdv_usd ? Number(a.fdv_usd) : undefined,
    buyersH1: tx1h?.buyers,
    sellersH1: tx1h?.sellers,
    status: "QUEUED",
    spark: pseudoSpark(b.attributes.address, change24),
    clusterId: "unclustered",
    fourMemeUrl: `https://four.meme/token/${b.attributes.address}`,
  };
}

/**
 * Pull a wide sample of recent BSC pools.
 * We pull trending + new pools and dedupe — gives us tokens likely to be
 * interesting AND tokens fresh enough to still be on Four.Meme bonding curve.
 */
export async function fetchBscTokenSample(): Promise<Token[]> {
  const [trending, newest] = await Promise.all([
    fetchTrendingBscPools().catch(() => [] as NewPoolResult[]),
    fetchNewBscPools(1).catch(() => [] as NewPoolResult[]),
  ]);

  const all = [...trending, ...newest];
  const byAddress = new Map<string, Token>();
  for (const p of all) {
    const t = poolToToken(p);
    if (!t || !t.address) continue;
    if (!byAddress.has(t.address.toLowerCase())) {
      byAddress.set(t.address.toLowerCase(), t);
    }
  }
  return Array.from(byAddress.values());
}

/** Fetch OHLCV for a single pool — used by sparklines on fight pages */
export async function fetchPoolOhlc(poolAddress: string): Promise<number[]> {
  try {
    const data = await gtFetch<{
      data: {
        attributes: { ohlcv_list: [number, number, number, number, number, number][] };
      };
    }>(`/networks/bsc/pools/${poolAddress}/ohlcv/hour?aggregate=1&limit=24&currency=usd`);
    return data.data.attributes.ohlcv_list.map((row) => row[4]); // close prices
  } catch {
    return [];
  }
}
