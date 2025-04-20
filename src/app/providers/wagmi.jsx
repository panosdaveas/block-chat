'use client';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    mainnet,
    polygon,
    sepolia,
    avalancheFuji,
    moonbaseAlpha,
    moonbeamDev,
} from 'wagmi/chains';

const moonbeamLocal = {
    // ...ganache,
    id: 2500, // Default Ganache chain ID
    name: "Moonbeam Local",
    network: "Moonbeam",
    nativeCurrency: {
        decimals: 18,
        name: "aUSDC",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["http://127.0.0.1:8500/0"] },
        public: { http: ["http://127.0.0.1:8500/0"] },
    },
};

const avalancheLocal = {
    // ...ganache,
    id: 2501, // Default Ganache chain ID
    name: "Avalanche Local",
    network: "Avalanche",
    nativeCurrency: {
        decimals: 18,
        name: "aUSDC",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: ["http://127.0.0.1:8500/1"] },
        public: { http: ["http://127.0.0.1:8500/1"] },
    },
};

export const config = getDefaultConfig({
    appName: 'RainbowKit demo',
    projectId: 'YOUR_PROJECT_ID',
    chains: [
        mainnet,
        polygon,
        avalancheFuji,
        moonbeamLocal,
        avalancheLocal,
        moonbaseAlpha,
        moonbeamDev,
        sepolia,
        ...(process.env.REACT_APP_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
    ],
});
