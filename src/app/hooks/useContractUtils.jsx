"use client";

// utils/contract-utils.js
import { ethers } from "ethers";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

// Class to handle cross-chain messaging
class CrossChainMessenger {
    constructor(provider, signer, contractAddress, contractAbi) {
        this.provider = provider;
        this.signer = signer;
        this.contractAddress = contractAddress;
        this.contract = new ethers.Contract(
            this.contractAddress,
            this.contractAbi = contractAbi,
            this.signer
        );
    }

    /**
     * Send a message to a user on another chain
     * @param {string} sourceChain - The source chain name
     * @param {string} destinationChain - The destination chain name
     * @param {string} destinationContractAddress - The contract address on destination chain
     * @param {string} recipientAddress - The recipient's address on destination chain
     * @param {string} message - The message content
     */
    async sendMessage(
        sourceChain,
        destinationChain,
        destinationContractAddress,
        recipientAddress,
        message
    ) {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized");
            }

            // Get gas estimate for cross-chain transaction
            const gasAmount = await this.estimateGasForDestinationChain(
                sourceChain,
                destinationChain,
                message
            );

            // Send the transaction with gas payment
            const tx = await this.contract.sendMessage(
                destinationChain,
                destinationContractAddress,
                recipientAddress,
                message,
                { value: gasAmount }
            );

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            console.log("Message sent! Tx:", receipt.transactionHash);
            return receipt;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    /**
     * Get all messages for the connected user
     */
    async getAllMessages() {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized");
            }

            const messages = await this.contract.getAllMessages();

            // Format the messages for easier consumption
            return messages.map((msg) => ({
                sourceChain: msg.sourceChain,
                destinationChain: msg.destinationChain,
                sender: msg.sender,
                content: msg.content,
                timestamp: new Date(
                    parseInt(msg.timestamp.toString()) * 1000
                ).toLocaleString(),
                // isRead: msg.isRead,
            }));
        } catch (error) {
            console.error("Error getting messages:", error);
            throw error;
        }
    }

    /**
     * Read a specific message by index
     * @param {number} index - The index of the message to read
     */
    async readMessage(index) {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized");
            }

            const [sender, content, timestamp, sourceChain, destinationChain] =
                await this.contract.readMessage(index);

            return {
                sender,
                content,
                timestamp: new Date(timestamp.toNumber() * 1000),
                sourceChain,
                destinationChain,
            };
        } catch (error) {
            console.error("Error reading message:", error);
            throw error;
        }
    }

    async getChainName() {
        try {
            if (!this.contract) {
                throw new Error("Contract not initialized");
            }

            return await this.contract.getChainName();
        } catch (error) {
            console.error("Error getting chain name:", error);
            throw error;
        }
    }

    /**
     * Estimate gas required for the destination chain execution
     */
    async estimateGasForDestinationChain(sourceChain, destinationChain, payload) {
        const API = new AxelarQueryAPI({ environment: Environment.TESTNET });
        const response = API.estimateGasFee(
            sourceChain,
            destinationChain,
            700000,
            2,
            undefined,
            undefined,
            payload
        );

        response
            .then((res) => {
                console.log("Result:", res);
            })
            .catch((error) => {
                console.error("An error occurred:", error);
            });

        return response;
    }
}

/**
 * Initialize a messenger with a wallet and contract information
 * @param {*} provider - The ethers provider
 * @param {*} signer - The wallet signer
 * @param {*} contractAddress - The contract address
 * @param {*} contractAbi - The contract ABI
 * @returns {CrossChainMessenger} - The messenger instance
 */
function createMessenger(provider, signer, contractAddress, contractAbi) {
    return new CrossChainMessenger(provider, signer, contractAddress, contractAbi);
}

/**
 * Send a message from one chain to another
 * @param {*} provider - The ethers provider
 * @param {*} signer - The wallet signer
 * @param {*} contractAddress - Source contract address
 * @param {*} contractAbi - The contract ABI
 * @param {*} data - Message data including chains, addresses, payload
 * @returns {Promise} - Transaction receipt
 */
async function sendMessage(provider, signer, contractAddress, contractAbi, data) {
    try {
        const messenger = createMessenger(provider, signer, contractAddress, contractAbi);

        const receipt = await messenger.sendMessage(
            data.sourceChain,
            data.destinationChain,
            data.contractAddress,
            data.recipientAddress,
            data.payload
        );

        return receipt;
    } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
    }
}

/**
 * Read all messages for a user
 * @param {*} provider - The ethers provider
 * @param {*} signer - The wallet signer
 * @param {*} contractAddress - Contract address
 * @param {*} contractAbi - The contract ABI
 * @returns {Promise} - Array of messages
 */
async function readAllMessages(provider, signer, contractAddress, contractAbi) {
    try {
        const messenger = createMessenger(provider, signer, contractAddress, contractAbi);
        const allMessages = await messenger.getAllMessages();
        return allMessages;
    } catch (error) {
        console.error("Failed to read messages:", error);
        throw error;
    }
}

export {
    createMessenger,
    sendMessage,
    readAllMessages,
    CrossChainMessenger
};