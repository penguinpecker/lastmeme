import { TopNav } from "@/components/shared/TopNav";
import { Marquee } from "@/components/shared/Marquee";
import { Hero } from "@/components/shared/Hero";
import { Footer } from "@/components/shared/Footer";
import { DocsSection, CodeBlock, StepRow } from "@/components/docs/DocsSection";
import { CONSTANTS } from "@/lib/mock";

export default function DocsPage() {
  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          "DOCS · HOW IT WORKS",
          "OPEN SOURCE · VERIFIABLE",
          "FOUR.MEME API + OPENAI EMBEDDINGS + ON-CHAIN TRADES",
          "NO TOKEN · NO CUSTODY · NO BETTING",
          "BUILT FOR FOUR.MEME · BNB CHAIN",
        ]}
      />

      <Hero
        kicker=">> DOCS // HOW THIS ACTUALLY WORKS"
        line1="READ THE"
        line2="FINE PRINT"
        sub={
          <>
            EVERY MECHANISM EXPLAINED. NO HAND-WAVING. NO{" "}
            <span className="font-bold text-hazard-yellow">"COMING SOON"</span>.
          </>
        }
      />

      <div className="relative z-10 mx-auto max-w-[860px] px-6 pb-10 pt-4 md:px-8">

        <DocsSection tag="01" title="WHAT LASTMEME IS">
          <p>
            LastMeme is a discovery + trading interface for Four.Meme, the memecoin bonding-curve
            launchpad on BNB Chain. Four.Meme launches ~1,000 tokens per day — many of which are
            near-copies of whatever pumped last. We group those copies into clusters, flag the
            leader of each cluster by market cap, and let you trade on-chain through your own
            wallet.
          </p>
          <p className="mt-2 text-bone/70">
            There is no betting. No staking. No custody. No contract of our own holding funds.
            LastMeme never receives a transfer of your BNB or tokens — every trade routes
            directly to Four.Meme&apos;s existing TokenManager V2 contract.
          </p>
        </DocsSection>

        <DocsSection tag="02" title="DATA SOURCE: FOUR.MEME API">
          <p>
            Every 60 seconds we pull two lists from Four.Meme&apos;s own public REST API:
          </p>
          <StepRow
            n="01"
            title="PROGRESS list"
            body="Tokens sorted by bonding-curve progress descending — closest to graduation first."
          />
          <StepRow
            n="02"
            title="VOL_DAY_1 list"
            body="Tokens sorted by 24h volume descending — current trading heat."
          />
          <p className="mt-3">
            Both lists are merged, deduped by contract address, filtered to status=PUBLISH on BSC.
            Each record includes: <span className="text-hazard-yellow">tokenAddress</span>,{" "}
            <span className="text-hazard-yellow">userAddress</span> (creator),{" "}
            <span className="text-hazard-yellow">cap</span> (market cap in BNB),{" "}
            <span className="text-hazard-yellow">progress</span>, holders, volume, logo URL, and
            launch timestamp.
          </p>
          <CodeBlock>{`POST https://four.meme/meme-api/v1/public/token/ranking
Content-Type: application/json

{
  "type": "PROGRESS",   // or "VOL_DAY_1"
  "pageSize": 80,
  "pageIndex": 1
}`}</CodeBlock>
        </DocsSection>

        <DocsSection tag="03" title="CLUSTERING: OPENAI EMBEDDINGS">
          <p>
            Every token&apos;s <span className="text-hazard-yellow">name + symbol + slug</span> is
            passed server-side to OpenAI&apos;s{" "}
            <span className="text-hazard-yellow">{CONSTANTS.embeddingModel}</span> model. Each
            token becomes a 1536-dimensional vector.
          </p>
          <p className="mt-2">
            We then run single-linkage agglomerative clustering with cosine similarity threshold{" "}
            <span className="text-hazard-yellow">{CONSTANTS.threshold}</span>. Any two tokens whose
            cosine similarity exceeds the threshold join the same cluster. The cluster&apos;s
            theme label is the most frequent alphabetic word across member names.
          </p>
          <StepRow
            n="01"
            title="Embed"
            body="Batch 96 tokens per OpenAI call. text-embedding-3-small costs ~$0.00002 per token."
          />
          <StepRow
            n="02"
            title="Cluster"
            body="Union-find over pairs where cos(a,b) ≥ 0.62. Deterministic — same tokens always cluster identically."
          />
          <StepRow
            n="03"
            title="Rank"
            body="Sort members by market cap descending. Top one is the cluster leader."
          />
          <p className="mt-3 text-bone/65">
            API key is server-side only via <code className="text-hazard-yellow">OPENAI_API_KEY</code>.
            If unset, the clusterer falls back to bigram Jaccard similarity so the app still renders.
          </p>
        </DocsSection>

        <DocsSection tag="04" title="BUY FLOW">
          <p>
            The buy button fetches a live quote via{" "}
            <code className="text-hazard-yellow">tryBuy</code> from the Four.Meme TokenManager V2
            contract. You pick an amount + slippage. On confirm, we call{" "}
            <code className="text-hazard-yellow">buyTokenAMAP</code> directly from your wallet:
          </p>
          <CodeBlock>{`TokenManager2 at ${CONSTANTS.tokenMgrAddress.slice(0, 12)}...${CONSTANTS.tokenMgrAddress.slice(-6)}

function buyTokenAMAP(
  address token,
  address to,         // recipient — your wallet
  uint256 funds,      // BNB amount
  uint256 minAmount   // slippage floor
) payable;`}</CodeBlock>
          <p className="mt-3 text-bone/65">
            Self-custody. Your wallet signs. LastMeme never sees your BNB.
          </p>
        </DocsSection>

        <DocsSection tag="05" title="SELL FLOW + FEE ROUTING">
          <p>
            This is the core mechanic. Four.Meme&apos;s <code className="text-hazard-yellow">sellToken</code>{" "}
            takes a <span className="text-hazard-yellow">feeRecipient</span> parameter — an
            arbitrary address the caller chooses at sell time. Normally this is used by trading
            bots (GMGN, MEVX) as a referral earning hook.
          </p>
          <p className="mt-2">
            When you sell a non-leader token through LastMeme, we set{" "}
            <code className="text-hazard-yellow">feeRecipient</code> to the{" "}
            <span className="text-hazard-yellow">cluster leader&apos;s creator address</span>.
            Selling the leader sets it to the zero address (contract default).
          </p>
          <CodeBlock>{`function sellToken(
  uint256 origin,         // 0 if not a third-party router
  address token,          // the non-leader token you're selling
  uint256 amount,         // how many tokens
  uint256 minFunds,       // slippage floor on BNB out
  uint256 feeRate,        // 0 = use contract default
  address feeRecipient    // ← leader's creator address
);`}</CodeBlock>
          <p className="mt-3 text-bone/65">
            <span className="text-hazard-yellow">Important:</span> this fee routing only applies
            when users sell through the LastMeme UI. Selling on four.meme directly or via other
            frontends sends fees to those UIs&apos; own recipient. There is no persistent on-chain
            redirect — it&apos;s a per-call parameter.
          </p>
        </DocsSection>

        <DocsSection tag="06" title="WHY NO OWN CONTRACT?">
          <p>
            Everything above is achievable without deploying anything. Buys and sells go to
            Four.Meme&apos;s TokenManager V2. Fee routing is a parameter on the sell call.
            Clustering is computed on our server and discarded every revalidation cycle.
          </p>
          <p className="mt-2 text-bone/70">
            A LastMeme-owned contract would add: custody of user funds (liability), a trusted
            verdict signer (centralization), audit requirements ($15K+), and legal exposure in
            certain jurisdictions if it started to look like a prediction market. We deliberately
            chose the stack that avoids all of this.
          </p>
        </DocsSection>

        <DocsSection tag="07" title="HONEST LIMITATIONS">
          <p>
            <span className="text-hazard-yellow">Clustering isn&apos;t perfect.</span> Embeddings
            on 2-word token names have a noise floor. Threshold 0.62 is tuned conservatively —
            you will occasionally see a real match get missed or an unrelated pair get grouped.
            Tune via <code className="text-hazard-yellow">SIMILARITY_THRESHOLD</code> in
            src/lib/cluster.ts if forking.
          </p>
          <p className="mt-2">
            <span className="text-hazard-yellow">Graduation breaks buys.</span> Once a Four.Meme
            token crosses 100% bonding progress, it migrates to PancakeSwap and{" "}
            <code>tryBuy</code> starts reverting. We detect the revert and surface a PancakeSwap
            deep link.
          </p>
          <p className="mt-2">
            <span className="text-hazard-yellow">Rate limits.</span> Four.Meme&apos;s API has
            informal rate limits. We revalidate every 60s. If you put this behind heavy traffic,
            add an edge cache or swap in Bitquery streams.
          </p>
        </DocsSection>

        <DocsSection tag="08" title="STACK">
          <ul className="mt-2 list-none space-y-1 pl-0 text-bone/80">
            <li>Next.js 15 · React 19 · TypeScript</li>
            <li>wagmi v2 · viem v2 · injected wallet connectors (MetaMask / Rabby / OKX / Trust)</li>
            <li>
              OpenAI {CONSTANTS.embeddingModel} · 1536-dim · cosine threshold{" "}
              {CONSTANTS.threshold}
            </li>
            <li>Tailwind v3 · custom brutalist design system</li>
            <li>Deployed on Vercel · revalidate=60s on every page</li>
          </ul>
          <p className="mt-4 text-bone/70">
            Source: <a href="https://github.com/penguinpecker/lastmeme" className="text-hazard-yellow underline">github.com/penguinpecker/lastmeme</a>
          </p>
        </DocsSection>
      </div>

      <Footer />
    </div>
  );
}
