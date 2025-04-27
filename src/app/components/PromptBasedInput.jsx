// @ts-nocheck
"use client"

import '@/app/styles/PromptChat.css';
import { useState, useEffect, useRef } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { AxelarQueryAPI, Environment, sleep } from "@axelar-network/axelarjs-sdk";
import { useMessages } from '@/app/providers/MessagesProvider';
import { BeatLoader } from "react-spinners";
import TextareaAutosize from 'react-textarea-autosize';

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
        throw error;
    }
}

export default function SendMessage() {
    const { address, chain, chainId } = useAccount();
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();
    const { writeContractAsync } = useWriteContract();
    const { messages } = useMessages();
    const [chainSource, setChainSource] = useState(null);
    const [contractAddress, setContractAddress] = useState(null);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [abi, setAbi] = useState(null);

    // Prompt-based chat states
    const [message, setMessage] = useState('');
    const [prevMessage, setPrevMessage] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState('');

    // Additional states to track what's currently being typed
    const [pendingAddress, setPendingAddress] = useState('');
    const [pendingChain, setPendingChain] = useState('');

    // Store available chains
    const [availableChains, setAvailableChains] = useState([]);

    // Ref for textarea
    const textareaRef = useRef(null);

    // Set contract address when chainId changes AND chainsConfig is loaded
    useEffect(() => {
        // Only proceed if chainsConfig is loaded and chainId exists
        if (chainId && chainsConfig) {
            const chain = chainsConfig.find(chain => chain.chainId == chainId);
            const list = chainsConfig.filter((chain) => chain.contract && chain.contract.address);
            if (chain && chain.contract && list && artifactsData.abi) {
                setChainSource(chain);
                setContractAddress(chain.contract.address);
                setAbi(artifactsData.abi);

                // Store available chains for validation later
                const chains = list.map(chain => chain.name);
                setAvailableChains(chains);
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig, artifactsData]);

    // Handle input changes and track what's being typed
    const handleInputChange = (e) => {
        const text = e.target.value;
        setPrevMessage(message);
        setMessage(text);
        setError(null);

        // Update pending values
        updatePendingValues(text);
    };

    // Update pending values (what's currently being typed)
    const updatePendingValues = (text) => {
        // Check for @ address trigger - what's currently being typed
        const addressMatch = text.match(/@([^\s#@]+)/);
        if (addressMatch) {
            setPendingAddress(addressMatch[1]);
        } else {
            setPendingAddress('');
        }

        // Check for # chain trigger - what's currently being typed
        const chainMatch = text.match(/#([^\s#@]+)/);
        if (chainMatch) {
            setPendingChain(chainMatch[1]);
        } else {
            setPendingChain('');
        }
    };

    // Process triggers when space is typed after a value
    useEffect(() => {
        // Only process if a new character was added and it's a space
        if (message.length > prevMessage.length && message.endsWith(' ')) {
            processMessageForTriggers();
        }

        // Check if either trigger has been removed entirely
        if (!message.includes('@') && selectedAddress) {
            setSelectedAddress('');
        }

        if (!message.includes('#') && selectedChain) {
            setSelectedChain('');
        }
    }, [message, prevMessage]);

    // Process the message text for @ and # triggers when space is pressed
    const processMessageForTriggers = () => {
        // If we have a pending address and just typed a space, confirm it
        if (pendingAddress) {
            setSelectedAddress(pendingAddress);
        }

        // If we have a pending chain and just typed a space, confirm it
        if (pendingChain) {
            setSelectedChain(pendingChain);
        }
    };

    // Validate Ethereum address format
    const isValidEthereumAddress = (address) => {
        // Basic Ethereum address format: 0x followed by 40 hex characters
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethAddressRegex.test(address);
    };

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
            console.log('From:', chainDest.contract.address);
            console.log('To:', chainSource.contract.address);

            const gasAmount = await estimateGasForDestinationChain(
                chainSource.name,
                chainDest.name,
                formData.content
            );

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
            // Reset form after successful submission
            setMessage('');
            // setMessage("Transaction submitted!", data);
            setPendingAddress('');
            setPendingChain('');
            setError(null);

        } catch (err) {
            console.error("Transaction failed:", err);
            setError("Transaction failed");
        } finally {
            setIsSending(false);
        }
    }

    const handleSubmit = () => {
        // Validate address
        if (!selectedAddress) {
            setError("Please specify a recipient address using @");
            return;
        }

        if (!isValidEthereumAddress(selectedAddress)) {
            setError("Invalid Ethereum address format. Address should start with 0x followed by 40 hex characters.");
            setSelectedAddress('')
            return;
        }

        // Validate chain
        if (!selectedChain) {
            setError("Please specify a destination chain using #");
            return;
        }

        if (!availableChains.includes(selectedChain)) {
            setError(`Invalid chain name: ${selectedChain}. Please use one of the available chains.`);
            setSelectedChain('');
            return;
        }

        // Extract the actual message content by removing the triggers
        let contentOnly = message
            .replace(`@${selectedAddress}`, '')
            .replace(`#${selectedChain}`, '')
            .trim();

        const formData = {
            recipientAddress: selectedAddress,
            content: contentOnly,
            destinationChainName: selectedChain
        };

        handleWriteFunction(formData);
    };

    // Format address for display
    const formatAddress = (addr) => {
        if (!addr) return '';
        return addr.length > 10 ?
            `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}` :
            addr;
    };

    // Update the entire message when a tag is removed
    const removeAddressTag = () => {
        setSelectedAddress('');
        const updatedMessage = message.replace(/@[^\s#@]+/, '@');
        setMessage(updatedMessage);
    };

    const removeChainTag = () => {
        setSelectedChain('');
        const updatedMessage = message.replace(/#[^\s#@]+/, '#');
        setMessage(updatedMessage);
    };

    return (
        <div className="prompt-chat-container">
            <div className="prompt-chat-box">
                <div className="message-input-wrapper">
                    <TextareaAutosize
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        className="prompt-textarea"
                        placeholder="Type your message... (Use @ for recipient address and # for destination chain)"
                        rows={2}
                        minRows={2}
                        maxRows={10}
                    />
                </div>

                {error && (
                    <div className="error-message">
                        {error.toString()}
                    </div>
                )}

                <div className="prompt-chat-footer">
                    <div className="selection-tags">
                        {selectedAddress && (
                            <div className="selection-tag address-tag">
                                To: {formatAddress(selectedAddress)}
                                <button
                                    className="tag-remove"
                                    onClick={removeAddressTag}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {selectedChain && (
                            <div className="selection-tag chain-tag">
                                Chain: {selectedChain}
                                <button
                                    className="tag-remove"
                                    onClick={removeChainTag}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        className="send-button"
                        onClick={handleSubmit}
                        disabled={!contractAddress || isLoading || !chainsConfig || isSending}
                    >
                        {isSending ?
                            <BeatLoader
                                color='#61DAFB'
                                size={10}
                                speedMultiplier={0.5}
                                className='mb-0 mt-0'
                            />
                            :
                            <svg
                                style={{ transform: 'rotate(-90deg)', margin: '0 auto', display: 'flex'}}
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
                        }
                    </button>
                </div>
            </div>
            <div className="prompt-hint">
                <span className="hint-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                </span>
                <span className="hint-text">Use <strong>@</strong> to tag recipient address and <strong>#</strong> to select destination chain</span>
            </div>
        </div>
    );
}