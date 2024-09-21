'use client'

import { useState, useEffect } from 'react'

type Message = {
  role: 'user' | 'bot';
  content: string;
};

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const messageContainer = document.querySelector('.overflow-y-auto');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.message }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, an error occurred. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Audius AI Chatbot</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-[400px] overflow-y-auto mb-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {message.content}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <span className="inline-block p-2 rounded-lg bg-gray-200">
                  Thinking...
                </span>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Audius music or artists..."
              className="flex-grow p-2 border rounded-l-lg"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-r-lg"
              disabled={isLoading}
              aria-label="Send message"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}