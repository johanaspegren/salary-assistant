import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { SourceReferences } from "./SourceReference";
import type { ChatMessage } from "../types";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message--user" : "message--assistant"}`}>
      <div className="message__avatar">
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className="message__body">
        <div className="message__content">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <SourceReferences sources={message.sources} />
        )}
        <div className="message__meta">
          <span>{message.timestamp.toLocaleTimeString("sv-SE")}</span>
          {message.model_used && (
            <span className="message__model">{message.model_used}</span>
          )}
        </div>
      </div>
    </div>
  );
}
