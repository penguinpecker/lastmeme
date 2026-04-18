# LastMeme.fm

> Similar-token clustering for Four.Meme memecoins on BNB Chain.

**Live:** [lastmeme.vercel.app](https://lastmeme.vercel.app)

Four.Meme launches ~1,000 tokens a day. Most are carbon copies of whatever pumped last. LastMeme groups the copies into clusters, flags the leader of each cluster by market cap, and lets you trade on-chain — with one twist: **when you sell a non-leader token through our UI, the trading fee routes to the leader token's creator wallet.**

No contract of our own. No custody. No betting. The fee-routing is a parameter that already exists on Four.Meme's `sellToken` — we just point it somewhere useful.

---

## How it works

```
Four.Meme API (every 60s)
  ↓ POST /meme-api/v1/public/token/ranking
  ↓ types: PROGRESS + VOL_DAY_1
  ↓ 80 tokens with creator addresses
  ↓
OpenAI text-embedding-3-small (server-side)
  ↓ embed(name + symbol + slug) → 1536-dim vectors
  ↓
Single-linkage agglomerative clustering
  ↓ cosine similarity ≥ 0.62 → same cluster
  ↓ rank members by market cap → leader = top
  ↓
Rendered on /
  ↓ discovery grid, firehose, D3 cluster graph
  ↓
User clicks into /fights/[id]
  ↓ Buy  → buyTokenAMAP(token, user, funds, minAmount)
  ↓ Sell → sellToken(0, token, amount, minFunds, 0, LEADER_CREATOR)
                                                  ↑
                               fee routes here on non-leader sells
```

Everything goes to Four.Meme's already-deployed TokenManager V2 proxy at `0x5c95...0762b`. Self-custody. Your wallet signs. We never touch funds.

---

## The fee-routing mechanic, precisely

Four.Meme's `sellToken()` signature includes `address feeRecipient` — a parameter the *caller* chooses per sell. GMGN, MEVX, and other trading UIs use it to earn referral fees. LastMeme uses it differently:

- Selling a **non-leader** token → `feeRecipient = cluster leader's creator address`
- Selling the **leader** itself → `feeRecipient = 0x0` (contract default)

**Important scope:** this only applies to sells routed through the LastMeme UI. Selling on four.meme directly, or through GMGN/MEVX, sends fees to those UIs' own recipient addresses. There is no persistent on-chain redirect — the parameter is per-call. That's not a limitation of our app, that's how the Four.Meme contract was designed.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router · React 19 · TypeScript |
| Data source | Four.Meme public REST API (no auth) |
| Clustering | OpenAI `text-embedding-3-small` (server-side) with bigram Jaccard fallback |
| Web3 | wagmi v2 · viem v2 · BSC mainnet · injected connectors (MetaMask / Rabby / OKX / Trust / Binance Wallet) |
| Contracts used | [`0x5c95...0762b`](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b) (Four.Meme TokenManager V2 proxy) |
| Styling | Tailwind v3 · custom brutalist design system · VT323 / Archivo Black / JetBrains Mono |
| Hosting | Vercel · `revalidate: 60` on every page |

---

## Local development

```bash
git clone https://github.com/penguinpecker/lastmeme
cd lastmeme
npm install
npm run dev
# http://localhost:3000
```

### Environment variables

| Var | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | recommended | Server-side embedding. Without it, clustering falls back to bigram Jaccard similarity (works but noisier) |

Add it in Vercel → Project → Settings → Environment Variables. **Never as `NEXT_PUBLIC_*`** — it must stay server-side.

---

## Pages

| Route | What |
|---|---|
| `/` | Live discovery · firehose · D3 cluster graph · unclustered "lonely" tokens |
| `/fights/[id]` | Cluster detail · top-2 tokens · tale of the tape · buy + sell with fee-routing notice |
| `/queue` | Clusters sorted by activity |
| `/docs` | 8-section explainer — data source, clustering, buy/sell, fee routing, limits |

---

## What it doesn't do (on purpose)

- **No bet pool.** No user staking. No prediction market.
- **No LastMeme-owned contract.** Deliberately. Adding one would require custody, a trusted oracle, an audit (~$15k), and legal review in some jurisdictions.
- **No fee redirect outside our UI.** `feeRecipient` is per-call. Sells on four.meme directly send fees to Four.Meme, not us or the leader creator. That's the contract's design, not our choice.
- **No honeypot filter.** Four.Meme has scams. Do your own research.

---

## Safety

- Every trade executes from the **user's wallet** to Four.Meme's proxy contract. LastMeme never custodies BNB or tokens.
- Slippage protection via `minAmount` (buy) / `minFunds` (sell) enforced on-chain.
- Token approval on sell is requested separately with `amount + 1 token` — not unlimited.

---

## Built by

[@penguinpecker](https://github.com/penguinpecker) · BSC · [four.meme](https://four.meme)

---

## Contract references

- Four.Meme TokenManager V2 proxy: [`0x5c952063c7fc8610FFDB798152D69F0B9550762b`](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)
- Four.Meme TokenManager V2 impl: [`0xF251F83e40a78868FcfA3FA4599Dad6494E46034`](https://bscscan.com/address/0xF251F83e40a78868FcfA3FA4599Dad6494E46034)
- BSC RPC used: `https://bsc-dataseed.bnbchain.org`
- Four.Meme API base: `https://four.meme/meme-api/v1/public/*`
