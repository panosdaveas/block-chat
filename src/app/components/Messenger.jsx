'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/Chat.css';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainsClient } from '@/app/hooks/useChainsClient';
// import { userBReadsMessages } from '@/app/contracts/ContractHandlers.jsx';
import { useContractAbi } from '@/app/hooks/useContractAbi';

// Message component that displays individual messages
const Message = ({ sender, message, time, isUser }) => {
    return (
        <div className={`message-container ${isUser ? 'user-message' : 'other-message'}`}>
            <div className="message-bubble">
                <div className="sender-name">{sender}</div>
                <p className="message-text">{message}</p>
                <div className="message-time">
                    {time}
                </div>
            </div>
        </div>
    );
};

// Main Chat component
export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const { abi } = useContractAbi();

    // Get account from web3 provider
    const account = useAccount();

    const { chains, loading, err } = useChainsClient();
    // Memoize chains to avoid unnecessary re-renders

    const fetchMessages = async () => {

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
            console.log(data);
            setIsLoading(isLoadingMessages || isLoadingConfig);
        }, [data, isLoadingMessages, isLoadingConfig]);
        
        if (!account || !account.chain) return;

        try {
            setIsLoading(true);
            setError(null);

            const chain = chains.find(chain =>
                chain.name === account.chain
            );

            if (!chain) {
                setError('Unsupported blockchain network');
                setIsLoading(false);
                return;
            }

            const provider = account.chain.rpcUrls.default.http;
            const contractMessages = await userBReadsMessages(
                provider,
                account,
                chain.contract.address
            );

            // Format messages for display
            const formattedMessages = contractMessages.map((msg, index) => ({
                id: index,
                sender: msg.sender,
                message: msg.content,
                time: 'time',
                isUser: msg.sender === account.address // Check if sender is current user
            }));

            setMessages(formattedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect(() => {
    //     fetchMessages();
    // }, [account, chains]); // Only re-run if account or chains change

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newMsg = {
            id: messages.length + 1,
            // sender: account.address.substring(0, 5) + '...' + account.address.substring(account.address.length - 4),
            sender: 'You',
            message: newMessage,
            time: currentTime,
            isUser: true
        };

        setMessages([...messages, newMsg]);
        setNewMessage('');

        // Simulate response (for demo purposes)
        // setTimeout(() => {
        //     const response = {
        //         id: messages.length + 2,
        //         sender: 'John',
        //         message: 'Thanks for your message!',
        //         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        //         isUser: false
        //     };
        //     setMessages(prevMessages => [...prevMessages, response]);
        // }, 1000);
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {/* Chat header */}
                <div className="chat-header">
                    <h2>BlockChat</h2>
                </div>

                {/* Messages area */}
                <div className="messages-area">
                    {messages.map((msg) => (
                        <Message
                            key={msg.id}
                            sender={msg.sender}
                            message={msg.message}
                            time={msg.time}
                            isUser={msg.isUser}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="message-input-form">
                    <div className="input-container">
                        <textarea
                            className="message-textarea"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={2}
                        />
                        <button
                            type="submit"
                            className="send-button"
                        >
                            Send
                        </button>
                    </div>
                </form>
                <ConnectButton label='Connect'
                    accountStatus={{
                        smallScreen: 'avatar',
                        largeScreen: 'address',
                    }}
                    chainStatus="icon"
                    showBalance={false} />
            </div>
        </div>
    );
}