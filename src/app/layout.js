// import "./globals.css";
import "@/app/styles/index.css";
import WalletProvider from "./providers/Web3Provider";
import { MessagesProvider } from "./providers/MessagesProvider";

export const metadata = {
  title: "BlockChat",
  description: "The state of being connected with each other.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <MessagesProvider>
            {children}
          </MessagesProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
