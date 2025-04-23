// import HomeApp from "@/app/components/HomeScreen";
import Chat from "@/app/components/Messenger";
import "@/app/styles/App.css";
import "@/app/styles/index.css";
import DeployContract from "@/app/components/DeployContract";
import GetMessages from "@/app/components/ReadMessages";
import SendMessage from "@/app/components/SendMessage";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import HomeApp from "./components/HomeScreen";
import ChatDisplay from "@/app/components/Chat";

export default async function Home() {
  // const chains = await getChains();

  return (
    <ChatDisplay />
    // <div className="display: block">
      // <GetMessages />
      //<Chat />
      //<HomeApp />
      //<ConnectButton />
      //<DeployContract />
      //<SendMessage />
    // </div>
    // <ChainsList initialChains={chains} />
    // <CrossChainMessenger />
    // <Chat />
    // <HomeApp />
  );
}
