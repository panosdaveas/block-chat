// hooks/useChainsClient.ts
"use client";

import { useState } from "react";

export function useChainsClient(initialChains) {
    const [chains, setChains] = useState(initialChains);
    const [loading, setLoading] = useState(false);

    const refreshChains = async () => {
        setLoading(true);
        const res = await fetch("/api/chains");
        const data = await res.json();
        setChains(data);
        setLoading(false);
    };

    return { chains, refreshChains, loading };
}