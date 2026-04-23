import { useState } from "react";
import { HistoryList } from "./components/HistoryList";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { UploadZone } from "./components/UploadZone";

export default function App() {
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [historyKey, setHistoryKey] = useState(0);

  const handleUploaded = (id: string) => {
    setActiveIds((prev) => [id, ...prev]);
  };

  const handleDone = (id: string) => {
    setActiveIds((prev) => prev.filter((x) => x !== id));
    setHistoryKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-none">PDF Summary AI</h1>
            <p className="text-xs text-gray-400 mt-0.5">Upload a PDF and get an AI-generated summary</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Upload section */}
        <section>
          <UploadZone onUploaded={handleUploaded} />
        </section>

        {/* Active processing */}
        {activeIds.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Processing
            </h2>
            <div className="space-y-4">
              {activeIds.map((id) => (
                <ProcessingStatus
                  key={id}
                  id={id}
                  onDone={() => handleDone(id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* History */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Recent Documents
          </h2>
          <HistoryList refreshKey={historyKey} />
        </section>
      </main>
    </div>
  );
}
