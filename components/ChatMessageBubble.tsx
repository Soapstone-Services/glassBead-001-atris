import { ReactNode } from "react";

type Message = {
  id: string;
  role: string;
  content: string;
};

export function ChatMessageBubble(props: { message: Message, aiEmoji?: string, sources: any[] }) {
  const isUser = props.message.role === "user";
  const prefix = isUser ? "🧑" : props.aiEmoji || "🤖";

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-[80%] bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex items-start p-4">
          <div className="bg-gray-200 rounded-full p-2 mr-3 flex-shrink-0">
            {prefix}
          </div>
          <div className="flex-grow">
            <div className="text-gray-800 font-normal text-sm whitespace-pre-wrap break-words">
              {props.message.content}
            </div>
            {props.sources && props.sources.length > 0 && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <h3 className="text-xs font-semibold text-gray-600 mb-1">🔍 Sources:</h3>
                <ul className="list-decimal list-inside text-xs space-y-1 text-gray-600">
                  {props.sources.map((source, i) => (
                    <li key={`source:${i}`} className="break-words">
                      &quot;{source.pageContent}&quot;
                      {source.metadata?.loc?.lines !== undefined && (
                        <span className="block ml-4 text-xs text-gray-500">
                          Lines {source.metadata.loc.lines.from} to {source.metadata.loc.lines.to}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}