import { useRef, useState } from 'react';
import { UploadCloud, FileText, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { summarizePdf } from '../../services/Summarizer/Summarize/summarizeServices';

//  Tracking imports
import { 
  trackFileUpload,
  trackUserError,
  trackConversionStart,
  trackConversionEnd,
  trackModelLatency,
  trackResourceUsed
} from "../tracking/tracking";

export default function UploadPage() {
  const fileInputRef = useRef(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const [videoBase64, setVideoBase64] = useState(null);

  function openPicker() {
    setError('');
    fileInputRef.current?.click();
  }

  function validatePdf(file) {
    if (!file) return 'No file';
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are allowed';
    }
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) return 'File too large (max 10MB)';
    return '';
  }

  //  Manual file upload tracking
  function handleFile(e) {
    const f = e?.target?.files?.[0];
    if (!f) return;

    const v = validatePdf(f);
    if (v) {
      trackUserError("INVALID_FILE", v);
      setError(v);
      toast.error(v);
      return;
    }

    // ✨ Track successful PDF upload
    trackFileUpload(f);

    setError('');
    setFileMeta({ name: f.name, size: f.size });
    setSelectedFile(f);
    setSummary('');
  }

  //  Drag & Drop tracking
  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;

    const v = validatePdf(f);
    if (v) {
      trackUserError("INVALID_FILE", v);
      setError(v);
      toast.error(v);
      return;
    }

    //  Track PDF Upload
    trackFileUpload(f);

    setError('');
    setFileMeta({ name: f.name, size: f.size });
    setSelectedFile(f);
    setSummary('');
  }

  //  Upload & Conversion tracking
  async function uploadToServer() {
    if (!selectedFile) {
      trackUserError("NO_FILE_SELECTED", "User clicked summarize without selecting a file");
      toast.error('Select a PDF first');
      return;
    }

    const startTime = Date.now();
    trackConversionStart("pdf", "summary_image_video");

    setLoading(true);
    setError('');
    setSummary('');
    setImageBase64(null);
    setVideoBase64(null);

    try {
      const data = await summarizePdf(selectedFile);

      // Handle classifier output tracking
      if (data?.message) {
        let cls = data.classifierOutput;
        try {
          if (typeof cls === 'string' && cls.trim()) cls = JSON.parse(cls);
        } catch {}

        toast.info(data.message);

        if (cls?.isTechnical === false) {
          setError(data.message);
          trackUserError("NON_TECHNICAL_PDF", data.message);
          return;
        }
      }

      if (data?.error) {
        const errMsg = typeof data.error === 'string'
          ? data.error
          : data.error?.message ?? JSON.stringify(data.error);

        setError(errMsg);
        toast.error('Upload failed. Please try again.');
        trackUserError("UPLOAD_FAILED", errMsg);
      } else {
        // ✨ Success events — track conversion end
        trackConversionEnd("pdf", "summary_image_video", startTime);

        // Optional hooks (backend must send these)
        if (data?.modelLatencyMs) {
          trackModelLatency("pdf_summarizer", data.modelLatencyMs);
        }

        if (data?.resourceUsage) {
          trackResourceUsed(data.resourceUsage);
        }

        // prefer base64 fields returned by backend
        if (data?.summary) setSummary(data.summary);
        if (data?.imageBase64) setImageBase64(data.imageBase64);
        if (data?.videoBase64) setVideoBase64(data.videoBase64);

        if (!data?.summary && !data?.imageBase64 && !data?.videoBase64) {
          toast.info('No summary, image, or video returned.');
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err?.message ?? 'Upload failed';

      //  Track Error
      trackUserError("UPLOAD_EXCEPTION", msg);

      setError(msg);
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setFileMeta(null);
    setSelectedFile(null);
    setSummary('');
    setError('');
    setImageBase64(null);
    setVideoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function reloadPage() {
    window.location.reload();
  }

  // ===========================================================
  // UI (unchanged)
  // ===========================================================

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="rounded-xl overflow-hidden mb-6 shadow-lg">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Get your PDFs summarized and media generated (images & videos)
              </h1>
              <p className="mt-1 text-indigo-100">
                Upload technical PDFs and receive concise summaries + generated images + videos.
              </p>
            </div>

            <button
              onClick={reloadPage}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full w-full sm:w-auto justify-center"
            >
              <RefreshCw size={16} className="opacity-90" /> Reload
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6">
          
          {(imageBase64 || summary || videoBase64) && (
            <div className="flex flex-col">
              {/* Generated Video */}
              {videoBase64 && (
                <div className="rounded-lg p-4 sm:p-5 bg-white border border-indigo-100 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-900">Generated Video</h3>
                  <div className="mt-3 flex flex-col items-center justify-center gap-3">
                    <video src={videoBase64} controls className="w-full max-h-80 rounded object-contain" />
                  </div>
                </div>
              )}

              {/* Generated Image */}
              {imageBase64 && (
                <div className="rounded-lg p-4 sm:p-5 bg-gradient-to-b from-white to-indigo-50 border border-indigo-100 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-900">Generated Image</h3>
                  <div className="mt-3 flex flex-col items-center justify-center gap-3">
                    <img src={imageBase64} alt="Generated" className="w-full max-h-64 object-contain rounded" />
                  </div>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="rounded-lg p-4 sm:p-5 bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 max-h-96 overflow-auto">
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-900">Summary</h3>
                  <p className="mt-3 text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Upload Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-lg p-4 sm:p-6 border-2 transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-dashed border-indigo-200 bg-gradient-to-b from-white to-indigo-50'
            }`}
          >
            <div onClick={openPicker} className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white shadow-md flex items-center justify-center">
                <UploadCloud size={34} className="text-indigo-700" />
              </div>

              <p className="mt-2 text-base sm:text-lg font-semibold text-indigo-900 text-center">
                Drop your PDF here or click to select
              </p>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                Technical/terms PDFs recommended. Max 10MB. Only PDFs are allowed.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {fileMeta && (
              <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-800" />
                    <div>
                      <div className="font-medium text-indigo-900">{fileMeta.name}</div>
                      <div className="text-sm text-indigo-700">{(fileMeta.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded bg-white text-indigo-900 border shadow-sm text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {loading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
                        <div className="text-sm text-indigo-800">{loading ? 'Uploading...' : 'Processing...'}</div>
                      </div>
                      <div className="w-full bg-indigo-100 h-2 rounded overflow-hidden mt-2">
                        <div className="h-2 bg-indigo-600/80 animate-[progress_2s_linear_infinite]" style={{ width: '60%' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={uploadToServer}
                    disabled={!selectedFile || loading}
                    className="w-full sm:flex-1 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text:white rounded font-medium disabled:opacity-60"
                  >
                    {loading ? 'Uploading...' : 'Summarize & Generate'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
