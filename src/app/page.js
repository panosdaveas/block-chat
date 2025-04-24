import "@/app/styles/App.css";
import "@/app/styles/index.css";
import HomeApp from "./components/HomeScreen";
import ChatDisplay from "@/app/components/Chat";

export default async function Home() {
  // const chains = await getChains();

  return (
    <ChatDisplay />
    // <HomeApp />
  );
}
