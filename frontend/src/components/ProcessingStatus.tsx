import { useDocumentStatus } from "../hooks/useDocumentStatus";
import { SummaryCard } from "./SummaryCard";

interface Props {
  id: string;
  onDone: () => void;
}

export function ProcessingStatus({ id, onDone }: Props) {
  const { doc, error } = useDocumentStatus(id);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 text-red-600 text-sm">
        Failed to track document: {error}
      </div>
    );
  }

  if (!doc || doc.status === "pending" || doc.status === "processing") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-8 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="font-medium text-gray-700">
            {!doc || doc.status === "pending" ? "Queued for processing…" : "Analyzing your PDF…"}
          </p>
          {doc?.filename && (
            <p className="text-sm text-gray-400 mt-1 truncate max-w-xs">{doc.filename}</p>
          )}
        </div>
      </div>
    );
  }

  // Completed or failed — notify parent to refresh history
  setTimeout(onDone, 0);
  return <SummaryCard doc={doc} />;
}
