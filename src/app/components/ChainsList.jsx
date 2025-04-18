// components/BooksList.tsx
"use client";

import { useChainsClient } from "@/app/hooks/useChainsClient";

export default function ChainsList({ initialChains }) {
    const { chains, refreshChains, loading } = useChainsClient(initialChains);
    return (
        <div>
            <button
                onClick={refreshChains}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                🔄 {loading ? "Refreshing..." : "Refresh"}
            </button>
            <ul>
                {chains.map((chain) => (
                    <li key={chain.name}>
                        📘 <strong>{chain.name}</strong> by {chain.chainId}
                    </li>
                ))}
            </ul>
        </div>
    );
}