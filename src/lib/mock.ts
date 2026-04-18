/**
 * Static constants only. All dynamic data comes from Four.Meme API + OpenAI embeddings via
 * loadLiveData(). Previously this file also held mock tokens/clusters/verdicts, but those
 * were removed when the data pipeline went live.
 */

export const CONSTANTS = {
  viewersLive: 47,
  tokenMgrAddress: "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
  fourMemeProxy: "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
  fourMemeTokenManagerImpl: "0xF251F83e40a78868FcfA3FA4599Dad6494E46034",
  embeddingModel: "text-embedding-3-small",
  visionModel: "gpt-4o-mini",
  modelName: "text-embedding-3-small",
  threshold: 0.62,
  similarityThreshold: 0.62,
};
