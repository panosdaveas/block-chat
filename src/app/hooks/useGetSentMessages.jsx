// @ts-nocheck

import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { createPublicClient, parseAbiItem, http } from 'viem'
import { useEffect, useState, useCallback } from 'react'

// Function to get messages sent by a specific sender
export function useGetSentMessages(contractAddress, senderAddress) {
    // Define the ABI for the MessageSent event
    const eventAbi = parseAbiItem('event MessageSent(address indexed sender, address indexed recipient, string destinationChain, string content)')

    // State to store fetched events
    const [sentMessages, setSentMessages] = useState([])
    const { address, chain, chainId } = useAccount();

    // Function to fetch all past events
    const fetchEvents = useCallback(async () => {
        try {
            const client = createPublicClient({
                chain: chain,
                transport: http()
            })
            const latestBlock = await client.getBlockNumber();

            const logs = await client.getLogs({
                address: contractAddress,
                event: eventAbi,
                args: {
                    sender: senderAddress
                },
                // fromBlock: latestBlock - 2000n, // Or specify a starting block
                fromBlock: BigInt(39750100),
                toBlock: BigInt(39750112)
            })

            const formattedMessages = logs.map(log => ({
                sender: log.args.sender,
                recipient: log.args.recipient,
                destinationChain: log.args.destinationChain,
                content: log.args.content,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
            }))

            setSentMessages(formattedMessages)
        } catch (error) {
            console.error('Error fetching sent messages:', error)
        }
    }, [contractAddress, senderAddress])

    // Fetch events on component mount
    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    // Watch for new MessageSent events from this sender
    useWatchContractEvent({
        address: contractAddress,
        event: eventAbi,
        args: {
            sender: senderAddress
        },
        onLogs: (logs) => {
            const newMessages = logs.map(log => ({
                sender: log.args.sender,
                recipient: log.args.recipient,
                destinationChain: log.args.destinationChain,
                content: log.args.content,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
            }))

            setSentMessages(prev => [...prev, ...newMessages])
        }
    })

    return {
        sentMessages,
        refetch: fetchEvents,
        isLoading: sentMessages === null
    }
}