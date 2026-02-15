import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { SourceReference as SourceRef } from "../types";

interface Props {
  sources: SourceRef[];
}

export function SourceReferences({ sources }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());

  if (!sources.length) return null;

  const toggleChunk = (idx: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="sources">
      <button
        className="sources__toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{sources.length} käll{sources.length === 1 ? "a" : "or"} använda</span>
      </button>

      {expanded && (
        <div className="sources__list">
          {sources.map((src, idx) => (
            <div key={idx} className="source-card">
              <button
                className="source-card__header"
                onClick={() => toggleChunk(idx)}
              >
                <FileText size={14} />
                <span className="source-card__file">{src.source}</span>
                {src.section && (
                  <span className="source-card__section">{src.section}</span>
                )}
                <span className="source-card__score">
                  {Math.round(src.score * 100)}%
                </span>
                {expandedChunks.has(idx) ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>

              {expandedChunks.has(idx) && (
                <blockquote className="source-card__text">
                  {src.chunk_text}
                </blockquote>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
