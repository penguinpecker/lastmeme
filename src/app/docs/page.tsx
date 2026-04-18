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
          "EMBEDDING + ON-CHAIN DATA + FEE REDIRECT",
          "NO TOKEN REQUIRED TO PARTICIPATE",
          "BUILT FOR FOUR.MEME · BNB CHAIN",
        ]}
      />

      <Hero
        kicker=">> DOCS // HOW THIS ACTUALLY WORKS // APR 18 2026"
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

        <DocsSection tag="&gt; 01_WHAT" title="WHAT IS LASTMEME">
          <p>
            LastMeme is a <span className="text-hazard-yellow">plagiarism court for memecoins</span>.
            Four.Meme launches 1,000+ tokens per day. Most are derivative junk — copycats of
            whatever just pumped. We scan every launch, cluster the derivatives by embedding
            similarity, and force them to compete. The winning token absorbs the losing token's
            creator fee stream for 7 days. On-chain. Auditable. No opt-in needed.
          </p>
          <p className="mt-3">
            Think of it as <span className="text-hazard-lime">natural selection for the
            launchpad</span>. Strong tokens eat weak ones. The graveyard fills up. The ecosystem
            self-cleans.
          </p>
        </DocsSection>

        <DocsSection tag="&gt; 02_PIPELINE" title="THE PIPELINE">
          <StepRow
            n="01"
            title="INGEST"
            body={
              <>
                We tail Four.Meme's <span className="text-hazard-yellow">TokenCreate</span> events on
                BSC TokenManager V2 ({CONSTANTS.tokenMgrAddress.slice(0, 8)}...). Every new token
                drops into our indexer within ~12 seconds of its on-chain creation.
              </>
            }
          />
          <StepRow
            n="02"
            title="EMBED"
            body={
              <>
                Token name + ticker + description → OpenAI{" "}
                <span className="text-hazard-yellow">{CONSTANTS.embeddingModel}</span> → 1536-dim
                vector. Logo → {CONSTANTS.visionModel} → 512-dim vector. Vectors stored in Postgres
                with pgvector.
              </>
            }
          />
          <StepRow
            n="03"
            title="CLUSTER"
            body={
              <>
                Every new vector is compared against existing cluster centroids. Cosine similarity
                ≥ <span className="text-hazard-yellow">{CONSTANTS.threshold}</span> = match. Five or
                more matches = the cluster crosses the fight threshold and enters the queue.
              </>
            }
          />
          <StepRow
            n="04"
            title="SCORE"
            body={
              <>
                For each matchup, we pull live on-chain data (holders, top-10 concentration, buyer
                velocity, volume/liquidity ratio) and compute deterministic scores. Social sentiment
                adds a capped multiplier.
              </>
            }
          />
          <StepRow
            n="05"
            title="RESOLVE"
            body={
              <>
                Scores are hashed, verdict is pinned to IPFS, and our resolver contract on BSC
                updates the <span className="text-hazard-yellow">feeRecipient</span> on the losing
                token to redirect creator fees to the winner for 7 days.
              </>
            }
          />
        </DocsSection>

        <DocsSection tag="&gt; 03_SCORING" title="THE SCORING FORMULA">
          <p>
            Five weighted signals, all measured on-chain (except X Buzz, which uses an LLM
            sentiment enum capped at 10% of the total). Heavier weights on signals that{" "}
            <span className="text-hazard-yellow">cost real money to fake</span>:
          </p>
          <CodeBlock>{`score =  0.30 × holderCount         // sybil-resistant
       + 0.25 × distributionHealth  // top-10 concentration, inverted
       + 0.20 × buyerVelocity24h    // new buyers in last hour
       + 0.15 × volume ÷ liquidity  // wallet-capped
       + 0.10 × socialSignal        // follower-weighted, bot-filtered`}</CodeBlock>
          <p>
            Both tokens get normalized 0–100 scores. Higher wins. In a 3-way or larger brawl, the
            losers all contribute fees to the winner (see <em>Undercard</em>).
          </p>
        </DocsSection>

        <DocsSection tag="&gt; 04_CONTRACT" title="THE SETTLEMENT CONTRACT">
          <p>
            Four.Meme's <code className="text-hazard-yellow">sellToken()</code> exposes a{" "}
            <code className="text-hazard-yellow">feeRecipient</code> parameter. That's the hook.
            Our resolver contract:
          </p>
          <CodeBlock>{`function resolve(
  address loser,
  address winner,
  bytes32 verdictHash,      // IPFS-pinned score evidence
  bytes[] calldata sigs     // multi-sig from oracle set
) external {
  require(verifyOracles(verdictHash, sigs), "bad verdict");
  feeRedirect[loser] = FeeRedirect({
    recipient: winner,
    expiresAt: block.timestamp + 7 days
  });
  emit Verdict(loser, winner, verdictHash);
}`}</CodeBlock>
          <p>
            The loser's LP is untouched. The loser's holders are untouched. Only the{" "}
            <span className="text-hazard-yellow">creator fee stream</span> redirects — a parameter
            the protocol already exposes. No hacks, no rug, no funny business.
          </p>
        </DocsSection>

        <DocsSection tag="&gt; 05_BETTING" title="THE BET POOL">
          <p>
            Separate from the settlement contract. Holders (or anyone) stake BNB on either side
            during the 1-hour bet window. When the fight resolves:
          </p>
          <ul className="mt-2 space-y-1.5 list-none pl-0">
            <li>
              <span className="text-hazard-yellow">&gt;</span> Winning side splits the losing side's
              pool <em>pro-rata</em> by stake size
            </li>
            <li>
              <span className="text-hazard-yellow">&gt;</span> 2% platform cut funds protocol
              maintenance
            </li>
            <li>
              <span className="text-hazard-yellow">&gt;</span> Stakes locked until resolution — no
              yanking
            </li>
            <li>
              <span className="text-hazard-yellow">&gt;</span> Oracle-settled: once verdict hash
              lands on-chain, payouts are automatic
            </li>
          </ul>
        </DocsSection>

        <DocsSection tag="&gt; 06_FAQ" title="FAQ">
          <StepRow
            n="Q"
            title="Can I opt my token out?"
            body={
              <>
                No. Clustering is automatic. If your token is unique (embedding doesn't match any
                cluster centroid) it stays in <em>The Lonely</em> and never gets pulled into a
                fight. If your token is derivative, well — that's the whole point.
              </>
            }
          />
          <StepRow
            n="Q"
            title="What if the AI clusters incorrectly?"
            body={
              <>
                Every verdict pins its full evidence (embedding vectors, on-chain metrics, social
                inputs, weights) to IPFS. Anyone can re-run the score with our open-source scorer
                and verify. Disputes go to a human review queue.
              </>
            }
          />
          <StepRow
            n="Q"
            title="Does this need Four.Meme's permission?"
            body={
              <>
                No. We read public events and call a public function with a public parameter
                (feeRecipient) that Four.Meme designed to be swappable. Four.Meme benefits from
                cleaner discovery and higher graduation rates — alignment is natural.
              </>
            }
          />
          <StepRow
            n="Q"
            title="What chains are supported?"
            body={
              <>
                BSC (TokenManager V2). Arbitrum One and Base contracts exist; we'll expand once the
                BSC version is battle-tested.
              </>
            }
          />
        </DocsSection>

        <DocsSection tag="&gt; 07_STACK" title="THE STACK">
          <CodeBlock>{`frontend   →  Next.js 15 · React 19 · Tailwind · D3 · Framer Motion
indexer    →  Node · Bitquery GraphQL streams · Postgres + pgvector
embedding  →  OpenAI text-embedding-3-small · CLIP vision
scoring    →  Node · deterministic formulas · audited open source
contract   →  Solidity · BSC · fee redirect via sellToken hook
betting    →  Solidity · BSC · pro-rata payout contract
verdict    →  IPFS pinned + on-chain hash commitment
hosting    →  Vercel (frontend) · Railway (indexer)`}</CodeBlock>
        </DocsSection>

        <DocsSection tag="&gt; 08_LINKS" title="LINKS & CONTACTS">
          <p>
            github · <span className="text-hazard-yellow">github.com/penguinpecker/lastmeme</span>
          </p>
          <p>
            x / twitter · <span className="text-hazard-yellow">@lastmemefm</span>
          </p>
          <p>
            discord · <span className="text-hazard-yellow">discord.gg/lastmeme</span>
          </p>
          <p className="mt-4 text-bone/55">
            built in 4 days for the four.meme ai sprint · april 2026
          </p>
        </DocsSection>
      </div>

      <Footer extra={["DOCS · v0.1"]} />
    </div>
  );
}
