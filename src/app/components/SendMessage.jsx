"use client"

import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";
import { useChainsClient } from '@/app/hooks/useChainsClient';
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

async function estimateGasForDestinationChain(sourceChain, destinationChain, payload) {
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

export default function SendMessage() {
    const { address, chain, chainId } = useAccount();
    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();
    const [isLoadingClient, setIsLoadingClient] = useState(null);
    const [chainSource, setChainSource] = useState(null);
    // const [chainDest, setChainDest] = useState(null);
    const [contractAddress, setContractAddress] = useState(null);
    const [error, setError] = useState(null);
    const [chainsList, setChainsList] = useState([]);
    const [isSending, setIsSending] = useState(null);
    const { writeContractAsync } = useWriteContract();
    const [abi, setAbi] = useState(null);

    // Set contract address when chainId changes AND chainsConfig is loaded
    useEffect(() => {
        // Only proceed if chainsConfig is loaded and chainId exists
        if (chainId && chainsConfig) {
            const chain = chainsConfig.find(chain => chain.chainId == chainId);
            const list = chainsConfig.filter((chain) => chain.contract && chain.contract.address);
            if (chain && chain.contract && list && artifactsData.abi) {
                setChainSource(chain);
                setContractAddress(chain.contract.address);
                setChainsList(list);
                setAbi(artifactsData.abi);
            } else {
                setError(`No contract found for chain ID: ${chainId}`);
            }
        }
    }, [chainId, chainsConfig, artifactsData]);

    setIsSending(true);

    async function sendMessage(formData) {
        if (!chainsConfig || !abi || !address || !artifactsData.abi || !formData.destinationChainName || !chainSource) return;

        const chainDest = chainsConfig.find(chain => chain.name == formData.destinationChainName);

        if (!chainDest) return;

        const gasAmount = await estimateGasForDestinationChain(
            chainSource.name,
            chainDest.name,
            formData.content
        );

        try {
            const data = await writeContractAsync({
                abi: abi,
                address: contractAddress,
                functionName: 'sendMessage',
                args: [
                    { string: formData.destinationChainName },
                    { string: chainDest.contract.address },
                    { string: formData.recipientAddress },
                    { string: formData.content },
                ],
                value: gasAmount,
                chain,
                account: address,
            });

            console.log(data);
            
            // const { isLoading, isSuccess } = useWaitForTransactionReceipt({
            //     hash: data?.hash,
            // })

        } catch (err) {
            setError(err)
        } finally {
            setIsSending(false)
        }


    }

    return(
        <></>
    );
}