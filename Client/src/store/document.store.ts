// src/store/document.store.ts
import axios, { AxiosError } from "axios";
import { create } from "zustand";
import {
  documentApi,
  type CreateDocumentDto,
  type DocumentType,
  type UpdateDocDto,
} from "../api/document.api";

// error extractor
const extractError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const res = (err as AxiosError)?.response;
    const data = res?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(",");
    if (typeof data?.message === "string") return data.message;
    return "request failed.";
  }
  return "Unknown or network error.";
};

// store types
interface DocumentStore {
  list: DocumentType[];
  current: DocumentType | null;
  isLoading: boolean;
  error: string | null;

  fetchAll: (workspaceId: string) => Promise<void>;
  fetchOne: (workspaceId: string, documentId: string) => Promise<void>;
  create: (
    workspaceId: string,
    data: CreateDocumentDto
  ) => Promise<DocumentType | null>;
  update: (
    workspaceId: string,
    documentId: string,
    data: UpdateDocDto
  ) => Promise<DocumentType | null>;
  remove: (workspaceId: string, documentId: string) => Promise<boolean>;
  clearCurrent: () => void;
}

// store
export const useDocumentStore = create<DocumentStore>((set) => ({
  list: [],
  current: null,
  isLoading: false,
  error: null,

  fetchAll: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const docs = await documentApi.fetchALL(workspaceId);
      set({ list: docs, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  fetchOne: async (workspaceId, documentId) => {
    set({ isLoading: true, error: null });
    try {
      const doc = await documentApi.getOneDoc(workspaceId, documentId);
      set({ current: doc, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  create: async (workspaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const created = await documentApi.createDoc(workspaceId, data);
      set((s) => ({
        list: [created, ...s.list],
        current: created,
        isLoading: false,
      }));
      return created;
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
      return null;
    }
  },

  update: async (workspaceId, documentId, data) => {
    set({ isLoading: true, error: null });
    try {
      // fixed argument order: (workspaceId, documentId, payload)
      const updated = await documentApi.updateDoc(
        workspaceId,
        documentId,
        data
      );
      set((s) => ({
        list: s.list.map((doc) => (doc.id === updated.id ? updated : doc)),
        current: s.current && s.current.id === updated.id ? updated : s.current,
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
      return null;
    }
  },

  remove: async (workspaceId, documentId) => {
    set({ isLoading: true, error: null });
    try {
      await documentApi.deleteDoc(workspaceId, documentId);
      set((s) => ({
        list: s.list.filter((d) => d.id !== documentId),
        current: s.current && s.current.id === documentId ? null : s.current,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
      return false;
    }
  },

  clearCurrent: () => {
    set({ current: null });
  },
}));
