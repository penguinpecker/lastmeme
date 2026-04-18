import type { Token, TokenStatus } from "./types";

/**
 * Four.Meme REST API client.
 *
 * Uses the official (undocumented-but-public) meme-api/v1/public/token/ranking endpoint
 * that four.meme.com's own frontend uses. No auth required. POST body with `type` field.
 *
 * Known working ranking types (2026-04):
 *   - PROGRESS         sorted by bonding-curve progress descending (closest to graduation)
 *   - VOL_DAY_1        sorted by 24h volume descending
 *   - (MARKET_CAP and TIME_CREATE return code=-1000 "unknown error" currently)
 */

const FOURMEME_API = "https://four.meme/meme-api/v1/public";
const STATIC_BASE = "https://static.four.meme";

interface FourMemeRawToken {
  tokenId: number;
  name: string;
  shortName: string;
  userAddress: string;
  symbol: string;
  tokenAddress: string;
  progress: string;
  price: string;
  cap: string;
  hold: number;
  img: string;
  tag: string;
  increase: string;
  day1Increase: string;
  hourIncrease: string;
  volume: string;
  day1Vol: string;
  hourVol: string;
  createDate: string;
  networkCode: number;
  version: number;
  status: string;
}

interface FourMemeRankingResponse {
  code: number;
  msg: string;
  data: FourMemeRawToken[];
}

const BNB_USD_FALLBACK = 600;

async function fetchBnbPriceUsd(): Promise<number> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    if (!r.ok) return BNB_USD_FALLBACK;
    const j = (await r.json()) as { binancecoin?: { usd?: number } };
    return j.binancecoin?.usd ?? BNB_USD_FALLBACK;
  } catch {
    return BNB_USD_FALLBACK;
  }
}

async function fetchRanking(
  type: "PROGRESS" | "VOL_DAY_1",
  pageSize: number,
): Promise<FourMemeRawToken[]> {
  const res = await fetch(`${FOURMEME_API}/token/ranking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, pageSize, pageIndex: 1 }),
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as FourMemeRankingResponse;
  if (json.code !== 0 || !Array.isArray(json.data)) return [];
  return json.data;
}

function buildSpark(base: number, volatility: number, seedStr: string): number[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1;
  };
  const pts: number[] = [];
  let val = 50;
  for (let i = 0; i < 24; i++) {
    val += rand() * volatility + (base - val) * 0.15;
    pts.push(Math.max(5, Math.min(95, val)));
  }
  return pts;
}

function normalizeToken(raw: FourMemeRawToken, bnbUsd: number): Token {
  const capBnb = parseFloat(raw.cap) || 0;
  const day1VolBnb = parseFloat(raw.day1Vol) || 0;
  const progress = parseFloat(raw.progress) || 0;
  const day1Increase = parseFloat(raw.day1Increase) || 0;
  const createdMs = parseInt(raw.createDate, 10) || Date.now();
  const ageHours = (Date.now() - createdMs) / 3_600_000;

  const marketCapUsd = capBnb * bnbUsd;
  const liquidityBnb = progress * 24;
  const liquidityUsd = liquidityBnb * bnbUsd;
  const volLiqRatio = liquidityBnb > 0 ? day1VolBnb / liquidityBnb : 0;
  const priceUsd = (parseFloat(raw.price) || 0) * bnbUsd;

  const sparkBase = day1Increase > 0 ? 55 + Math.min(30, day1Increase * 5) : 40;
  const sparkVol = Math.min(15, 3 + Math.abs(day1Increase));

  const slug = raw.shortName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);

  return {
    id: raw.tokenAddress,
    symbol: `$${raw.shortName.toUpperCase().trim()}`,
    name: raw.name,
    address: raw.tokenAddress,
    slug: slug || raw.tokenAddress.slice(2, 8),
    createdAt: new Date(createdMs).toISOString(),
    createdAtIso: new Date(createdMs).toISOString(),
    ageHours,
    holders: raw.hold,
    top10Pct: 0,
    volLiqRatio,
    liquidityBnb,
    liquidityUsd,
    volume24hBnb: day1VolBnb,
    volume24hUsd: day1VolBnb * bnbUsd,
    bondingPct: progress * 100,
    priceUsd,
    priceChange24h: day1Increase * 100,
    marketCapUsd,
    buyersH1: undefined,
    sellersH1: undefined,
    status: "QUEUED" as TokenStatus,
    spark: buildSpark(sparkBase, sparkVol, raw.tokenAddress),
    clusterId: "",
    graduatedAt: progress >= 1 ? createdMs : null,
    fourMemeUrl: `https://four.meme/token/${raw.tokenAddress}`,
    creatorAddress: raw.userAddress,
    imgUrl: raw.img ? `${STATIC_BASE}${raw.img}` : undefined,
  };
}

export interface FourMemeFetchResult {
  tokens: Token[];
  bnbUsd: number;
  fetchedAt: number;
  error?: string;
}

export async function fetchFourMemeTokens(limit = 80): Promise<FourMemeFetchResult> {
  try {
    const bnbUsd = await fetchBnbPriceUsd();
    const perList = Math.max(40, Math.ceil(limit * 0.75));
    const [progress, volume] = await Promise.all([
      fetchRanking("PROGRESS", perList),
      fetchRanking("VOL_DAY_1", perList),
    ]);

    const seen = new Set<string>();
    const merged: FourMemeRawToken[] = [];
    for (const t of [...progress, ...volume]) {
      const addr = t.tokenAddress.toLowerCase();
      if (seen.has(addr)) continue;
      if (t.status !== "PUBLISH") continue;
      if (t.networkCode !== 0) continue;
      seen.add(addr);
      merged.push(t);
      if (merged.length >= limit) break;
    }

    return {
      tokens: merged.map((t) => normalizeToken(t, bnbUsd)),
      bnbUsd,
      fetchedAt: Date.now(),
    };
  } catch (e) {
    return {
      tokens: [],
      bnbUsd: BNB_USD_FALLBACK,
      fetchedAt: Date.now(),
      error: e instanceof Error ? e.message : "Four.Meme API unreachable",
    };
  }
}
