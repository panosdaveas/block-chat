// @ts-nocheck
"use client"

import '@/app/styles/PromptChat.css';
import { useState, useEffect, useRef } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

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

export default function SendMessage() {
    const { address, chain, chainId } = useAccount();
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();
    const [chainSource, setChainSource] = useState(null);
    const [contractAddress, setContractAddress] = useState(null);
    const [error, setError] = useState(null);
    const [availableChainsList, setAvailableChainsList] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const { writeContractAsync } = useWriteContract();
    const [abi, setAbi] = useState(null);

    // Prompt-based chat states
    const [message, setMessage] = useState('');
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [showChainSuggestions, setShowChainSuggestions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState('');
    const [recentAddresses, setRecentAddresses] = useState([
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8'
    ]);

    // Refs for suggestions dropdown
    const textareaRef = useRef(null);
    const addressSuggestionsRef = useRef(null);
    const chainSuggestionsRef = useRef(null);

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
                // Set default chain
                if (list.length > 0 && !selectedChain) {
                    const otherChains = list.filter(c => c.chainId != chainId);
                    // if (otherChains.length > 0) {
                    //     setSelectedChain(otherChains[0].name);
                    // } else if (list.length > 0) {
                    //     setSelectedChain(list[0].name);
                    // }
                }
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig, artifactsData]);

    // Handle clicks outside the suggestion dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (addressSuggestionsRef.current &&
                !addressSuggestionsRef.current.contains(event.target) &&
                event.target !== textareaRef.current) {
                setShowAddressSuggestions(false);
            }
            if (chainSuggestionsRef.current &&
                !chainSuggestionsRef.current.contains(event.target) &&
                event.target !== textareaRef.current) {
                setShowChainSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Parse input for trigger words
    const handleInputChange = (e) => {
        const text = e.target.value;
        setMessage(text);

        // Debug
        console.log("Text input:", text);
        console.log("Contains @:", text.includes('@'));
        console.log("Contains #:", text.includes('#'));
        console.log("Selected address:", selectedAddress);
        console.log("Selected chain:", selectedChain);

        // Check for @address trigger
        if (text.includes('@')) {
            console.log("@ detected - should show address suggestions");
            setShowAddressSuggestions(true);
            setShowChainSuggestions(false);
        }
        // Check for #chain trigger
        else if (text.includes('#')) {
            console.log("# detected - should show chain suggestions");
            setShowChainSuggestions(true);
            setShowAddressSuggestions(false);
        }
        else {
            setShowAddressSuggestions(false);
            setShowChainSuggestions(false);
        }
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
        setShowAddressSuggestions(false);

        // Replace @trigger with selected address
        const atIndex = message.lastIndexOf('@');
        const beforeAt = message.substring(0, atIndex);
        const afterAt = message.substring(atIndex).split(/\s/);
        afterAt[0] = `@${address}`;

        setMessage(beforeAt + afterAt.join(' '));
        textareaRef.current.focus();
    };

    const selectChain = (chain) => {
        setSelectedChain(chain);
        setShowChainSuggestions(false);

        // Replace #trigger with selected chain
        const hashIndex = message.lastIndexOf('#');
        const beforeHash = message.substring(0, hashIndex);
        const afterHash = message.substring(hashIndex).split(/\s/);
        afterHash[0] = `#${chain}`;

        setMessage(beforeHash + afterHash.join(' '));
        textareaRef.current.focus();
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
            console.log(chainDest.contract.address);
            console.log(chainSource.contract.address);

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
            setSelectedAddress('');
            setSelectedChain('');
            setError(null);

        } catch (err) {
            console.error("Transaction failed:", err);
            setError(err.message || "Transaction failed");
        } finally {
            setIsSending(false);
        }
    }

    const handleSubmit = () => {
        if (!selectedAddress) {
            setError("Please specify a recipient address using @");
            return;
        }

        if (!selectedChain) {
            setError("Please specify a destination chain using #");
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

    return (
        <div className="prompt-chat-container">
            <div className="prompt-chat-box">
                <div className="message-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        className="prompt-textarea"
                        placeholder="Type your message... (Use @ for recipient address and # for destination chain)"
                        rows={2}
                    />

                    {/* Debug display */}
                    {/* <div style={{fontSize: '12px', padding: '5px', color: '#666'}}>
                        showAddressSuggestions: {showAddressSuggestions ? 'true' : 'false'}<br/>
                        showChainSuggestions: {showChainSuggestions ? 'true' : 'false'}
                    </div> */}

                    {/* Address suggestions */}
                    {showAddressSuggestions && (
                        <div className="suggestions-box" ref={addressSuggestionsRef}>
                            <div className="suggestions-header">Select recipient address:</div>
                            <ul className="suggestions-list">
                                {recentAddresses.map((address, index) => (
                                    <li
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => selectAddress(address)}
                                    >
                                        {address}
                                    </li>
                                ))}
                                <li className="suggestion-item add-new">
                                    <input
                                        type="text"
                                        placeholder="Enter new address..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value) {
                                                e.preventDefault();
                                                selectAddress(e.target.value);
                                            }
                                        }}
                                    />
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Chain suggestions */}
                    {showChainSuggestions && (
                        <div className="suggestions-box" ref={chainSuggestionsRef}>
                            <div className="suggestions-header">Select destination chain:</div>
                            <ul className="suggestions-list">
                                {availableChainsList.map((chain, index) => (
                                    <li
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => selectChain(chain.name)}
                                    >
                                        {chain.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
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
                                To: {selectedAddress.substring(0, 6)}...{selectedAddress.substring(selectedAddress.length - 4)}
                                <button
                                    className="tag-remove"
                                    onClick={() => {
                                        setSelectedAddress('');
                                        setMessage(message.replace(`@${selectedAddress}`, '@'));
                                    }}
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
                                    onClick={() => {
                                        setSelectedChain('');
                                        setMessage(message.replace(`#${selectedChain}`, '#'));
                                    }}
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
                        {isSending ? 'Processing...' : '>'}
                    </button>
                </div>
            </div>

            <div className="prompt-hint">
                <span className="hint-icon">💡</span>
                <span className="hint-text">Use <strong>@</strong> to tag recipient address and <strong>#</strong> to select destination chain</span>
            </div>
        </div>
    );
}