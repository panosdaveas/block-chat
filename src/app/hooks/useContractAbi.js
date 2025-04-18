// hooks/useChainsClient.ts
"use client";

import { useState, useEffect } from "react";

export function useContractAbi() {
  const [abi, setAbi] = useState();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/abi");
        const data = await res.json();
        setAbi(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
      }
    }

    fetchData();
  }, []);

  return { abi };
}