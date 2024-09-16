import { ChatWindow } from "@/components/ChatWindow";
import dynamic from 'next/dynamic';

const AudiusSearch = dynamic(() => import('../components/AudiusSearch'), { ssr: false });

export default function Home() {
  const InfoCard = (
    <div className="p-4 md:p-8 rounded bg-[#25252d] w-full max-h-[85%] overflow-hidden">
      <h1 className="text-3xl md:text-4xl mb-4">
        Audius Insights 🎵
      </h1>
      <ul>
        <li className="text-l">
          🔍 <span className="ml-2">Search for artists and tracks on Audius.</span>
        </li>
        <li className="text-l">
          📊 <span className="ml-2">Get insights on your music and artist profile.</span>
        </li>
        <li className="text-l">
          💬 <span className="ml-2">Ask questions about Audius and get AI-powered answers.</span>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      <AudiusSearch />
      <ChatWindow
        endpoint="api/chat"
        emoji="🎵"
        titleText="Audius Assistant"
        placeholder="Ask about Audius, music trends, or get insights on artists..."
        emptyStateComponent={InfoCard}
      />
    </div>
  );
}
