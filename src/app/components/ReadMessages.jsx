// @ts-nocheck
"use client"

import '../styles/Chat.css';
import { useState, useEffect, useRef } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { useContractAbi } from '@/app/hooks/useContractAbi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { useMessages } from '@/app/providers/MessagesProvider';

const Message = ({ sender, message, sourceChain, destinationChain, isUser }) => {
    return (
        <div className={`message-container ${isUser ? 'user-message' : 'other-message'}`}>
            <div className="message-bubble">
                <div className="sender-name">{sender.substring(0, 4) + '...' + sender.substring(sender.length - 4)}</div>
                <p className="message-text">{message}</p>
                <div className="message-time">
                    <span>
                        {sourceChain} → {destinationChain}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function ReadAndDisplayMessages() {
    const [contractAddress, setContractAddress] = useState(null);
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sentMessages, setSentMessages] = useState([]);

    const { messages, setMessages } = useMessages();
    const { address, chain, chainId } = useAccount();
    const { abi } = useContractAbi();
    const { chainsConfig, isLoading: isLoadingConfig } = useDeployClient();

    const messagesEndRef = useRef(null);

    // Set contract address when chainId changes AND chainsConfig is loaded
    useEffect(() => {
        // Only proceed if chainsConfig is loaded and chainId exists
        if (chainId && chainsConfig) {
            setContractAddress(null);
            setError(null);
            setMessages([]);
            setSentMessages([]);
            const chainConfig = chainsConfig.find(chain => chain.chainId == chainId);
            if (chainConfig && chainConfig?.contract) {
                setContractAddress(chainConfig.contract.address);
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig]);

    // Only enable the read contract when we have all the necessary data
    const { data: receivedData, isLoading: isLoadingMessages } = useReadContract({
        abi,
        address: contractAddress,
        functionName: 'getAllMessages',
        chainId,
        account: address,
    });

    const { data: sentData, isLoading: isLoadingSentMessages } = useReadContract({
        abi,
        address: contractAddress,
        functionName: 'getSentMessages',
        chainId,
        account: address,
    });

    // Update messages when data changes
    useEffect(() => {
        if (receivedData && sentData && chainId && chainsConfig) {
            const mergedMessages = [...receivedData, ...sentData];
            const sortedMergedMessages = mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const formattedMessages = sortedMergedMessages.map((msg, index) => ({
                id: index,
                sender: msg.sender,
                sourceChain: msg.sourceChain,
                destinationChain: msg.destinationChain,
                message: msg.content,
                isUser: msg.sourceChain === chainsConfig.find(chain => chain.chainId == chainId).name,
            }));
            setMessages(formattedMessages);
        }
        setIsLoading(isLoadingMessages || isLoadingConfig || isLoadingSentMessages);
    }, [receivedData, sentData, isLoadingMessages, isLoadingConfig, isLoadingSentMessages, chainId, chainsConfig]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="messages-area">
            {!isLoadingConfig && (messages.map((msg) => (
                <Message
                    key={msg.id}
                    sender={msg.sender}
                    message={msg.message}
                    sourceChain={msg.sourceChain}
                    destinationChain={msg.destinationChain}
                    isUser={msg.isUser}
                />
            )))}
            {isLoadingConfig && (
                    <p className='message-loading'>Loading chain configurations...</p>
            )}
            <div ref={messagesEndRef} />
            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}
        </div>
    );
}