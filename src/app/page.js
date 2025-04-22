// import HomeApp from "@/app/components/HomeScreen";
// import Chat from "@/app/components/Messenger";
import "@/app/styles/App.css";
import "@/app/styles/index.css";
// import CrossChainMessenger from "./components/CrossChainMessenger";
import DeployContract from "@/app/components/DeployContract";
import ContractInteraction from "@/app/components/ReadMessages";
import SendMessage from "@/app/components/SendMessage";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default async function Home() {
  // const chains = await getChains();
  
  return (
    <div className="display: block">
      <ConnectButton />
      <DeployContract />
      <ContractInteraction />
      <SendMessage />
    </div>
    // <ChainsList initialChains={chains} />
    // <CrossChainMessenger />
    // <Chat />
    // <HomeApp />
  );
}
