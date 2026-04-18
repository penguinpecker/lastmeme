"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { formatEther, formatUnits, parseEther } from "viem";
import { FOUR_MEME_PROXY_ADDRESS, tokenManagerAbi, BSC_ID } from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface Props {
  tokenAddress: string;
  tokenSymbol: string;
  color: "lime" | "red";
  fourMemeUrl?: string;
}

const AMOUNT_PRESETS = ["0.01", "0.05", "0.1", "0.5", "1.0"];

type QuoteState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; estimatedTokens: bigint; fee: bigint; msgValue: bigint }
  | { kind: "error"; message: string };

export function BuyTokenButton({ tokenAddress, tokenSymbol, color, fourMemeUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0.05");
  const [slippagePct, setSlippagePct] = useState(5);
  const [quote, setQuote] = useState<QuoteState>({ kind: "idle" });

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: bsc.id });
  const { data: bnbBalance } = useBalance({
    address,
    chainId: bsc.id,
    query: { enabled: !!address },
  });

  const {
    writeContract,
    data: txHash,
    isPending: submitting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: confirming,
    isSuccess: confirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash, chainId: bsc.id });

  const fundsBigint = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseEther(amount);
    } catch {
      return 0n;
    }
  }, [amount]);

  const onWrongChain = isConnected && chainId !== BSC_ID;

  // --- Quote via tryBuy ---
  useEffect(() => {
    if (!open) return;
    if (!publicClient) return;
    if (fundsBigint === 0n) {
      setQuote({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setQuote({ kind: "loading" });
    publicClient
      .readContract({
        address: FOUR_MEME_PROXY_ADDRESS,
        abi: tokenManagerAbi,
        functionName: "tryBuy",
        args: [tokenAddress as `0x${string}`, 0n, fundsBigint],
      })
      .then((res) => {
        if (cancelled) return;
        const [
          ,
          ,
          estimatedAmount,
          ,
          estimatedFee,
          amountMsgValue,
        ] = res as readonly [
          `0x${string}`,
          `0x${string}`,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ];
        setQuote({
          kind: "ok",
          estimatedTokens: estimatedAmount,
          fee: estimatedFee,
          msgValue: amountMsgValue,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Quote failed";
        // Most common cause: token already graduated off bonding curve
        const clean = msg.includes("reverted")
          ? "Token may already be on PancakeSwap — use four.meme directly"
          : msg.slice(0, 100);
        setQuote({ kind: "error", message: clean });
      });
    return () => {
      cancelled = true;
    };
  }, [open, tokenAddress, fundsBigint, publicClient]);

  const minAmountOut = useMemo(() => {
    if (quote.kind !== "ok") return 0n;
    const bps = BigInt(10_000 - slippagePct * 100);
    return (quote.estimatedTokens * bps) / 10_000n;
  }, [quote, slippagePct]);

  const onBuy = () => {
    if (!address || !isConnected) return;
    if (onWrongChain) return;
    if (quote.kind !== "ok") return;
    resetWrite();
    writeContract({
      address: FOUR_MEME_PROXY_ADDRESS,
      abi: tokenManagerAbi,
      functionName: "buyTokenAMAP",
      args: [
        tokenAddress as `0x${string}`,
        address,
        fundsBigint,
        minAmountOut,
      ],
      value: fundsBigint,
      chainId: bsc.id,
    });
  };

  const btnClasses =
    color === "lime"
      ? "bg-hazard-lime text-ink"
      : "bg-hazard-red text-bone";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "btn-brut w-full px-5 py-6 text-[30px] leading-none tracking-[-0.01em]",
          btnClasses,
          open && "translate-x-1 translate-y-1 shadow-[5px_5px_0_#0a0a08]",
        )}
      >
        <span className="mb-1 block font-mono text-[15px] font-normal tracking-[0.2em] opacity-75">
          &gt; BUY_{color === "lime" ? "RED" : "BLUE"}_CORNER
        </span>
        {tokenSymbol} <span className="float-right font-impact">→</span>
      </button>

      {open ? (
        <div className="mt-4 border-2 border-ink bg-ink-2 p-4 animate-feed-in">
          <div className="mb-3 flex items-center justify-between font-mono text-[14px] tracking-wider text-hazard-yellow">
            <span>
              &gt; BUY{" "}
              <span className={color === "lime" ? "text-hazard-lime" : "text-hazard-red"}>
                {tokenSymbol}
              </span>{" "}
              on BSC · via Four.Meme bonding curve
            </span>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer text-bone/60 hover:text-bone"
            >
              [ close ]
            </button>
          </div>

          {/* Wallet state */}
          {!isConnected ? (
            <div className="mb-3 border border-dashed border-hazard-yellow/50 bg-ink p-3">
              <p className="mb-2 font-mono text-[14px] text-bone/80">
                &gt; connect a wallet to buy on BSC mainnet
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
                <span className="tabular-nums text-hazard-yellow">
                  {bnbBalance ? Number(formatEther(bnbBalance.value)).toFixed(4) : "—"}
                </span>{" "}
                BNB
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

          {/* Amount picker */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {AMOUNT_PRESETS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "cursor-pointer border px-3 py-1.5 font-mono text-[14px] transition-colors",
                  amount === a
                    ? "border-hazard-yellow bg-hazard-yellow text-ink"
                    : "border-bone/40 text-bone hover:border-hazard-yellow",
                )}
              >
                {a} BNB
              </button>
            ))}
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-[110px] border border-bone/30 bg-ink px-3 py-1.5 font-mono text-[14px] text-bone outline-none focus:border-hazard-yellow"
              placeholder="custom BNB"
              inputMode="decimal"
            />
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
            {quote.kind === "idle" && (
              <p className="m-0 text-bone/50">&gt; enter amount to see quote</p>
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
                  &gt; estimated out:{" "}
                  <span className="tabular-nums text-hazard-lime">
                    {Number(formatUnits(quote.estimatedTokens, 18)).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>{" "}
                  {tokenSymbol}
                </p>
                <p className="m-0 text-bone/80">
                  &gt; min received ({slippagePct}% slip):{" "}
                  <span className="tabular-nums text-bone">
                    {Number(formatUnits(minAmountOut, 18)).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
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

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBuy}
              disabled={
                !isConnected ||
                onWrongChain ||
                quote.kind !== "ok" ||
                submitting ||
                confirming
              }
              className={cn(
                "cursor-pointer border-2 border-ink px-5 py-2 font-impact text-[18px] uppercase shadow-[4px_4px_0_#0a0a08] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#0a0a08] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40",
                color === "lime" ? "bg-hazard-lime text-ink" : "bg-hazard-red text-bone",
              )}
            >
              {submitting
                ? "sign in wallet..."
                : confirming
                ? "confirming..."
                : confirmed
                ? "bought ✓"
                : `BUY ${amount} BNB →`}
            </button>
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

          {/* Tx result */}
          {writeError ? (
            <p className="mt-2 border-l-4 border-hazard-red bg-ink pl-3 py-1 font-mono text-[12px] text-hazard-red">
              &gt; {writeError.message.slice(0, 200)}
            </p>
          ) : null}

          {txHash ? (
            <p className="mt-2 break-all border-l-4 border-hazard-yellow bg-ink pl-3 py-1 font-mono text-[12px] text-bone/70">
              &gt; tx:{" "}
              <a
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hazard-yellow underline"
              >
                {txHash}
              </a>
            </p>
          ) : null}

          {confirmed && receipt ? (
            <p className="mt-2 border-l-4 border-hazard-lime bg-ink pl-3 py-1 font-mono text-[12px] text-hazard-lime">
              &gt; confirmed in block {receipt.blockNumber.toString()} · see on BscScan
            </p>
          ) : null}

          <p className="mt-3 font-mono text-[12px] tracking-wide text-bone/45">
            &gt; buys go through Four.Meme TokenManager V2 (0x5c95...0762b) on BSC mainnet ·
            self-custody · you sign from your wallet · we never touch your funds
          </p>
        </div>
      ) : null}
    </div>
  );
}
