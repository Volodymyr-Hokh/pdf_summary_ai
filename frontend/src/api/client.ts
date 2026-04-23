import axios from "axios";
import type { DocumentListResponse, DocumentResponse } from "../types";

const api = axios.create({ baseURL: "/api" });

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<DocumentResponse>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  const { data } = await api.get<DocumentResponse>(`/documents/${id}`);
  return data;
}

export async function listDocuments(): Promise<DocumentListResponse> {
  const { data } = await api.get<DocumentListResponse>("/documents");
  return data;
}
