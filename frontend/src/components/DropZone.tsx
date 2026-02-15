import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadDocument } from "../api/client";
import type { DocumentInfo } from "../types";

interface Props {
  chunkSize: number;
  chunkOverlap: number;
  onUpload: (doc: DocumentInfo) => void;
}

export function DropZone({ chunkSize, chunkOverlap, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setUploadStatus(null);

      try {
        const doc = await uploadDocument(file, chunkSize, chunkOverlap);
        setUploadStatus({
          type: "success",
          message: `"${doc.filename}" uppladdad! ${doc.num_chunks} textsegment, ${doc.num_tables} tabellposter, ${doc.num_paragraphs} stycken.`,
        });
        onUpload(doc);
      } catch (err) {
        setUploadStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Uppladdning misslyckades",
        });
      } finally {
        setUploading(false);
      }
    },
    [chunkSize, chunkOverlap, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="drop-zone-container">
      <div
        {...getRootProps()}
        className={`drop-zone ${isDragActive ? "drop-zone--active" : ""} ${uploading ? "drop-zone--disabled" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="drop-zone__content">
            <Loader2 className="drop-zone__icon spinning" size={40} />
            <p>Bearbetar dokument...</p>
            <span className="drop-zone__sub">Extraherar text, skapar embeddings</span>
          </div>
        ) : isDragActive ? (
          <div className="drop-zone__content">
            <Upload className="drop-zone__icon" size={40} />
            <p>Släpp dokumentet här!</p>
          </div>
        ) : (
          <div className="drop-zone__content">
            <FileText className="drop-zone__icon" size={40} />
            <p>Dra och släpp en .docx-fil här</p>
            <span className="drop-zone__sub">eller klicka för att välja fil</span>
          </div>
        )}
      </div>

      {uploadStatus && (
        <div className={`upload-status upload-status--${uploadStatus.type}`}>
          {uploadStatus.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
}
