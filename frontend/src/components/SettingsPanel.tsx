import { useEffect, useState } from "react";
import { Settings, FileText, Trash2, Sun, Moon } from "lucide-react";
import { getModels, clearDocuments } from "../api/client";
import type { ChatSettings, DocumentInfo, ModelOption } from "../types";

interface Props {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  documents: DocumentInfo[];
  onDocumentsCleared: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  documents,
  onDocumentsCleared,
  darkMode,
  onToggleDarkMode,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [models, setModels] = useState<Record<string, ModelOption[]>>({});
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    getModels().then(setModels).catch(() => {});
  }, []);

  const handleClear = async () => {
    if (!confirm("Vill du ta bort alla uppladdade dokument?")) return;
    setClearing(true);
    try {
      await clearDocuments();
      onDocumentsCleared();
    } finally {
      setClearing(false);
    }
  };

  const providerModels = models[settings.provider] || [];

  return (
    <aside className={`settings-panel ${collapsed ? "settings-panel--collapsed" : ""}`}>
      <button
        className="settings-panel__toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Settings size={18} />
        {!collapsed && <span>Inställningar</span>}
      </button>

      {!collapsed && (
        <div className="settings-panel__content">
          {/* Theme Toggle */}
          <div className="settings-group">
            <button className="btn btn--ghost btn--block" onClick={onToggleDarkMode}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{darkMode ? "Ljust läge" : "Mörkt läge"}</span>
            </button>
          </div>

          {/* LLM Provider */}
          <div className="settings-group">
            <label>AI-leverantör</label>
            <div className="btn-group">
              <button
                className={`btn btn--sm ${settings.provider === "openai" ? "btn--primary" : "btn--ghost"}`}
                onClick={() =>
                  onSettingsChange({ ...settings, provider: "openai", model: "" })
                }
              >
                OpenAI
              </button>
              <button
                className={`btn btn--sm ${settings.provider === "ollama" ? "btn--primary" : "btn--ghost"}`}
                onClick={() =>
                  onSettingsChange({ ...settings, provider: "ollama", model: "" })
                }
              >
                Ollama
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="settings-group">
            <label>Modell</label>
            <select
              value={settings.model}
              onChange={(e) =>
                onSettingsChange({ ...settings, model: e.target.value })
              }
            >
              <option value="">Standard</option>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div className="settings-group">
            <label>
              Temperatur: <strong>{settings.temperature.toFixed(1)}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  temperature: parseFloat(e.target.value),
                })
              }
            />
            <div className="settings-group__range-labels">
              <span>Exakt</span>
              <span>Kreativ</span>
            </div>
          </div>

          {/* Top-K */}
          <div className="settings-group">
            <label>
              Antal källor (Top-K): <strong>{settings.top_k}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={settings.top_k}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  top_k: parseInt(e.target.value),
                })
              }
            />
          </div>

          {/* Chunk Size */}
          <div className="settings-group">
            <label>
              Segmentstorlek: <strong>{settings.chunk_size}</strong> tecken
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={settings.chunk_size}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  chunk_size: parseInt(e.target.value),
                })
              }
            />
            <div className="settings-group__range-labels">
              <span>Precis</span>
              <span>Bredare</span>
            </div>
          </div>

          {/* Chunk Overlap */}
          <div className="settings-group">
            <label>
              Överlappning: <strong>{settings.chunk_overlap}</strong> tecken
            </label>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={settings.chunk_overlap}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  chunk_overlap: parseInt(e.target.value),
                })
              }
            />
          </div>

          {/* Uploaded Documents */}
          <div className="settings-group">
            <label>Uppladdade dokument ({documents.length})</label>
            {documents.length > 0 ? (
              <>
                <div className="doc-list">
                  {documents.map((doc, i) => (
                    <div key={i} className="doc-item">
                      <FileText size={14} />
                      <div className="doc-item__info">
                        <span className="doc-item__name">{doc.filename}</span>
                        <span className="doc-item__meta">
                          {doc.num_chunks} segment &middot; {doc.num_tables} tabeller
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn--danger btn--sm btn--block"
                  onClick={handleClear}
                  disabled={clearing}
                >
                  <Trash2 size={14} />
                  <span>{clearing ? "Tar bort..." : "Ta bort alla"}</span>
                </button>
              </>
            ) : (
              <p className="settings-group__empty">Inga dokument uppladdade</p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
