import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
}

export function ChatWindow({ messages, isLoading, error, onSend, onClear }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        <h2>Chatt</h2>
        {messages.length > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={onClear}
            title="Rensa chathistorik"
          >
            <Trash2 size={14} />
            <span>Rensa</span>
          </button>
        )}
      </div>

      <div className="chat-window__messages">
        {messages.length === 0 && (
          <div className="chat-window__empty">
            <p>Ladda upp ett dokument och ställ en fråga!</p>
            <div className="chat-window__suggestions">
              <span>Exempelfrågor:</span>
              <button onClick={() => onSend("Var kontrollerar jag en medarbetares användar-ID?")}>
                Var kontrollerar jag en medarbetares användar-ID?
              </button>
              <button onClick={() => onSend("Vilka anställningsformer finns och vad skiljer dem åt?")}>
                Vilka anställningsformer finns och vad skiljer dem åt?
              </button>
              <button onClick={() => onSend("Vad händer om för mycket lön har betalats ut?")}>
                Vad händer om för mycket lön har betalats ut?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="message message--assistant">
            <div className="message__avatar">
              <Loader2 size={18} className="spinning" />
            </div>
            <div className="message__body">
              <div className="message__content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-window__error">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-window__input" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv din fråga här..."
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
