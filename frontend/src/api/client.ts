import type { ChatMessage, DocumentInfo, HealthStatus, ModelOption } from "../types";

const API_BASE = "/api";

export async function uploadDocument(
  file: File,
  chunkSize: number,
  chunkOverlap: number,
): Promise<DocumentInfo> {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({
    chunk_size: chunkSize.toString(),
    chunk_overlap: chunkOverlap.toString(),
  });

  const res = await fetch(`${API_BASE}/upload?${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Uppladdning misslyckades" }));
    throw new Error(err.detail || "Uppladdning misslyckades");
  }

  return res.json();
}

export async function sendMessage(
  question: string,
  provider: string,
  model: string,
  temperature: number,
  topK: number,
): Promise<{ answer: string; sources: ChatMessage["sources"]; model_used: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      provider,
      model: model || undefined,
      temperature,
      top_k: topK,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Chattfel" }));
    throw new Error(err.detail || "Chattfel");
  }

  return res.json();
}

export async function getDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${API_BASE}/documents`);
  return res.json();
}

export async function clearDocuments(): Promise<void> {
  await fetch(`${API_BASE}/documents`, { method: "DELETE" });
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getModels(): Promise<Record<string, ModelOption[]>> {
  const res = await fetch(`${API_BASE}/models`);
  return res.json();
}
