import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

interface CreateDocumentDto {
  userId: string;
  role: string;
}
interface DocumentType {
  title: string;
  content: string;
}
interface update_doc_Dto {
  tile?: string;
  content?: string;
}

export const documentApi = {
  //create...
  createDoc: async (
    workspaceId: string,
    payload: CreateDocumentDto
  ): Promise<DocumentType> => {
    const res = await api.post(`/workspace/${workspaceId}/document`, payload);
    return res.data;
  },

  //get one document...
  getOneDoc: async (
    workspaceId: string,
    documentId: string
  ): Promise<DocumentType> => {
    const res = await api.get(
      `workspace/${workspaceId}/document/${documentId}`
    );
    return res.data;
  },

  //find all docs...
  //   fetchALL: async () => {},

  //update doc...
  updateDoc: async (
    payload: update_doc_Dto,
    workspaceId: string,
    documentId: string
  ): Promise<DocumentType> => {
    const res = await api.patch(
      `workspace/${workspaceId}/document/${documentId}`,
      payload
    );
    return res.data;
  },

  //delete doc...
  deleteDoc: async (
    workspaceId: string,
    documentId: string
  ): Promise<{ message: string }> => {
    const res = await api.delete(
      `workspace/${workspaceId}/document/${documentId}`
    );

    return res.data;
  },
};
