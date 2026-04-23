export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentResponse {
  id: string;
  filename: string;
  file_size_bytes: number;
  page_count: number | null;
  status: DocumentStatus;
  error_message: string | null;
  summary: string | null;
  model_used: string | null;
  processing_time_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
}
