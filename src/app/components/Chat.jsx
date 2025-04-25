// @ts-nocheck
"use client"

import '../styles/Chat.css';
import ReadAndDisplayMessages from './ReadMessages';
import SendMessage from './PromptBasedInput';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function ChatDisplay() {
    return (
        <div>
            <div className="chat-container">
                <div className="chat-window">
                    {/* Chat header */}
                    <div className="chat-header">
                        <Link href="/">
                            <h2>BlockChat</h2>
                        </Link>
                        <ConnectButton
                            label='Connect'
                            accountStatus={{
                                smallScreen: 'avatar',
                                largeScreen: 'address',
                            }}
                            chainStatus="name"
                            showBalance={false}
                            borderRadius='small'
                        />
                    </div>
                    {/* Chat body */}
                    <ReadAndDisplayMessages />
                    <SendMessage />
                </div>
            </div>
        </div>
    );
}