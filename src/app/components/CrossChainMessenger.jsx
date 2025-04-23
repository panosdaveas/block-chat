'use client';

import { useState } from 'react';
import { useContractAbi } from '../hooks/useContractAbi';
import { useChainsClient } from '../hooks/useChainsClient';
import { sendMessage, readAllMessages } from '../hooks/useContractUtils';
import { useAccount } from 'wagmi';

export default function CrossChainMessenger() {
    const { chains, loading: chainsLoading } = useChainsClient();
    const { contractAbi, loading: abiLoading } = useContractAbi();
    const address = useAccount().address;
    const provider = useAccount().chain.rpcUrls.default.http;
    const signer = useAccount();

    const [sourceChain, setSourceChain] = useState('');
    const [destChain, setDestChain] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [message, setMessage] = useState('');
    const [destContractAddress, setDestContractAddress] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Find contract address for selected chain
    const getContractForChain = (chainName) => {
        const chain = chains.find(c => c.name === chainName);
        return chain?.callContract || '';
    };

    const handleSourceChainChange = (e) => {
        const selectedChain = e.target.value;
        setSourceChain(selectedChain);
        // Auto-populate source contract address
        const contractAddress = getContractForChain(selectedChain);
        if (contractAddress) {
            setDestContractAddress(contractAddress);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!signer || !contractAbi) return;

        setIsSending(true);
        try {
            const sourceContractAddress = getContractForChain(sourceChain);
            if (!sourceContractAddress) {
                throw new Error('Contract address not found for source chain');
            }

            await sendMessage(
                provider,
                signer,
                sourceContractAddress,
                contractAbi,
                {
                    sourceChain,
                    destinationChain: destChain,
                    contractAddress: destContractAddress,
                    recipientAddress,
                    payload: message
                }
            );

            // Reset form
            setMessage('');
            alert('Message sent successfully!');
        } catch (error) {
            console.error('Error sending message:', error);
            alert(`Failed to send message: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const fetchMessages = async () => {
        if (!signer || !contractAbi) return;

        setIsLoading(true);
        try {
            const sourceContractAddress = getContractForChain(sourceChain);
            if (!sourceContractAddress) {
                throw new Error('Contract address not found for source chain');
            }

            const allMessages = await readAllMessages(
                provider,
                signer,
                sourceContractAddress,
                contractAbi
            );

            setMessages(allMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            alert(`Failed to fetch messages: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (chainsLoading || abiLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Cross-Chain Messenger</h1>

            <div className="bg-white shadow rounded p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Send Message</h2>
                <form onSubmit={handleSendMessage}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block mb-1">Source Chain</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={sourceChain}
                                onChange={handleSourceChainChange}
                                required
                            >
                                <option value="">Select Source Chain</option>
                                {chains.map(chain => (
                                    <option key={`source-${chain.name}`} value={chain.name}>
                                        {chain.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1">Destination Chain</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={destChain}
                                onChange={(e) => setDestChain(e.target.value)}
                                required
                            >
                                <option value="">Select Destination Chain</option>
                                {chains.map(chain => (
                                    <option key={`dest-${chain.name}`} value={chain.name}>
                                        {chain.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block mb-1">Destination Contract Address</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={destContractAddress}
                            onChange={(e) => setDestContractAddress(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block mb-1">Recipient Address</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block mb-1">Message</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                        disabled={isSending}
                    >
                        {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>

            <div className="bg-white shadow rounded p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">My Messages</h2>
                    <button
                        className="px-4 py-2 bg-gray-200 rounded"
                        onClick={fetchMessages}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Refresh Messages'}
                    </button>
                </div>

                {messages.length === 0 ? (
                    <p className="text-gray-500">No messages found</p>
                ) : (
                    <ul className="space-y-4">
                        {messages.map((msg, idx) => (
                            <li key={idx} className="border-b pb-3">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>From: {msg.sender.substring(0, 8)}...</span>
                                    <span>{msg.timestamp}</span>
                                </div>
                                <div className="mt-1">
                                    <p>{msg.content}</p>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    <span>{msg.sourceChain} → {msg.destinationChain}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}