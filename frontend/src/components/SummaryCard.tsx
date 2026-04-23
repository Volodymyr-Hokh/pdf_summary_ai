import ReactMarkdown from "react-markdown";
import type { DocumentResponse } from "../types";

interface Props {
  doc: DocumentResponse;
  compact?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function SummaryCard({ doc, compact = false }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{doc.filename}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(doc.created_at)}
            {doc.page_count != null && ` · ${doc.page_count} pages`}
            {` · ${formatBytes(doc.file_size_bytes)}`}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
            ${doc.status === "completed" ? "bg-green-100 text-green-700" : ""}
            ${doc.status === "failed" ? "bg-red-100 text-red-700" : ""}
            ${doc.status === "processing" ? "bg-yellow-100 text-yellow-700" : ""}
            ${doc.status === "pending" ? "bg-gray-100 text-gray-500" : ""}
          `}>
            {doc.status}
          </span>
        </div>
      </div>

      {/* Summary body */}
      {doc.summary && (
        <div className={`px-6 py-5 ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
          <div className="prose prose-sm prose-gray max-w-none">
            <ReactMarkdown>{doc.summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {doc.status === "failed" && doc.error_message && (
        <div className="px-6 py-4 bg-red-50">
          <p className="text-sm text-red-600">{doc.error_message}</p>
        </div>
      )}

      {/* Footer metadata */}
      {doc.status === "completed" && doc.processing_time_seconds != null && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-400">
          {doc.model_used && <span>Model: {doc.model_used}</span>}
          <span>Processed in {doc.processing_time_seconds}s</span>
        </div>
      )}
    </div>
  );
}
