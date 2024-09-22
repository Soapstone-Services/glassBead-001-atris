'use client'

import { useState, useEffect, ReactElement } from 'react'
import { ChatMessageBubble } from './ChatMessageBubble';

type ChatWindowProps = {
  endpoint?: string;
  emptyStateComponent?: ReactElement;
  placeholder?: string;
  titleText?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
}

export function ChatWindow({
  endpoint = '/api/chat/retrieval',
  emptyStateComponent = <div>No messages yet</div>,
  placeholder = "Ask about Audius music or artists...",
  titleText = "Audius AI Chatbot",
  emoji = "🎵",
  showIngestForm = false,
  showIntermediateStepsToggle = false
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    setIsLoading(true);
    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: input }] }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantMessage = { id: Date.now().toString(), role: 'assistant', content: '' };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        assistantMessage.content += text;
        setMessages((prevMessages) => 
          prevMessages.map(m => m.id === assistantMessage.id ? assistantMessage : m)
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessages((prevMessages) => [...prevMessages, { id: Date.now().toString(), role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">{titleText}</h2>
      <div className="flex-grow overflow-auto mb-4">
        {messages.length === 0 ? emptyStateComponent : (
          messages.map((message, index) => (
            <ChatMessageBubble
              key={index}
              message={message}
              aiEmoji={emoji}
              sources={[]} // You'll need to add source handling
            />
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-grow p-2 border rounded-l"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
