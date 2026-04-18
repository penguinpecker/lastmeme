"use client";

import { http, createConfig } from "wagmi";
import { bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * BSC-only wagmi config.
 *
 * We only ship the `injected` connector (MetaMask, Rabby, OKX, Binance Wallet
 * browser extensions, Trust Wallet mobile in-app browser, etc). This keeps the
 * bundle lean and avoids the WalletConnect project-id requirement.
 *
 * To add WalletConnect later, install `@walletconnect/ethereum-provider`,
 * create a project at https://cloud.walletconnect.com, set
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, and add:
 *   import { walletConnect } from "wagmi/connectors";
 *   connectors: [injected(...), walletConnect({ projectId: ... })]
 */

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [bsc.id]: http("https://bsc-dataseed.bnbchain.org"),
  },
  ssr: true,
});
