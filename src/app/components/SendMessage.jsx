"use client"

import { useState, useEffect } from 'react';
// @ts-ignore
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { AxelarQueryAPI, Environment, CHAINS } from "@axelar-network/axelarjs-sdk";

async function estimateGasForDestinationChain(sourceChain, destinationChain, payload) {
    try {
        const API = new AxelarQueryAPI({ environment: Environment.TESTNET });
        const gasEstimate = await API.estimateGasFee(
            sourceChain,
            destinationChain,
            700000, // gas limit
            2,      // gas price multiplier
            undefined,
            undefined,
            payload
        );

        console.log("Gas estimation successful:", gasEstimate);
        return gasEstimate;
    } catch (error) {
        console.error("Gas estimation failed:", error);
        throw error; // Re-throw to allow the caller to handle it
    }
}

// async function calculateBridgeFee(source, destination, options = {}) {
//     const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
//     const { gasLimit } = options;

//     const sourceChain = CHAINS.TESTNET[source.name.toUpperCase()] || CHAINS.TESTNET.AVALANCHE;
//     const destChain = CHAINS.TESTNET[destination.name.toUpperCase()] || CHAINS.TESTNET.FANTOM;

//     return api.estimateGasFee(sourceChain, destChain, gasLimit || 700000, 'auto');
// }

export default function SendMessage() {
    const { address, chain, chainId } = useAccount();
    // @ts-ignore
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();
    const [chainSource, setChainSource] = useState(null);
    const [contractAddress, setContractAddress] = useState(null);
    const [error, setError] = useState(null);
    const [availableChainsList, setAvailableChainsList] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const [abi, setAbi] = useState(null);
    const [selectedDestChain, setSelectedDestChain] = useState("avalanche");

    // Set contract address when chainId changes AND chainsConfig is loaded
    useEffect(() => {
        // Only proceed if chainsConfig is loaded and chainId exists
        if (chainId && chainsConfig) {
            const chain = chainsConfig.find(chain => chain.chainId == chainId);
            const list = chainsConfig.filter((chain) => chain.contract && chain.contract.address);
            if (chain && chain.contract && list && artifactsData.abi) {
                setChainSource(chain);
                setContractAddress(chain.contract.address);
                setAvailableChainsList(list);
                setAbi(artifactsData.abi);
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig, artifactsData]);


    async function handleWriteFunction(formData) {
        if (!chainsConfig || !abi || !address || !artifactsData.abi ||
            !formData.destinationChainName || !chainSource || !formData.recipientAddress) {
            setError("Missing required data");
            return;
        }

        const chainDest = chainsConfig.find(chain => chain.name == formData.destinationChainName);

        if (!chainDest) {
            setError("Destination chain not found");
            return;
        }

        try {
            setIsSending(true);
            console.log(formData);
            console.log(chainDest.contract.address);
            console.log(chainSource.contract.address);

            const gasAmount = await estimateGasForDestinationChain(
                chainSource.name,
                chainDest.name,
                formData.content
            );

            // const gasAmount = await calculateBridgeFee(
            //     chainSource,
            //     chainDest,
            //     { gasLimit: 700000 }
            // );

            const data = await writeContractAsync({
                abi: abi,
                address: contractAddress,
                functionName: 'sendMessage',
                args: [
                    formData.destinationChainName,
                    chainDest.contract.address,
                    formData.recipientAddress,
                    formData.content,
                ],
                value: gasAmount,
                chain,
                account: address,
            });

            console.log("Transaction submitted:", data);
            // Add success message or state here

        } catch (err) {
            console.error("Transaction failed:", err);
            setError(err.message || "Transaction failed");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="p-4 mb-4">
            <h3 className="font-bold">Write Contract</h3>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = {
                    // @ts-ignore
                    recipientAddress: e.target.recipientAddress.value,
                    // @ts-ignore
                    content: e.target.content.value,
                    destinationChainName: selectedDestChain
                };
                handleWriteFunction(formData);
            }}>
                <div className="mb-2">
                    <label className="block text-sm mb-1">Recipient Address:</label>
                    <input name='recipientAddress' className="w-full p-2 border rounded" placeholder="0x..." required />
                </div>
                <div className="mb-2">
                    <label className="block text-sm mb-1">Message Content:</label>
                    <input name='content' className="w-full p-2 border rounded" placeholder="Your message" required />
                </div>
                <div className="mb-4">
                    <label className="block text-sm mb-1">Destination Chain:</label>
                    <select
                        name='destinationChainName'
                        value={selectedDestChain}
                        onChange={e => setSelectedDestChain(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        {availableChainsList.map((c, index) => <option key={index} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        Error: {error.toString()}
                    </div>
                )}
                <button
                    type='submit'
                    disabled={!contractAddress || isLoading || !chainsConfig || isSending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isSending ? 'Processing...' : 'Write to Contract'}
                </button>
            </form>
        </div>
    );
}