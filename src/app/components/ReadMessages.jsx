"use client"

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { useContractAbi } from '@/app/hooks/useContractAbi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
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

export default function ContractInteraction() {
    const { address, chain, chainId } = useAccount();
    const [contractAddress, setContractAddress] = useState(null);
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);

    const { abi } = useContractAbi();
    const { chainsConfig, isLoading: isLoadingConfig } = useDeployClient();

    // Set contract address when chainId changes AND chainsConfig is loaded
    useEffect(() => {
        // Only proceed if chainsConfig is loaded and chainId exists
        if (chainId && chainsConfig) {
            const chainSender = chainsConfig.find(chain => chain.chainId == chainId);
            if (chainSender && chainSender.contract) {
                setContractAddress(chainSender.contract.address);
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig]);

    // Only enable the read contract when we have all the necessary data
    const { data, isLoading: isLoadingMessages } = useReadContract({
        abi,
        address: contractAddress,
        functionName: 'getAllMessages',
        chainId,
        account: address,
        // Only run when contractAddress, chainId, and abi are available
        // enabled: !!contractAddress && !!chainId && !!abi,
    });

    // Update messages when data changes
    useEffect(() => {
        if (data) {
            setMessages(data);
        }
        setIsLoading(isLoadingMessages || isLoadingConfig);
    }, [data, isLoadingMessages, isLoadingConfig]);

    // Define write contract hook
    const { writeContractAsync } = useWriteContract();

    const handleWriteFunction = async () => {
        if (!abi || !contractAddress || !chainId) {
            setError("Missing required data to send message");
            return;
        }

        if (!chainsConfig) {
            setError("Chains configuration is not available yet");
            return;
        }

        const payload = "Hello from Avalanche!"

        const gasAmount = await estimateGasForDestinationChain(
            "avalanche",
            "moonbeam",
            payload
        );

        try {
            const chainRecipient = chainsConfig.find(chain => chain.chainId == "1287");

            if (!chainRecipient || !chainRecipient.contract) {
                setError("Recipient chain not found or doesn't have contract information");
                return;
            }

            await writeContractAsync({
                address: contractAddress,
                abi,
                functionName: 'sendMessage',
                args: [
                    "moonbeam",
                    "0xde55c5AA0f9fFBe8B3dD88cEdc918cE26FFAc235",
                    "0xE2a7027C0DCcF4F322e0e792765038902ce4500e",
                    payload,
                ],
                value: gasAmount,
                chain,
                account: address,
            });
        } catch (err) {
            setError(err.message);
        }
    };

    // Show loading state while configs are loading
    if (isLoadingConfig) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Contract Interaction</h2>
                <p>Loading chain configurations...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Contract Interaction</h2>

            {!chainId && (
                <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded">
                    Not connected to any chain. Please connect your wallet.
                </div>
            )}

            <div className="mb-4">
                <p>Chain ID: {chainId || 'Not connected'}</p>
                <p>Chain Name: {chain?.name || 'Not connected'}</p>
                <p>Contract Address: {contractAddress || 'Not set'}</p>
            </div>

            <div className="mb-4">
                <h3 className="font-bold">Read Contract</h3>
                {isLoadingMessages ? (
                    <p>Loading messages...</p>
                ) : messages && messages.length > 0 ? (
                    <div>
                        <p>Messages:</p>
                        <ul className="list-disc ml-6">
                            {messages.map((message, index) => (
                                <li key={index}>{message.content}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>No messages found</p>
                )}
            </div>

            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            {/* <div>
                <h3 className="font-bold">Write Contract</h3>
                <button
                    onClick={handleWriteFunction}
                    disabled={!contractAddress || isLoadingMessages || !chainsConfig}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoadingMessages ? 'Processing...' : 'Write to Contract'}
                </button>
            </div> */}
        </div>
    );
}