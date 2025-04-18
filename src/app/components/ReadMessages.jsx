"use client"

import { useState, useEffect, use } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, } from 'wagmi';
import { useContractAbi } from '@/app/hooks/useContractAbi';
import { useDeployClient } from "@/app/hooks/useDeployClient";

export default function ContractInteraction() {
    const account = useAccount();
    const [contractAddress, setContractAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chain, setChain] = useState(null);
    const [messages, setMessages] = useState([]);

    const { abi } = useContractAbi();
    const { chainsConfig } = useDeployClient();
    
    
    // Get the contract info
    useEffect(() => {
        // setContractAddress("0x33872879Ce058fc3DD7a28481141E592a083c4C9");
        setChain(account.chain.name);
        setIsLoading(false);
    }, []);

    const { data } = useReadContract({
        abi,
        address: "0x33872879Ce058fc3DD7a28481141E592a083c4C9",
        functionName: 'getAllMessages',
        chainId: account.chain.id,
        account: account.address,
    });

    async function handleReadFunction() {
        if (!abi || !contractAddress) return;
        setMessages(data);
        console.log(messages);
    };

    // Define write contract hook
    const { writeContractAsync } = useWriteContract();

    const handleWriteFunction = () => {
        if (!abi || !contractAddress) return;

        const chainSender = chainsConfig.find(chain => chain.chainId == account.chain.id);

        const chainRecipient = chainsConfig.find(chain => chain.chainId == "1287");

        writeContractAsync({
            address: chainSender.contract.address,
            abi,
            functionName: 'sendMessage',
            args: [
                chainRecipient.name,
                chainRecipient.contract.address,
                '0xE2a7027C0DCcF4F322e0e792765038902ce4500e',
                'Hello me!'
            ],
            chain: chain,
            account: account.address,
        });
    };

    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Contract Interaction</h2>

            <div className="mb-4">
                <p>Chain: {chain}</p>
                <p>Contract Address: {contractAddress}</p>
            </div>

            <div className="mb-4">
                <h3 className="font-bold">Read Contract</h3>
                <button
                    onClick={handleReadFunction}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Processing...' : 'Messages'}
                </button>
                {isLoading ? (
                    <p>Loading value...</p>
                ) : (
                    <p>Value: {messages || 'N/A'}</p>
                )}
            </div>

            <div>
                <h3 className="font-bold">Write Contract</h3>
                <button
                    onClick={handleWriteFunction}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Processing...' : 'Write to Contract'}
                </button>
            </div>
        </div>
    );
}