import { api } from "../lib/api";

export interface CreateDocumentDto {
  title: string;
  content: string;
}

export interface DocumentType {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface UpdateDocDto {
  title?: string;
  content?: string;
}

export const documentApi = {
  createDoc: async (
    workspaceId: string,
    payload: CreateDocumentDto
  ): Promise<DocumentType> => {
    const res = await api.post(`/workspace/${workspaceId}/document`, payload);
    return res.data;
  },

  getOneDoc: async (
    workspaceId: string,
    documentId: string
  ): Promise<DocumentType> => {
    const res = await api.get(
      `/workspace/${workspaceId}/document/${documentId}`
    );
    return res.data;
  },

  fetchAll: async (workspaceId: string): Promise<DocumentType[]> => {
    const res = await api.get(`/workspace/${workspaceId}/document`);
    return res.data;
  },

  updateDoc: async (
    workspaceId: string,
    documentId: string,
    payload: UpdateDocDto
  ): Promise<DocumentType> => {
    const res = await api.patch(
      `/workspace/${workspaceId}/document/${documentId}`,
      payload
    );
    return res.data;
  },

  deleteDoc: async (
    workspaceId: string,
    documentId: string
  ): Promise<{ message: string }> => {
    const res = await api.delete(
      `/workspace/${workspaceId}/document/${documentId}`
    );
    return res.data;
  },
};
