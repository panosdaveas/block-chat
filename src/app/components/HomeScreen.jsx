// @ts-nocheck
'use client';
import logo from '@/app/app-logo.svg';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@/app/styles/App.css';
import Image from 'next/image'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeApp = () => {
    const pathname = usePathname();
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
                <Link href="/chat">
                    <button>Chat</button>
                </Link>
            </header>
        </div>
    )
};

export default HomeApp;