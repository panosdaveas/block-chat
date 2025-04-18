"use client"

import { useState, useEffect, use } from 'react';
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { useContractAbi } from '@/app/hooks/useContractAbi';
// import CrossChain from '../../../artifacts/contracts/CrossChain.sol/CrossChain.json';

export default function ContractInteraction() {
    const account = useAccount();
    const [contractAddress, setContractAddress] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chain, setChain] = useState(null);

    const { abi } = useContractAbi();

    console.log(abi);

    // Get the contract info
    useEffect(() => {
        setContractAddress("0x74BE2e0b78C5257B54E0AA5D7D1323DFbc08E9CE");
        setChain(account.chain.name);
    }, []);

    // Define read contract hook - only when ABI is available
    const { data, isLoading } = useReadContract({
        abi,
        address: "0x74BE2e0b78C5257B54E0AA5D7D1323DFbc08E9CE",
        functionName: 'getAllMessages',
    });

    console.log(data);

    // Define write contract hook
    const { writeContractAsync } = useWriteContract();

    const handleWriteFunction = () => {
        if (!abi || !contractAddress) return;

        writeContractAsync({
            address: "0x74BE2e0b78C5257B54E0AA5D7D1323DFbc08E9CE",
            abi,
            functionName: 'sendMessage',
            args: [
                'avalanche', 
                '0x74BE2e0b78C5257B54E0AA5D7D1323DFbc08E9CE',
                '0xE2a7027C0DCcF4F322e0e792765038902ce4500e',
                'Hello me!'
            ],
        });
    };

    //  string calldata destinationChain,
    //     string calldata destinationAddress,
    //         address recipient,
    //             string calldata content

    // if (isLoading) return <div>Loading contract information...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Contract Interaction</h2>

            <div className="mb-4">
                <p>Chain: {chain}</p>
                <p>Contract Address: {contractAddress}</p>
                <p>ABI: {""}</p>
            </div>

            <div className="mb-4">
                <h3 className="font-bold">Read Contract</h3>
                {isLoading ? (
                    <p>Loading value...</p>
                ) : (
                    <p>Value: {data || 'N/A'}</p>
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