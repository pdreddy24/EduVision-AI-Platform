import { useEffect, useRef, useState } from "react";
import { BookOpen, Bot, MessageSquarePlus, Send, ShieldCheck, User } from "lucide-react";
import { toast } from "react-toastify";
import { askDocumentQuestion, getConversation, listDocumentConversations, listDocuments, optimizeDocument } from "../../services/Documents/documentServices";

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function DocumentQA() {
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [openCitation, setOpenCitation] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    listDocuments().then((items) => {
      setDocuments(items);
      if (items[0]?.id) setDocumentId(String(items[0].id));
    }).catch((error) => toast.error(errorMessage(error, "Could not load documents")));
  }, []);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    if (!documentId) return;
    listDocumentConversations(documentId).then(setConversations).catch(() => setConversations([]));
  }, [documentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function selectConversation(id) {
    try {
      const conversation = await getConversation(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
    } catch (error) { toast.error(errorMessage(error, "Could not load conversation")); }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setQuestion("");
  }

  async function optimizeSelected() {
    if (!documentId) return;
    setOptimizing(true);
    try {
      const result = await optimizeDocument(documentId);
      toast.success(`Ready for Q&A: ${result.optimization.chunkCount} chunks`);
    } catch (error) { toast.error(errorMessage(error, "Optimization failed")); }
    finally { setOptimizing(false); }
  }

  async function ask(event) {
    event.preventDefault();
    const value = question.trim();
    if (!documentId) return toast.error("Select a document");
    if (value.length < 2) return toast.error("Enter a question");
    setQuestion("");
    setMessages((current) => [...current, { _id: `pending-user-${Date.now()}`, role: "user", content: value, citations: [] }]);
    setLoading(true);
    try {
      const result = await askDocumentQuestion(documentId, value, conversationId);
      setConversationId(result.conversation.id);
      setMessages(result.conversation.messages || []);
      setConversations(await listDocumentConversations(documentId));
    } catch (error) {
      setMessages((current) => current.filter((message) => !String(message._id).startsWith("pending-user-")));
      toast.error(errorMessage(error, "Question failed"));
    } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-xl bg-gradient-to-r from-indigo-800 to-cyan-600 p-6 text-white shadow-lg">
        <h1 className="flex items-center gap-3 text-3xl font-bold"><BookOpen /> Ask Your Documents</h1>
        <p className="mt-2 text-indigo-100">RAG answers grounded in retrieved document text, with validated page citations.</p>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow">
            <label className="text-sm font-semibold text-gray-700" htmlFor="qa-document">Document</label>
            <select id="qa-document" value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="mt-2 w-full rounded border px-3 py-2">
              {!documents.length && <option value="">No parsed documents</option>}
              {documents.map((document) => <option key={document.id} value={document.id}>{document.originalName}</option>)}
            </select>
            <button onClick={optimizeSelected} disabled={!documentId || optimizing} className="mt-3 w-full rounded bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{optimizing ? "Preparing…" : "Prepare for Q&A"}</button>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <button onClick={newConversation} className="flex w-full items-center justify-center gap-2 rounded border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800"><MessageSquarePlus size={17} /> New conversation</button>
            <h2 className="mt-4 text-sm font-semibold text-gray-600">History</h2>
            <div className="mt-2 space-y-2">
              {conversations.map((conversation) => <button key={conversation.id} onClick={() => selectConversation(conversation.id)} className={`w-full rounded p-3 text-left text-sm ${String(conversationId) === String(conversation.id) ? "bg-indigo-100 text-indigo-950" : "bg-gray-50 hover:bg-gray-100"}`}><span className="block truncate font-medium">{conversation.title}</span><span className="text-xs text-gray-500">{conversation.messageCount} messages</span></button>)}
              {!conversations.length && <p className="py-3 text-sm text-gray-500">No conversations yet.</p>}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[650px] flex-col rounded-xl bg-white shadow">
          <div className="flex items-center gap-2 border-b px-5 py-4 text-sm text-emerald-700"><ShieldCheck size={18} /><span>Answers use retrieved context only. Citations are checked against supplied pages.</span></div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {!messages.length && <div className="mx-auto mt-20 max-w-lg text-center"><Bot className="mx-auto text-indigo-500" size={48} /><h2 className="mt-4 text-xl font-bold text-indigo-950">Ask a grounded question</h2><p className="mt-2 text-gray-600">Select a parsed document, prepare it for Q&A, then ask about its content.</p></div>}
            {messages.map((message) => <div key={message._id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <div className="mt-1 rounded-full bg-indigo-100 p-2 text-indigo-700"><Bot size={18} /></div>}
              <div className={`max-w-3xl rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-900"}`}>
                <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                {message.citations?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{message.citations.map((citation, index) => <button key={`${citation.sourceId}-${index}`} onClick={() => setOpenCitation(citation)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow">Pages {citation.pageNumbers.join(", ")}</button>)}</div>}
              </div>
              {message.role === "user" && <div className="mt-1 rounded-full bg-indigo-700 p-2 text-white"><User size={18} /></div>}
            </div>)}
            {loading && <div className="flex items-center gap-3 text-gray-500"><div className="h-3 w-3 animate-pulse rounded-full bg-indigo-600" />Retrieving context and generating a grounded answer…</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={ask} className="flex gap-2 border-t p-4">
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} rows={2} placeholder="Ask a question about the selected document…" className="min-w-0 flex-1 resize-none rounded-lg border px-4 py-3 focus:border-indigo-500 focus:outline-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(event); } }} />
            <button disabled={loading || !documentId} className="self-end rounded-lg bg-indigo-700 p-3 text-white disabled:opacity-50" aria-label="Ask question"><Send /></button>
          </form>
        </section>
      </div>

      {openCitation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenCitation(null)}><div className="max-w-xl rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-bold text-indigo-950">Citation · pages {openCitation.pageNumbers.join(", ")}</h2><p className="mt-3 whitespace-pre-wrap text-gray-700">{openCitation.quote || "The cited source supports this answer."}</p><button onClick={() => setOpenCitation(null)} className="mt-5 rounded bg-indigo-700 px-4 py-2 text-white">Close</button></div></div>}
    </main>
  );
}
