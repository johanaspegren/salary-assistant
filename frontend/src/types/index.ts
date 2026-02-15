export interface SourceReference {
  chunk_text: string;
  source: string;
  section: string | null;
  score: number;
  chunk_index: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  model_used?: string;
  timestamp: Date;
}

export interface DocumentInfo {
  filename: string;
  num_chunks: number;
  num_tables: number;
  num_paragraphs: number;
  sample_sections: string[];
}

export interface ModelOption {
  id: string;
  name: string;
}

export interface ChatSettings {
  provider: "openai" | "ollama";
  model: string;
  temperature: number;
  top_k: number;
  chunk_size: number;
  chunk_overlap: number;
}

export interface HealthStatus {
  status: string;
  documents_loaded: number;
  total_chunks: number;
  embedding_model: string;
}
