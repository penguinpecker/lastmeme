"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { formatEther, formatUnits, parseUnits } from "viem";
import {
  FOUR_MEME_PROXY_ADDRESS,
  tokenManagerAbi,
  erc20Abi,
  BSC_ID,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface Props {
  tokenAddress: string;
  tokenSymbol: string;
  fourMemeUrl?: string;
  /** Cluster leader's creator address — fees from this sell route to them. */
  leaderCreator?: string;
  leaderSymbol?: string;
}

type QuoteState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; funds: bigint; fee: bigint }
  | { kind: "error"; message: string };

const PERCENT_PRESETS = [10, 25, 50, 100];
const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

export function SellButton({
  tokenAddress,
  tokenSymbol,
  fourMemeUrl,
  leaderCreator,
  leaderSymbol,
}: Props) {
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState(25);
  const [slippagePct, setSlippagePct] = useState(5);
  const [quote, setQuote] = useState<QuoteState>({ kind: "idle" });
  const [approving, setApproving] = useState(false);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: bsc.id });

  // Token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: bsc.id,
    query: { enabled: !!address },
  });

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: bsc.id,
  });

  // Current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, FOUR_MEME_PROXY_ADDRESS] : undefined,
    chainId: bsc.id,
    query: { enabled: !!address },
  });

  const decimals = (tokenDecimals as number | undefined) ?? 18;

  const amountToSell = useMemo(() => {
    if (!tokenBalance) return 0n;
    const bal = tokenBalance as bigint;
    return (bal * BigInt(percent)) / 100n;
  }, [tokenBalance, percent]);

  const needsApproval = useMemo(() => {
    const current = (allowance as bigint | undefined) ?? 0n;
    return current < amountToSell;
  }, [allowance, amountToSell]);

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approveSigning,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash, chainId: bsc.id });

  useEffect(() => {
    if (approveConfirmed) {
      refetchAllowance();
      setApproving(false);
    }
  }, [approveConfirmed, refetchAllowance]);

  const {
    writeContract: writeSell,
    data: sellHash,
    isPending: sellSigning,
    error: sellError,
    reset: resetSell,
  } = useWriteContract();

  const {
    isLoading: sellConfirming,
    isSuccess: sellConfirmed,
    data: sellReceipt,
  } = useWaitForTransactionReceipt({ hash: sellHash, chainId: bsc.id });

  useEffect(() => {
    if (sellConfirmed) refetchBalance();
  }, [sellConfirmed, refetchBalance]);

  const onWrongChain = isConnected && chainId !== BSC_ID;

  // --- Quote via trySell ---
  useEffect(() => {
    if (!open) return;
    if (!publicClient) return;
    if (amountToSell === 0n) {
      setQuote({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setQuote({ kind: "loading" });
    publicClient
      .readContract({
        address: FOUR_MEME_PROXY_ADDRESS,
        abi: tokenManagerAbi,
        functionName: "trySell",
        args: [tokenAddress as `0x${string}`, amountToSell],
      })
      .then((res) => {
        if (cancelled) return;
        const [, , funds, fee] = res as readonly [
          `0x${string}`,
          `0x${string}`,
          bigint,
          bigint,
        ];
        setQuote({ kind: "ok", funds, fee });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Quote failed";
        const clean = msg.includes("reverted")
          ? "Token may already be on PancakeSwap — use four.meme directly"
          : msg.slice(0, 100);
        setQuote({ kind: "error", message: clean });
      });
    return () => {
      cancelled = true;
    };
  }, [open, tokenAddress, amountToSell, publicClient]);

  const minFundsOut = useMemo(() => {
    if (quote.kind !== "ok") return 0n;
    const bps = BigInt(10_000 - slippagePct * 100);
    return (quote.funds * bps) / 10_000n;
  }, [quote, slippagePct]);

  const onApprove = () => {
    if (!address || !isConnected) return;
    if (onWrongChain) return;
    resetApprove();
    setApproving(true);
    // Approve a bit more than needed to avoid rounding issues
    const approveAmount = amountToSell + parseUnits("1", decimals);
    writeApprove({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [FOUR_MEME_PROXY_ADDRESS, approveAmount],
      chainId: bsc.id,
    });
  };

  const onSell = () => {
    if (!address || !isConnected) return;
    if (onWrongChain) return;
    if (quote.kind !== "ok") return;
    if (needsApproval) return;
    resetSell();

    // feeRecipient routing:
    //  - If we have a leaderCreator for this cluster, route fees to them
    //  - If this IS the leader (leaderCreator is empty or equals own creator), use zero address
    //  - feeRate=0 tells the contract to use its default fee rate
    const feeRecipient =
      leaderCreator && /^0x[a-fA-F0-9]{40}$/.test(leaderCreator)
        ? (leaderCreator as `0x${string}`)
        : ZERO_ADDR;

    writeSell({
      address: FOUR_MEME_PROXY_ADDRESS,
      abi: tokenManagerAbi,
      functionName: "sellToken",
      args: [
        0n, // origin — 0 when not a third-party router
        tokenAddress as `0x${string}`,
        amountToSell,
        minFundsOut,
        0n, // feeRate — 0 = use contract default
        feeRecipient,
      ],
      chainId: bsc.id,
    });
  };

  const balanceFmt = tokenBalance
    ? Number(formatUnits(tokenBalance as bigint, decimals)).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })
    : "0";

  const hasBalance = tokenBalance && (tokenBalance as bigint) > 0n;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "btn-brut w-full px-5 py-4 text-[22px] leading-none tracking-[-0.01em]",
          "bg-ink-2 text-bone border-bone",
          open && "translate-x-1 translate-y-1 shadow-[5px_5px_0_#0a0a08]",
        )}
      >
        <span className="mb-1 block font-mono text-[13px] font-normal tracking-[0.2em] text-hazard-yellow">
          &gt; SELL_{tokenSymbol.replace(/^\$/, "")}
        </span>
        SELL {tokenSymbol}{" "}
        <span className="float-right font-impact text-bone/60">↓</span>
      </button>

      {open ? (
        <div className="mt-4 border-2 border-ink bg-ink-2 p-4 animate-feed-in">
          <div className="mb-3 flex items-center justify-between font-mono text-[14px] tracking-wider text-hazard-yellow">
            <span>
              &gt; SELL <span className="text-bone">{tokenSymbol}</span> on BSC · via Four.Meme
            </span>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer text-bone/60 hover:text-bone"
            >
              [ close ]
            </button>
          </div>

          {/* Fee routing notice — the core of the product mechanic */}
          {leaderCreator &&
          leaderSymbol &&
          leaderSymbol !== tokenSymbol ? (
            <div className="mb-3 border border-dashed border-hazard-lime/50 bg-ink p-3 font-mono text-[13px]">
              <p className="m-0 text-hazard-lime">
                &gt; fee routing: <span className="text-hazard-yellow">active</span>
              </p>
              <p className="m-0 mt-1 text-bone/70">
                &gt; trading fee from this sell goes to{" "}
                <span className="text-hazard-lime">{leaderSymbol}</span>{" "}
                creator:{" "}
                <span className="text-bone">
                  {leaderCreator.slice(0, 6)}...{leaderCreator.slice(-4)}
                </span>
              </p>
              <p className="m-0 mt-1 text-bone/45">
                &gt; {leaderSymbol} is the cluster leader by market cap · this is a UI-level routing
                only
              </p>
            </div>
          ) : null}

          {/* Wallet state */}
          {!isConnected ? (
            <div className="mb-3 border border-dashed border-hazard-yellow/50 bg-ink p-3">
              <p className="mb-2 font-mono text-[14px] text-bone/80">
                &gt; connect a wallet to sell on BSC mainnet
              </p>
              <div className="flex flex-wrap gap-2">
                {connectors.map((c) => (
                  <button
                    key={c.uid}
                    onClick={() => connect({ connector: c, chainId: BSC_ID })}
                    disabled={connecting}
                    className="cursor-pointer border-2 border-ink bg-hazard-yellow px-3 py-1.5 font-impact text-[14px] uppercase text-ink shadow-[3px_3px_0_#0a0a08] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#0a0a08] disabled:opacity-50"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-dashed border-hazard-lime/40 bg-ink p-2 font-mono text-[13px] text-bone/80">
              <span>
                &gt; connected:{" "}
                <span className="text-hazard-lime">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </span>
              <span className="text-bone/60">
                balance:{" "}
                <span className="tabular-nums text-hazard-yellow">{balanceFmt}</span>{" "}
                {tokenSymbol}
              </span>
              <button
                onClick={() => disconnect()}
                className="cursor-pointer text-bone/50 hover:text-hazard-red"
              >
                [ disconnect ]
              </button>
            </div>
          )}

          {/* Wrong chain */}
          {onWrongChain ? (
            <div className="mb-3 border border-dashed border-hazard-red bg-ink p-3">
              <p className="mb-2 font-mono text-[14px] text-hazard-red">
                &gt; wrong chain · switch to BNB Smart Chain (56)
              </p>
              <button
                onClick={() => switchChain({ chainId: BSC_ID })}
                disabled={switching}
                className="cursor-pointer border-2 border-ink bg-hazard-red px-3 py-1.5 font-impact text-[14px] uppercase text-bone shadow-[3px_3px_0_#0a0a08] disabled:opacity-50"
              >
                {switching ? "switching..." : "switch to bsc"}
              </button>
            </div>
          ) : null}

          {/* Percent picker */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-bone/60">&gt; sell:</span>
            {PERCENT_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPercent(p)}
                className={cn(
                  "cursor-pointer border px-3 py-1.5 font-mono text-[14px] transition-colors",
                  percent === p
                    ? "border-hazard-yellow bg-hazard-yellow text-ink"
                    : "border-bone/40 text-bone hover:border-hazard-yellow",
                )}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Slippage */}
          <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[13px] text-bone/70">
            <span>&gt; slippage:</span>
            {[1, 5, 10, 20].map((s) => (
              <button
                key={s}
                onClick={() => setSlippagePct(s)}
                className={cn(
                  "cursor-pointer border px-2 py-1 text-[12px] transition-colors",
                  slippagePct === s
                    ? "border-hazard-yellow bg-hazard-yellow/10 text-hazard-yellow"
                    : "border-bone/30 text-bone/80 hover:border-hazard-yellow",
                )}
              >
                {s}%
              </button>
            ))}
          </div>

          {/* Quote */}
          <div className="mb-3 border border-dashed border-bone/25 bg-ink p-3 font-mono text-[13px]">
            {!hasBalance && isConnected && (
              <p className="m-0 text-bone/50">&gt; no {tokenSymbol} balance to sell</p>
            )}
            {hasBalance && quote.kind === "idle" && (
              <p className="m-0 text-bone/50">&gt; pick a percentage above</p>
            )}
            {quote.kind === "loading" && (
              <p className="m-0 text-hazard-yellow">&gt; fetching quote from TokenManager V2...</p>
            )}
            {quote.kind === "error" && (
              <p className="m-0 text-hazard-red">&gt; {quote.message}</p>
            )}
            {quote.kind === "ok" && (
              <div className="space-y-1">
                <p className="m-0 text-bone/80">
                  &gt; selling:{" "}
                  <span className="tabular-nums text-bone">
                    {Number(formatUnits(amountToSell, decimals)).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>{" "}
                  {tokenSymbol}
                </p>
                <p className="m-0 text-bone/80">
                  &gt; estimated out:{" "}
                  <span className="tabular-nums text-hazard-lime">
                    {Number(formatEther(quote.funds)).toFixed(5)}
                  </span>{" "}
                  BNB
                </p>
                <p className="m-0 text-bone/80">
                  &gt; min received ({slippagePct}% slip):{" "}
                  <span className="tabular-nums text-bone">
                    {Number(formatEther(minFundsOut)).toFixed(5)}
                  </span>{" "}
                  BNB
                </p>
                <p className="m-0 text-bone/60">
                  &gt; fee:{" "}
                  <span className="tabular-nums">
                    {Number(formatEther(quote.fee)).toFixed(5)}
                  </span>{" "}
                  BNB
                </p>
              </div>
            )}
          </div>

          {/* Action row — approve OR sell */}
          <div className="flex flex-wrap items-center gap-3">
            {needsApproval && hasBalance && quote.kind === "ok" ? (
              <button
                onClick={onApprove}
                disabled={
                  !isConnected ||
                  onWrongChain ||
                  approveSigning ||
                  approveConfirming ||
                  approving
                }
                className="cursor-pointer border-2 border-ink bg-hazard-yellow px-5 py-2 font-impact text-[18px] uppercase text-ink shadow-[4px_4px_0_#0a0a08] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#0a0a08] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {approveSigning
                  ? "sign approve in wallet..."
                  : approveConfirming
                  ? "approving..."
                  : `APPROVE ${tokenSymbol} →`}
              </button>
            ) : (
              <button
                onClick={onSell}
                disabled={
                  !isConnected ||
                  onWrongChain ||
                  quote.kind !== "ok" ||
                  !hasBalance ||
                  needsApproval ||
                  sellSigning ||
                  sellConfirming
                }
                className="cursor-pointer border-2 border-ink bg-hazard-red px-5 py-2 font-impact text-[18px] uppercase text-bone shadow-[4px_4px_0_#0a0a08] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#0a0a08] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sellSigning
                  ? "sign in wallet..."
                  : sellConfirming
                  ? "confirming..."
                  : sellConfirmed
                  ? "sold ✓"
                  : `SELL ${percent}% ↓`}
              </button>
            )}
            {fourMemeUrl ? (
              <a
                href={fourMemeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer border border-bone/30 bg-ink px-3 py-1.5 font-mono text-[13px] text-bone/80 transition-colors hover:border-hazard-yellow hover:text-hazard-yellow"
              >
                view on four.meme ↗
              </a>
            ) : null}
          </div>

          {/* Tx state */}
          {sellError ? (
            <p className="mt-2 border-l-4 border-hazard-red bg-ink pl-3 py-1 font-mono text-[12px] text-hazard-red">
              &gt; {sellError.message.slice(0, 200)}
            </p>
          ) : null}

          {approveHash && !approveConfirmed ? (
            <p className="mt-2 break-all border-l-4 border-hazard-yellow bg-ink pl-3 py-1 font-mono text-[12px] text-bone/70">
              &gt; approve tx:{" "}
              <a
                href={`https://bscscan.com/tx/${approveHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hazard-yellow underline"
              >
                {approveHash.slice(0, 22)}...
              </a>
            </p>
          ) : null}

          {sellHash ? (
            <p className="mt-2 break-all border-l-4 border-hazard-yellow bg-ink pl-3 py-1 font-mono text-[12px] text-bone/70">
              &gt; sell tx:{" "}
              <a
                href={`https://bscscan.com/tx/${sellHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hazard-yellow underline"
              >
                {sellHash}
              </a>
            </p>
          ) : null}

          {sellConfirmed && sellReceipt ? (
            <p className="mt-2 border-l-4 border-hazard-lime bg-ink pl-3 py-1 font-mono text-[12px] text-hazard-lime">
              &gt; confirmed in block {sellReceipt.blockNumber.toString()}
            </p>
          ) : null}

          <p className="mt-3 font-mono text-[12px] tracking-wide text-bone/45">
            &gt; sells go through Four.Meme TokenManager V2 (0x5c95...0762b) on BSC mainnet ·
            self-custody · fees routed via the feeRecipient parameter at call time
          </p>
        </div>
      ) : null}
    </div>
  );
}
