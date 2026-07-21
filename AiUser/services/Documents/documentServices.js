import summarizeAxios from "../Summarizer/summarizeAxios";

export async function parseDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await summarizeAxios.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.document;
}
export async function listDocuments() {
  const response = await summarizeAxios.get("/documents");
  return response.data.documents;
}
export async function getDocument(id) {
  const response = await summarizeAxios.get(`/documents/${id}`);
  return response.data.document;
}
export async function waitForDocument(id, { intervalMs = 1000, timeoutMs = 180000 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const document = await getDocument(id);
    if (document.status === "completed") return document;
    if (document.status === "failed") throw new Error(document.errorMessage || "Document parsing failed");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Document parsing is still running. Check it again from Document Q&A shortly.");
}
export async function optimizeDocument(id) {
  const response = await summarizeAxios.post(`/documents/${id}/optimize`);
  return response.data;
}
export async function retrieveChunks(id, query, topK = 5) {
  const response = await summarizeAxios.post(`/documents/${id}/retrieve`, { query, topK });
  return response.data;
}
export async function askDocumentQuestion(id, question, conversationId) {
  const response = await summarizeAxios.post(`/documents/${id}/questions`, { question, conversationId: conversationId || undefined });
  return response.data;
}
export async function listDocumentConversations(id) {
  const response = await summarizeAxios.get(`/documents/${id}/conversations`);
  return response.data.conversations;
}
export async function getConversation(id) {
  const response = await summarizeAxios.get(`/conversations/${id}`);
  return response.data.conversation;
}
