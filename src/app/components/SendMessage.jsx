"use client"

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { useChainsClient } from '@/app/hooks/useChainsClient';
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

async function estimateGasForDestinationChain(sourceChain, destinationChain, payload) {
    const API = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const response = API.estimateGasFee(
        sourceChain,
        destinationChain,
        700000,
        2,
        undefined,
        undefined,
        payload
    );

    response
        .then((res) => {
            console.log("Result:", res);
        })
        .catch((error) => {
            console.error("An error occurred:", error);
        });

    return response;
}

export default function SendMessage() {
    const { address, chain, chainId } = useAccount();
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();
    const [chainSource, setChainSource] = useState(null);
    // const [chainDest, setChainDest] = useState(null);
    const [contractAddress, setContractAddress] = useState(null);
    const [error, setError] = useState(null);
    const [availableChainsList, setAvailableChainsList] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const [abi, setAbi] = useState(null);
    const [selectedDestChain, setSelectedDestChain] = useState("avalanche");
    const [availableChains, setAvailableChains] = useState([]);

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
        if (!chainsConfig || !abi || !address || !artifactsData.abi || !formData.destinationChainName || !chainSource || formData.recipientAddress) return;

        const chainDest = chainsConfig.find(chain => chain.name == formData.destinationChainName);

        if (!chainDest) return;

        const gasAmount = await estimateGasForDestinationChain(
            chainSource.name,
            chainDest.name,
            formData.content
        );

        try {
            console.log(formData);
            console.log(chainDest.contract.address);
            setIsSending(true);
            const data = await writeContractAsync({
                abi: abi,
                address: contractAddress,
                functionName: 'sendMessage',
                args: [
                    { string: formData.destinationChainName },
                    { string: chainDest.contract.address },
                    { string: formData.recipientAddress },
                    { string: formData.content },
                ],
                value: gasAmount,
                chain,
                account: address,
            });

            console.log(data);

            // const { isLoading, isSuccess } = useWaitForTransactionReceipt({
            //     hash: data?.hash,
            // })

        } catch (err) {
            setError(err)
        } finally {
            setIsSending(false)
        }


    }

    return (
        <div className="p-4 mb-4">
            <h3 className="font-bold">Write Contract</h3>
            <form action={handleWriteFunction}>
                <input name='recipientAddress'></input>
                <input name='content'></input>
                <select name='destinationChainName'
                    value={selectedDestChain}
                    onChange={e => setSelectedDestChain(e.target.value)}
                >
                    {availableChainsList.map((c, index) => <option key={index} value={c.name}>{c.name}</option>)}
                </select>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        Error: {error}
                    </div>
                )}
                <button
                    type='submit'
                    onClick={handleWriteFunction}
                    disabled={!contractAddress || isLoading || !chainsConfig}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Processing...' : 'Write to Contract'}
                </button>
            </form>
        </div>
    );
}