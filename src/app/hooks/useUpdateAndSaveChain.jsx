// app/utils/updateAndSaveChain.js (or wherever)
export async function updateAndSaveChain(chainsConfig, contractAddress, chainId) {
    if (!contractAddress || !chainsConfig?.length || !chainId) return;

    const updatedChains = chainsConfig.map((chain) =>
        chain.chainId === chainId
            ? {
                ...chain,
                contract: {
                    address: contractAddress,
                }
            }
            : chain
    );

    await fetch('/api/updateChains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedChains),
    });
}