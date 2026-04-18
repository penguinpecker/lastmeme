# LastMeme.fm

> Plagiarism court for memecoins. Live on BSC mainnet.

**One cluster enters. One leaves.**

LastMeme tails Four.Meme's launch firehose, clusters derivative tokens by name/symbol similarity, and lets the best one absorb the losers' creator fees for 7 days. Fighters are pulled from live BSC data. Buys execute on-chain via the Four.Meme TokenManager V2 contract. You self-custody — we never touch your funds.

## What's live

- **Real token feed** — GeckoTerminal public API (no key required) pulls trending + newly-created BSC pools every 60 seconds
- **Real clustering** — local bigram Jaccard + substring similarity groups derivatives into buckets, picks a theme word, orders by liquidity
- **Real pair-created timestamps** — every fighter card, undercard row, and firehose event shows the actual `pool_created_at` from GeckoTerminal
- **Real on-chain buys** — `BuyTokenButton` calls `buyTokenAMAP(address,address,uint256,uint256)` on the Four.Meme proxy `0x5c95…0762b`. Live `tryBuy` quote, slippage, BSC chain detection, tx signing from your wallet, BscScan link
- **Real wallet connection** — wagmi v2 + viem. Injected connector (MetaMask, Rabby, OKX, Binance Wallet, Trust)

## What's mocked

- **Hall of Shame verdicts** — simulated until the resolver contract ships. A banner on `/shame` makes this explicit
- **Bet pool** — the pro-rata BNB bet pool requires its own Solidity contract. The UI previously showing bet stakes was removed; the fight page is now purely a "discovery + buy" interface until that contract deploys

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 15 App Router · React 19 · TypeScript |
| Data | GeckoTerminal API (public, no key) · server-side `fetch` with `revalidate: 60` |
| Clustering | Local bigram Jaccard + substring containment, pure TypeScript |
| Web3 | wagmi v2 · viem v2 · BSC mainnet (chainId 56) · injected connector |
| Contracts | Four.Meme TokenManager V2 @ `0xF251F83e40a78868FcfA3FA4599Dad6494E46034` via proxy `0x5c952063c7fc8610FFDB798152D69F0B9550762b` |
| Styling | Tailwind v3 · custom brutalist design system |
| Fonts | VT323 · Archivo Black · JetBrains Mono |
| Visuals | D3 force-directed cluster graph · CSS keyframe collision FX |

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No env vars needed. The Discovery and Compete pages will fetch live BSC data on first request and cache for 60s.

### Environment variables (all optional)

| Var | Default | What for |
| --- | --- | --- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | not used | Only needed if you add the WalletConnect connector back |

Injected wallets (MetaMask etc.) work out of the box without any env vars.

## Pages

| Route | What's there |
| --- | --- |
| `/` | **Discovery** — live firehose, D3 cluster graph, cluster grid (filterable), unclustered "Lonely" tokens section |
| `/fights/[id]` | **Compete** — dynamic route: `id` can be a fight number (e.g. `0047`) or a cluster id (e.g. `frog`). Shows real pair-creation timestamps for both fighters, collision FX, tale of the tape, real `tryBuy` quote + slippage picker, real swap, undercard table with all cluster members |
| `/queue` | **Queue** — live cluster queue sorted by status rank then ETA |
| `/shame` | **Hall of Shame** — simulated verdicts (banner notes until resolver deploys) |
| `/docs` | **Docs** — 8 sections: pipeline, scoring formula, settlement contract, betting, FAQ, stack, links |

## How the buy works

1. User clicks `BUY_RED_CORNER` or `BUY_BLUE_CORNER`
2. Drawer opens, fetches a live quote from `TokenManager2.tryBuy(token, 0, funds)` via `publicClient.readContract`
3. Quote returns `(tokenManager, quote, estimatedAmount, estimatedCost, estimatedFee, amountMsgValue, amountApproval, amountFunds)`
4. User picks amount (preset chips or custom input) and slippage (1/5/10/20%)
5. `minAmount` = `estimatedAmount * (10000 - slippageBps) / 10000`
6. On confirm, `writeContract` calls `buyTokenAMAP(token, recipient, funds, minAmount)` with `value: funds` from the user's wallet
7. `useWaitForTransactionReceipt` watches for confirmation
8. BscScan link appears once mined

The contract is the same one Four.Meme's own site uses. If the token has already graduated from the bonding curve to PancakeSwap, `tryBuy` reverts and we show "Token may already be on PancakeSwap — use four.meme directly" with a deep link.

## Project structure

```
src/
├── app/
│   ├── layout.tsx                # <Web3Providers> root wrap
│   ├── globals.css               # design system
│   ├── page.tsx                  # Discovery (loadLiveData)
│   ├── fights/[id]/page.tsx      # Compete (loadLiveData + fightBuilder)
│   ├── queue/page.tsx            # Queue (loadLiveData)
│   ├── shame/page.tsx            # Hall of Shame (still mock)
│   └── docs/page.tsx             # Docs
├── components/
│   ├── shared/                   # TopNav, Marquee, Hero, KpiBar, Footer, Spark, Web3Providers
│   ├── discovery/                # FirehoseFeed, ClusterGrid, ClusterCard, ClusterGraph, UnclusteredGrid
│   ├── compete/                  # Ring, FighterCard, HealthBar, Collision, TaleOfTheTape, PriorArt, Undercard, CountdownStrip, BuyTokenButton
│   ├── queue/                    # QueueRow
│   ├── shame/                    # VerdictCard
│   └── docs/                     # DocsSection
└── lib/
    ├── types.ts                  # all TypeScript types
    ├── fourmeme.ts               # GeckoTerminal client, pool → Token normalization
    ├── cluster.ts                # Local clustering engine (bigram Jaccard)
    ├── loadData.ts               # Server entry: loadLiveData() — called by all pages
    ├── fightBuilder.ts           # Turn a cluster + tokens into FightDetail
    ├── contracts.ts              # Four.Meme ABI + proxy address constants
    ├── wagmi.ts                  # BSC-only wagmi config
    ├── utils.ts                  # cn(), formatBnb(), formatCountdown()
    └── mock.ts                   # Only used by shame/docs/TopNav for constants
```

## Deploy

```bash
npm run build
# or
vercel --prod
```

Works out of the box on Vercel. Functions default to Node runtime so `fetch` caching via `revalidate: 60` works correctly.

## Safety / disclaimers

- Buys execute **from the user's own wallet** to the Four.Meme proxy. Neither LastMeme's frontend nor any LastMeme contract touches user funds
- Slippage protection via `minAmount` is enforced on-chain. A 5% default is applied; users can adjust 1–20%
- We do not filter or blocklist tokens. Honeypots and scams exist on Four.Meme. Do your own research
- The cluster similarity engine is deliberately conservative but can false-positive. A "derivative" classification is not a judgment about legitimacy — same name doesn't mean same team
- Settlement / fee-redirect / bet-pool contracts are not deployed. The Hall of Shame is simulated until they ship

## Built by

[@penguinpecker](https://github.com/penguinpecker)

---

**Contract references**

- Four.Meme TokenManager V2 proxy: [`0x5c952063c7fc8610FFDB798152D69F0B9550762b`](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)
- Four.Meme TokenManager V2 implementation: [`0xF251F83e40a78868FcfA3FA4599Dad6494E46034`](https://bscscan.com/address/0xF251F83e40a78868FcfA3FA4599Dad6494E46034)
- BSC RPC used: `https://bsc-dataseed.bnbchain.org`
- Data source: `https://api.geckoterminal.com/api/v2/networks/bsc/*`
