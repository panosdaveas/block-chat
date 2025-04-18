"use client"

import { useState, useEffect } from 'react';

export function useDeployClient() {
    // State to store data from API
    const [chainsConfig, setChainsConfig] = useState(null);
    const [artifactsData, setArtifactsData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch configurations on component mount
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch chains configuration
                const chainsResponse = await fetch('/api/chains');
                if (!chainsResponse.ok) throw new Error('Failed to fetch chains config');
                const chainsData = await chainsResponse.json();

                // Fetch contract artifacts
                const artifactsResponse = await fetch('/api/contract');
                if (!artifactsResponse.ok) throw new Error('Failed to fetch contract artifacts');
                const contractData = await artifactsResponse.json();

                setChainsConfig(chainsData);
                setArtifactsData(contractData)
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    return { chainsConfig, artifactsData, error, isLoading }
};