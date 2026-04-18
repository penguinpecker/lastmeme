/**
 * Four.Meme TokenManager V2 on BSC mainnet.
 *
 * Proxy address (send txs here):
 *   0x5c952063c7fc8610FFDB798152D69F0B9550762b
 *
 * Implementation:
 *   0xF251F83e40a78868FcfA3FA4599Dad6494E46034
 *
 * Helper3 (read-only lookup):
 *   Use getTokenInfo(token) to determine version + tokenManager.
 *   Only V2 is supported here.
 *
 * Docs: https://four-meme.gitbook.io/four.meme/
 * On-chain reference: https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b
 */

export const FOUR_MEME_PROXY_ADDRESS =
  "0x5c952063c7fc8610FFDB798152D69F0B9550762b" as const;

export const FOUR_MEME_TOKEN_MANAGER_V2_IMPL =
  "0xF251F83e40a78868FcfA3FA4599Dad6494E46034" as const;

/** Minimal ABI: buy / try-buy / try-sell + sell. Real ABI has many more fns. */
export const tokenManagerAbi = [
  {
    type: "function",
    name: "buyTokenAMAP",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "funds", type: "uint256" },
      { name: "minAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "sellToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "tryBuy",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "funds", type: "uint256" },
    ],
    outputs: [
      { name: "tokenManager", type: "address" },
      { name: "quote", type: "address" },
      { name: "estimatedAmount", type: "uint256" },
      { name: "estimatedCost", type: "uint256" },
      { name: "estimatedFee", type: "uint256" },
      { name: "amountMsgValue", type: "uint256" },
      { name: "amountApproval", type: "uint256" },
      { name: "amountFunds", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "trySell",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [
      { name: "tokenManager", type: "address" },
      { name: "quote", type: "address" },
      { name: "funds", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "TokenPurchase",
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "account", type: "address" },
      { indexed: false, name: "price", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "cost", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const BSC_ID = 56;
