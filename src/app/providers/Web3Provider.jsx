'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import merge from 'lodash.merge';

import { config } from './wagmi';

const queryClient = new QueryClient();

const myTheme = merge(darkTheme(), {
    blurs: {
        modalOverlay: 'none',
    },
    colors: {
        accentColor: '#61DAFB',
        accentColorForeground: '#282c34',
        connectButtonText: '#61DAFB',
        connectButtonBackground: '#282c34',
    },
    fonts: {
        body: 'inherit',
    },
    shadows: {
        connectButton: 'none',
    }
});

const Disclaimer = ({ Text, Link }) => (
    <Text>
        Disclaimer: Never share your seed phrase or private key with anyone. Always double-check the URL of the site you are visiting.
    </Text>
);

const WalletProvider = ({ children }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    coolMode theme={myTheme}
                    modalSize='compact'
                    chains={config.chains}
                    appInfo={{
                        appName: 'Interconnectedness',
                        learnMoreUrl: '###',
                        disclaimer: Disclaimer,
                    }}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default WalletProvider;