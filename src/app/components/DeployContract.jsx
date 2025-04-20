"use client"

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useSwitchChain, useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { updateAndSaveChain } from "@/app/hooks/useUpdateAndSaveChain";

export default function DeployContract() {
    const rawAccount = useAccount();

    const account = useMemo(() => rawAccount, [rawAccount?.address]);
    const { switchChain } = useSwitchChain();

    const [deployedAddress, setDeployedAddress] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState(null)

    // State to store data from API
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();

    // Fetch configurations on component mount
    async function deployContract() {
        if (!account.address || !account.chain || !chainsConfig || !artifactsData.abi) return;

        setIsDeploying(true);

        try {
            // Get the configuration for the current chain
            const chainConfig = chainsConfig.find(chain => chain.chainId == account.chain.id);
            const chainName = chainConfig.name; // axelar's name format

            if (!chainConfig) {
                alert(`No configuration found for ${account.chain.name}`);
                setIsDeploying(false);
                return;
            }

            // Check if we need to switch networks
            if (account.chain.id !== chainConfig.chainId && switchChain) {
                await switchChain(chainConfig.chainId);
                return; // The component will re-render when network changes
            }

            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Create contract factory
            const factory = new ethers.ContractFactory(
                artifactsData.abi,
                artifactsData.bytecode,
                signer
                // account.address
            );
            console.log(chainConfig.gateway,
                chainConfig.gasService,
                chainName);
            // Deploy with constructor arguments
            const contract = await factory.deploy(
                chainConfig.gateway,
                chainConfig.gasService,
                chainName
            );

            // Wait for deployment to confirm
            await contract.waitForDeployment();

            const contractAddress = await contract.getAddress();
            setDeployedAddress(contractAddress);

            const chainId = account.chain.id;
            await updateAndSaveChain(chainsConfig, contractAddress, chainId);

        } catch (error) {
            console.error('Deployment error:', error);
            alert(`Deployment failed: ${error.message}`);
        } finally {
            setIsDeploying(false);
        }
    }

    if (isLoading) return <div>Loading configuration...</div>;
    if (error) return <div>Error loading configuration: {error}</div>;

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">Deploy Smart Contract</h2>

            {account.chain && (
                <div className="mb-4">
                    <p>Connected to: <span className="font-semibold">{account.chain.name}</span></p>
                </div>
            )}

            <button
                onClick={deployContract}
                disabled={isDeploying || !account.address || !account.chain}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isDeploying ? 'Deploying...' : 'Deploy Contract'}
            </button>

            {deployedAddress && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    <p className="font-semibold text-green-800">Contract deployed successfully!</p>
                    <p className="mt-2">Address: <span className="font-mono">{deployedAddress}</span></p>
                </div>
            )}
        </div>
    );
}