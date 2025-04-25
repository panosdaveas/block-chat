// @ts-nocheck
'use client';
import '@/app/styles/App.css';

import logo from '@/app/app-logo.svg';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useDeployClient } from "@/app/hooks/useDeployClient";

const HomeApp = () => {

    const [isConnectedAccount, setIsConnectedAccount] = useState(false);
    const [isDeployed, setIsDeployed] = useState(false);

    const { chainsConfig, artifactsData, err, isLoading } = useDeployClient();

    const account = useAccount();

    useEffect(() => {
        if (account?.chainId && chainsConfig) {
            const chainConfig = chainsConfig.find(chain => chain.chainId == account.chain.id);
            if (chainConfig?.contract && chainConfig?.contract.address) {
                setIsDeployed(true);
                return;
            }
            setIsDeployed(false);
        }
    }, [chainsConfig, account?.chainId]);

    useEffect (() => {
        console.log("Wallet connected:" + account?.isConnected);
        if (account?.isConnected) {
            setIsConnectedAccount(true);
            return;
        }
        setIsConnectedAccount(false);
    }, [account?.isConnected]);

    return (
        <div className="App">
            <header className="App-header">
                <Image src={logo} className="App-logo" alt="logo" />
                <p>
                    <code>Interconnectedness at your door.</code>
                </p>
                <ConnectButton
                    label='Connect'
                    accountStatus={{
                        smallScreen: 'avatar',
                        largeScreen: 'address',
                    }}
                    chainStatus="name"
                    showBalance={false}
                />
                {isConnectedAccount &&
                    (isDeployed ?
                        <Link href="/chat">
                            <button>Chat</button>
                        </Link>
                        :
                        <Link href="/deploy">
                            <button>Deploy</button>
                        </Link>
                    )
                }
            </header>
        </div>
    )
};

export default HomeApp;