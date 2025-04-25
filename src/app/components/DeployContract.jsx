// @ts-nocheck
"use client"

import '../styles/Deploy.css';
import { useEffect, useState, useMemo, use } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { updateAndSaveChain } from "@/app/hooks/useUpdateAndSaveChain";
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DeployContract() {
    const rawAccount = useAccount();

    const account = useMemo(() => rawAccount, [rawAccount?.address, rawAccount?.chain?.id]);
    const { switchChain } = useSwitchChain();

    const [deployedAddress, setDeployedAddress] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState(null)
    const [isDeployed, setIsDeployed] = useState(false);
    const [contractAddress, setContractAddress] = useState(null);
    const [deploymentError, setDeploymentError] = useState('');
    const [isDisabledButton, setIsDisabledButton] = useState(false);

    // State to store data from API
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();

    useEffect(() => {
        if (account?.chainId && chainsConfig) {
            setIsDisabledButton(false);
            setIsDeployed(false);
            setContractAddress(null);
            setError('');
            try {
                const chainConfig = chainsConfig?.find(chain => chain.chainId == account.chain.id);
                if (chainConfig && chainConfig?.contract && chainConfig?.contract.address) {
                    setIsDeployed(true);
                    setContractAddress(chainConfig.contract.address);
                    return;
                }
                if (!chainConfig) {
                    setError('No configuration found for ' + account?.chain.name + ' ...this chain is not yet supported')
                    setIsDisabledButton(true);
                }
            } catch (err) {
                console.log(err.message);
            }
        }
    }, [chainsConfig, account?.chainId, account]);

    // Fetch configurations on component mount
    async function deployContract() {
        if (!account.address || !account.chain || !chainsConfig || !artifactsData.abi) return;

        setIsDeploying(true);

        try {
            // Get the configuration for the current chain
            const chainConfig = chainsConfig?.find(chain => chain.chainId == account.chain.id);
            const chainName = chainConfig?.name; // axelar's name format

            if (!chainConfig) {
                setError('No configuration found for ' + account.chain.name)
                // alert(`No configuration found for ${account.chain.name}`);
                setIsDeploying(false);
                return;
            }

            // Check if we need to switch networks
            if (account.chain.id !== chainConfig.chainId && switchChain) {
                await switchChain(chainConfig.chainId);
                // setIsDeployed(false);
                // setDeployedAddress('');
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
            setIsDeployed(true);

        } catch (error) {
            console.error('Deployment error:', error);
            // alert(`Deployment failed: ${error.message}`);
            setError(error.message);
        } finally {
            setIsDeploying(false);
        }
    }

    return (
        <div className="Content">
            <div className='Content-window'>
                <div className='Content-header'>
                    <h2>Deploy Contract</h2>
                    <ConnectButton
                        label='Connect'
                        accountStatus={{
                            smallScreen: 'avatar',
                            largeScreen: 'address',
                        }}
                        chainStatus="name"
                        showBalance={false}
                        borderRadius='small'
                    />
                </div>
                <div className='message-area>'>
                    {!account.chainId && (
                        <>
                            <p className='message-warning'>
                                Not connected to any chain. Please connect your wallet.
                            </p>
                        </>
                    )}
                    {isLoading && (
                        <>
                            <p className='message-warning'>Loading chain configurations...</p>
                        </>
                    )}
                    {account.chainId && (
                        <>
                            <p className='message'>
                                Connected to {account.chain.name}
                            </p>
                        </>
                    )}
                    {deployedAddress && (
                        <><p className="message">Contract deployed successfully!</p><p className="message">Address: <strong>{deployedAddress}</strong></p></>
                    )}
                    <>
                        <p className='message'>Chain ID: {account.chainId || 'Not connected'}</p>
                        <p className='message'>Chain Name: {account.chain?.name || 'Not connected'}</p>
                        <p className='message'>Contract Address: {contractAddress || 'Not set'}</p>
                    </>
                    {isDeployed && (
                        <>
                            <p className="message-warning">Contract deployed </p>
                        </>
                    )}
                    {error && (
                        <>
                            <p className='message-warning'>Error loading configuration: {error}</p>
                        </>
                    )}
                    {deploymentError && (
                        <>
                            <p className='message-warning'>Deployment failed: {error}</p>
                        </>
                    )}
                </div>
                <div className='Content-footer'>
                    <Link href="/">
                        <button className='send-button'>
                            <svg
                                style={{ transform: 'rotate(90deg)' }}
                                fill="none"
                                height="7"
                                width="14"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <title>Dropdown</title>
                                <path
                                    d="M12.75 1.54001L8.51647 5.0038C7.77974 5.60658 6.72026 5.60658 5.98352 5.0038L1.75 1.54001"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                />
                            </svg>
                        </button>
                    </Link>
                    {(!isDeployed && !isDisabledButton) && (
                        <button
                            onClick={deployContract}
                            disabled={isDeploying || !account.address || !account.chain}
                            className="send-button"
                        >
                            {isDeploying ? 'Deploying...' : 'Deploy Contract'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}