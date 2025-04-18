'use client';
import logo from '@/app/app-logo.svg';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@/app/styles/App.css';
import Image from 'next/image'

const HomeApp = () => {
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
            </header>
        </div>
    )
};

export default HomeApp;