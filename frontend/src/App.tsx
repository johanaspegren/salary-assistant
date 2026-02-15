import { useState, useCallback, useEffect } from "react";
import { DropZone } from "./components/DropZone";
import { ChatWindow } from "./components/ChatWindow";
import { SettingsPanel } from "./components/SettingsPanel";
import { useChat } from "./hooks/useChat";
import type { ChatSettings, DocumentInfo } from "./types";

const DEFAULT_SETTINGS: ChatSettings = {
  provider: "openai",
  model: "",
  temperature: 0.3,
  top_k: 5,
  chunk_size: 500,
  chunk_overlap: 50,
};

export default function App() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const { messages, isLoading, error, send, clearMessages } = useChat(settings);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleUpload = useCallback((doc: DocumentInfo) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const handleDocumentsCleared = useCallback(() => {
    setDocuments([]);
    clearMessages();
  }, [clearMessages]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Dokumentassistent</h1>
        <span className="app__subtitle">RAG-chatbot med AI</span>
      </header>

      <div className="app__body">
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          documents={documents}
          onDocumentsCleared={handleDocumentsCleared}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="app__main">
          <DropZone
            chunkSize={settings.chunk_size}
            chunkOverlap={settings.chunk_overlap}
            onUpload={handleUpload}
          />
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSend={send}
            onClear={clearMessages}
          />
        </main>
      </div>
    </div>
  );
}
