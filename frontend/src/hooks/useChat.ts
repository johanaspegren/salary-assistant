import { useCallback, useState } from "react";
import { sendMessage } from "../api/client";
import type { ChatMessage, ChatSettings } from "../types";

let messageId = 0;

function nextId(): string {
  return `msg-${++messageId}-${Date.now()}`;
}

export function useChat(settings: ChatSettings) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        content: question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage(
          question,
          settings.provider,
          settings.model,
          settings.temperature,
          settings.top_k,
        );

        const assistantMessage: ChatMessage = {
          id: nextId(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          model_used: response.model_used,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ett oväntat fel uppstod";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [settings],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, send, clearMessages };
}
