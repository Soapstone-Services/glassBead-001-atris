import { ChatWindow } from '@/components/ChatWindow'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-3xl items-center justify-between font-sans text-sm">
        <h1 className="text-4xl font-bold mb-4">Audius AI Chatbot</h1>
        <ChatWindow />
      </div>
    </main>
  )
}