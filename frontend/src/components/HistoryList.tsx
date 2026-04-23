import { useEffect, useState } from "react";
import { listDocuments } from "../api/client";
import type { DocumentResponse } from "../types";
import { SummaryCard } from "./SummaryCard";

interface Props {
  refreshKey: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

export function HistoryList({ refreshKey }: Props) {
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listDocuments()
      .then((res) => setDocs(res.documents))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load history")
      )
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center">{error}</p>;
  }

  if (docs.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">
        No documents processed yet. Upload a PDF to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {docs.map((doc) => (
        <SummaryCard key={doc.id} doc={doc} compact />
      ))}
    </div>
  );
}
