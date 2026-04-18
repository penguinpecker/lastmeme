# LastMeme.fm

> Similar-token clustering for Four.Meme. Live on BSC mainnet.

**Group the copies. Back the leader. Trade on-chain.**

LastMeme tails Four.Meme's launches, groups visually/textually similar tokens into clusters using OpenAI embeddings, and highlights each cluster's leader (top by market cap). You can buy any token through the UI on the Four.Meme bonding curve. When you **sell** a non-leader token through the UI, the `feeRecipient` on the sell call routes the trading fee to the leader token's creator.

No staking. No custody. No contract of ours holding anything.

## What's real

- **Four.Meme REST API** — `POST /meme-api/v1/public/token/ranking` with `type=PROGRESS` and `type=VOL_DAY_1`. Real tokens, real market cap, real creator addresses
- **OpenAI embeddings** — `text-embedding-3-small` server-side, 1536-dim, single-linkage agglomerative clustering with cosine threshold 0.62
- **On-chain buy flow** — `buyTokenAMAP(token, to, funds, minAmount)` on Four.Meme TokenManager V2 (proxy `0x5c95...0762b`)
- **On-chain sell flow with fee routing** — `sellToken(origin=0, token, amount, minFunds, feeRate=0, feeRecipient=leaderCreator)`. `feeRecipient` is the cluster leader's creator address pulled from Four.Meme's `userAddress` field
- **Self-custody everywhere** — injected wallet (MetaMask/Rabby/OKX/Trust/Binance Wallet), you sign every transaction

## What it doesn't do

- No bet pool, no prediction market, no verdict resolution
- No fee redirect after the fact — `feeRecipient` is a per-call parameter, so the routing only applies when sells are made through the LastMeme UI
- No LastMeme-owned smart contract. Deliberately

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 15 App Router · React 19 · TypeScript |
| Data source | Four.Meme public REST API (no auth, no key) |
| Clustering | OpenAI `text-embedding-3-small` (server-side), fallback bigram Jaccard |
| Web3 | wagmi v2 · viem v2 · BSC mainnet (chainId 56) · injected connectors |
| Contracts | Four.Meme TokenManager V2 @ `0xF251F83e40a78868FcfA3FA4599Dad6494E46034` via proxy `0x5c952063c7fc8610FFDB798152D69F0B9550762b` |
| Styling | Tailwind v3 · custom brutalist design system |
| Fonts | VT323 · Archivo Black · JetBrains Mono |

## Setup

```bash
npm install
```

### Environment variables

| Var | Required | What for |
| --- | --- | --- |
| `OPENAI_API_KEY` | recommended | Server-side OpenAI key for embedding clustering. If missing, falls back to bigram Jaccard |

Inject the key in Vercel under Project Settings → Environment Variables. **Never put it in a `NEXT_PUBLIC_*` var** — it must stay server-only.

```bash
npm run dev
# opens at http://localhost:3000
```

No wallet or env needed to browse. Connecting a wallet is only needed to buy/sell.

## Pages

| Route | What |
| --- | --- |
| `/` | **Clusters** — live firehose, D3 cluster graph, cluster grid, lonely-tokens section |
| `/fights/[id]` | **Cluster detail** — top-2 by market cap, tale-of-the-tape, buy/sell buttons with fee-routing notice, full undercard table |
| `/queue` | **Queue** — clusters sorted by status + activity |
| `/docs` | **Docs** — 8 sections explaining data source, clustering, buy/sell flow, fee routing, limits |

## The fee routing mechanic in one paragraph

Four.Meme's `sellToken(origin, token, amount, minFunds, feeRate, feeRecipient)` lets the caller choose who receives the trading fee on that particular sell. By default, other UIs set it to themselves as an affiliate earning. We set it to the **cluster leader's creator address** — the wallet that deployed the top token (by market cap) in the similar-token group. So when you sell a lookalike of `$PEPE2` while the cluster leader is `$PEPE`, `$PEPE`'s creator earns the fee from your sell. This only applies to sells made through the LastMeme UI. No persistent on-chain redirect exists.

## Deploy

```bash
vercel --prod
```

Works out of the box on Vercel. Add `OPENAI_API_KEY` to project env vars.

## Safety

- Trades execute from the user's own wallet to Four.Meme's proxy contract. LastMeme never touches funds
- Slippage protection via `minAmount` (buy) / `minFunds` (sell) is enforced on-chain
- Token approval on sell is requested separately before the sell transaction — the approve amount is `amountToSell + 1` token, not unlimited
- We don't filter or blocklist tokens. Honeypots exist on Four.Meme. DYOR

## Built by

[@penguinpecker](https://github.com/penguinpecker)

---

**Reference contracts**

- Four.Meme TokenManager V2 proxy: [`0x5c952063c7fc8610FFDB798152D69F0B9550762b`](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)
- Four.Meme TokenManager V2 impl: [`0xF251F83e40a78868FcfA3FA4599Dad6494E46034`](https://bscscan.com/address/0xF251F83e40a78868FcfA3FA4599Dad6494E46034)
- BSC RPC: `https://bsc-dataseed.bnbchain.org`
- Four.Meme API base: `https://four.meme/meme-api/v1/public/*`
