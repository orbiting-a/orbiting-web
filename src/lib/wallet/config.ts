import { http, createConfig } from "wagmi";
import { mainnet, polygon, base, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, base, sepolia],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
});
