import { useRef, useState } from "react";
import { FileSearch, FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";
import { optimizeDocument, parseDocument, retrieveChunks, waitForDocument } from "../../services/Documents/documentServices";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".docx", ".txt"];

function validateFile(file) {
  if (!file) return "Select a document first";
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) return "Use a PDF, PNG, JPEG, DOCX, or TXT file";
  if (file.size > MAX_BYTES) return "File too large. Maximum size is 20 MB";
  return "";
}

function Metric({ label, value, suffix = "" }) {
  return <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-indigo-950">{value ?? "—"}{suffix}</p></div>;
}

export default function DocumentParser() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [query, setQuery] = useState("");
  const [retrieval, setRetrieval] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [retrieving, setRetrieving] = useState(false);

  function selectFile(candidate) {
    const error = validateFile(candidate);
    if (error) return toast.error(error);
    setFile(candidate);
    setDocument(null);
    setOptimization(null);
    setChunks([]);
    setRetrieval(null);
  }

  async function submit() {
    const error = validateFile(file);
    if (error) return toast.error(error);
    setLoading(true);
    try {
      const queued = await parseDocument(file);
      setDocument(queued);
      toast.info("Document queued for parsing");
      const parsed = await waitForDocument(queued.id);
      setDocument(parsed);
      toast.success(`Parsed ${parsed.pageCount} page${parsed.pageCount === 1 ? "" : "s"}`);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || requestError?.message || "Parsing failed");
    } finally { setLoading(false); }
  }

  async function runOptimization() {
    if (!document?.id) return;
    setOptimizing(true);
    try {
      const result = await optimizeDocument(document.id);
      setOptimization(result.optimization);
      setChunks(result.chunks);
      setRetrieval(null);
      toast.success(`Created ${result.optimization.chunkCount} semantic chunks`);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Optimization failed");
    } finally { setOptimizing(false); }
  }

  async function runRetrieval(event) {
    event.preventDefault();
    if (query.trim().length < 2) return toast.error("Enter a question or topic");
    setRetrieving(true);
    try {
      const result = await retrieveChunks(document.id, query.trim());
      setRetrieval(result);
      if (!result.chunks.length) toast.info("No relevant chunks found");
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Retrieval failed");
    } finally { setRetrieving(false); }
  }

  function clear() {
    setFile(null); setDocument(null); setOptimization(null); setChunks([]); setQuery(""); setRetrieval(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet-500 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Document Parser & Token Optimizer</h1>
        <p className="mt-2 text-indigo-100">Parse documents, remove repetitive content, create semantic chunks, and retrieve only the text relevant to your question.</p>
      </section>

      <section className="mt-6 rounded-xl bg-white p-6 shadow">
        <div className={`rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-indigo-600 bg-indigo-50" : "border-indigo-200"}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}>
          <UploadCloud className="mx-auto text-indigo-700" size={42} />
          <p className="mt-3 font-semibold text-indigo-950">Drop a document here or choose a file</p>
          <p className="mt-1 text-sm text-gray-600">PDF, PNG, JPEG, DOCX, TXT · maximum 20 MB</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded bg-indigo-800 px-4 py-2 text-white hover:bg-indigo-700">Choose file</button>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.docx,.txt" onChange={(event) => selectFile(event.target.files?.[0])} />
        </div>
        {file && <div className="mt-5 flex flex-col gap-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><FileText className="text-indigo-800" /><div><p className="font-medium">{file.name}</p><p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={clear} disabled={loading} aria-label="Clear file" className="rounded border bg-white p-2 text-red-600"><X size={18} /></button>
          <button type="button" onClick={submit} disabled={loading} className="rounded bg-indigo-800 px-5 py-2 text-white disabled:opacity-60">{loading ? "Queued / parsing…" : "Parse document"}</button></div>
        </div>}
      </section>

      {document && <section className="mt-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-4"><Metric label="Pages" value={document.pageCount} /><Metric label="Characters" value={document.characterCount} /><Metric label="OCR used" value={document.usedOcr ? "Yes" : "No"} /><Metric label="Status" value={document.status} /></div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-bold text-violet-950"><Sparkles size={20} /> Token optimization</h2><p className="mt-1 text-sm text-violet-800">Remove repeated content and build meaning-aware chunks.</p></div>
          <button type="button" onClick={runOptimization} disabled={optimizing} className="rounded bg-violet-700 px-5 py-2 text-white disabled:opacity-60">{optimizing ? "Optimizing…" : optimization ? "Re-optimize" : "Optimize tokens"}</button></div>
        </div>

        {optimization && <>
          <div className="grid gap-3 sm:grid-cols-5"><Metric label="Original tokens" value={optimization.originalTokens} /><Metric label="Cleaned tokens" value={optimization.cleanedTokens} /><Metric label="Tokens saved" value={optimization.savedTokens} /><Metric label="Savings" value={optimization.savingsPercentage} suffix="%" /><Metric label="Chunks" value={optimization.chunkCount} /></div>
          <form onSubmit={runRetrieval} className="rounded-xl bg-white p-5 shadow"><h2 className="flex items-center gap-2 text-xl font-bold text-indigo-950"><FileSearch size={20} /> Retrieve relevant chunks</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} placeholder="Example: How does the neural network learn?" className="min-w-0 flex-1 rounded border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none" />
            <button disabled={retrieving} className="rounded bg-indigo-800 px-5 py-2 text-white disabled:opacity-60">{retrieving ? "Searching…" : "Retrieve"}</button></div>
          </form>
          <details className="rounded-xl bg-white p-5 shadow"><summary className="cursor-pointer font-semibold text-indigo-950">View all {chunks.length} semantic chunks</summary><div className="mt-4 space-y-3">{chunks.map((chunk) => <div key={chunk.chunkIndex} className="rounded border p-3"><p className="text-xs font-semibold text-indigo-700">Chunk {chunk.chunkIndex + 1} · pages {chunk.pageNumbers.join(", ")} · {chunk.tokenCount} tokens</p><p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{chunk.text}</p></div>)}</div></details>
        </>}

        {retrieval && <section className="space-y-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5"><h2 className="text-xl font-bold text-emerald-950">Relevant context</h2>
          <div className="grid gap-3 sm:grid-cols-4"><Metric label="Original tokens" value={retrieval.metrics.originalTokens} /><Metric label="Retrieved tokens" value={retrieval.metrics.retrievedTokens} /><Metric label="Tokens saved" value={retrieval.metrics.savedTokens} /><Metric label="Total savings" value={retrieval.metrics.savingsPercentage} suffix="%" /></div>
          {retrieval.chunks.map((chunk) => <article key={chunk.id || chunk.chunkIndex} className="rounded-lg bg-white p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-2 text-xs font-semibold text-emerald-800"><span>Pages {chunk.pageNumbers.join(", ")}</span><span>{chunk.tokenCount} tokens · relevance {chunk.score}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800">{chunk.text}</p></article>)}
        </section>}

        <details className="rounded-xl bg-white p-5 shadow"><summary className="cursor-pointer font-semibold text-indigo-950">View extracted pages</summary><div className="mt-4 space-y-4">{document.pages.map((page) => <article key={page.pageNumber} className="rounded-lg border p-4"><div className="flex justify-between border-b pb-3"><h3 className="font-semibold">Page {page.pageNumber}</h3><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs uppercase text-indigo-800">{page.extractionMethod}</span></div><pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm">{page.text || "No readable text found."}</pre></article>)}</div></details>
      </section>}
    </main>
  );
}
