import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { summarizePdfPublic } from '../../services/Summarizer/Summarize/summarizePublicService';
import { Link, useNavigate } from 'react-router-dom';

export default function UploadPublic() {
	const fileInputRef = useRef(null);
	const [fileMeta, setFileMeta] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState('');
	const [error, setError] = useState('');
	const [dragActive, setDragActive] = useState(false);
	const [imageBase64, setImageBase64] = useState(null);
	const [videoBase64, setVideoBase64] = useState(null);
	const navigate = useNavigate();

	const [freeTrials, setFreeTrials] = useState(() => {
		const v = parseInt(localStorage.getItem('free_trials'), 10);
		if (Number.isFinite(v) && !Number.isNaN(v)) return v;
		localStorage.setItem('free_trials', '5');
		return 5;
	});

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

	function handleFile(e) {
		const f = e?.target?.files?.[0];
		if (!f) return;
		const v = validatePdf(f);
		if (v) {
			setError(v);
			toast.error(v);
			return;
		}
		setError('');
		setFileMeta({ name: f.name, size: f.size });
		setSelectedFile(f);
		setSummary('');
	}

	async function uploadToServer() {
		if (!selectedFile) {
			toast.error('Select a PDF first');
			return;
		}

		if (freeTrials <= 0) {
			toast.info('Free trials exhausted. Sign up or log in for unlimited uploads and stored summaries.');
			navigate('/signup');
			return;
		}

		// decrement trial immediately and persist
		const next = Math.max(0, freeTrials - 1);
		setFreeTrials(next);
		localStorage.setItem('free_trials', String(next));
		toast.info(`Free trials remaining: ${next}`);

		setLoading(true);
		setSummary('');
		setError('');
		setImageBase64(null);
		setVideoBase64(null);

		try {
			const data = await summarizePdfPublic(selectedFile);

			// If backend returned a user-facing message (e.g. classifier result), show it.
			if (data?.message) {
				// attempt to parse classifierOutput if provided as JSON string
				let cls = data.classifierOutput;
				try {
					if (typeof cls === 'string' && cls.trim()) cls = JSON.parse(cls);
				} catch {}

				// show message to user (informational)
				toast.info(data.message);

				// if classifier explicitly marks the PDF as non-technical, display the message in the UI
				if (cls?.isTechnical === false) {
					setError(data.message);
					// stop further processing (no summary expected)
					return;
				}
			}

			if (data?.error) {
				const errMsg = typeof data.error === 'string' ? data.error : data.error?.message ?? JSON.stringify(data.error);
				setError(errMsg);
				toast.error('Upload failed. Please try again.');
			}

			if (data?.summary) setSummary(data.summary);
			if (data?.imageBase64) setImageBase64(data.imageBase64);
			if (data?.videoBase64) setVideoBase64(data.videoBase64);

			if (!data?.summary && !data?.imageBase64 && !data?.videoBase64) {
				toast.info('No summary returned from server.');
			}
		} catch (e) {
			console.error(e);
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

	async function downloadImage() {
		try {
			const src = imageBase64;
			if (!src) {
				toast.error('No image available to download');
				return;
			}
			const resp = await fetch(src);
			if (!resp.ok) throw new Error('Failed to download');
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const baseName = (fileMeta?.name ?? 'summary').replace(/\.[^/.]+$/, '');
			const a = document.createElement('a');
			a.href = url;
			a.download = `${baseName}_image.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1500);
		} catch (e) {
			console.error(e);
			toast.error('Failed to download image');
		}
	}

	async function downloadVideo() {
		try {
			const src = videoBase64;
			if (!src) {
				toast.error('No video available to download');
				return;
			}
			const resp = await fetch(src);
			if (!resp.ok) throw new Error('Failed to download');
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const baseName = (fileMeta?.name ?? 'summary').replace(/\.[^/.]+$/, '');
			const a = document.createElement('a');
			a.href = url;
			a.download = `${baseName}_video.mp4`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1500);
		} catch (e) {
			console.error(e);
			toast.error('Failed to download video');
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 py-6">
			<div className="max-w-5xl mx-auto px-4">
				<header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
					<div>
						<h1 className="text-lg sm:text-2xl font-bold text-indigo-900">Get your PDFs summarized — images & videos included (Free Trial)</h1>
						<div className="mt-1 flex items-center gap-3">
							<p className="text-xs sm:text-sm text-gray-600">Try up to 5 PDFs without an account. Summaries + generated images + videos. Sign up for history and unlimited uploads.</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<div className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 font-medium text-xs">Free: {freeTrials}</div>
						{/* visible on all sizes, compact on mobile */}
						<Link
							to="/signup"
							className="inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1 bg-indigo-900 text-white rounded text-xs sm:text-sm hover:bg-indigo-800"
						>
							Sign up
						</Link>
						<Link
							to="/login"
							className="inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1 border rounded text-indigo-900 bg-white text-xs sm:text-sm hover:bg-indigo-50"
						>
							Login
						</Link>
					</div>
				</header>

				{/* column layout: upload then results (no side-by-side) */}
				<div className="grid grid-cols-1 gap-6">
					{/* upload area */}
					<div>
						<div
							onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
							onDragLeave={() => setDragActive(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDragActive(false);
								const f = e.dataTransfer?.files?.[0];
								if (!f) return;
								const v = validatePdf(f);
								if (v) { setError(v); toast.error(v); return; }
								setFileMeta({ name: f.name, size: f.size });
								setSelectedFile(f);
								setSummary('');
							}}
							className={`w-full rounded-lg p-6 transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50 border' : 'border-dashed border-gray-200 bg-white'}`}
						>
							<div onClick={openPicker} className="flex flex-col items-center justify-center gap-4 cursor-pointer">
								<div className="w-20 h-20 rounded-lg bg-indigo-50 flex items-center justify-center">
									<UploadCloud size={36} className="text-indigo-700" />
								</div>
								<div className="text-center">
									<p className="font-semibold text-indigo-900">Drag & drop a PDF</p>
									<p className="text-xs text-gray-500 mt-1">Or click to browse — technical PDFs work best. Max 10MB.</p>
								</div>
								<input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
							</div>

							{fileMeta && (
								<div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div className="flex items-center gap-3 w-full sm:w-auto">
											<FileText size={18} className="text-indigo-800" />
											<div className="min-w-0">
												<div className="text-sm font-medium text-indigo-900 truncate max-w-xs" title={fileMeta.name}>{fileMeta.name}</div>
												<div className="text-xs text-indigo-700">{(fileMeta.size / 1024).toFixed(1)} KB</div>
											</div>
										</div>

										{/* horizontal controls: Replace grows, X stays compact */}
										<div className="flex items-center gap-2 w-full sm:w-auto">
											<button
												onClick={() => fileInputRef.current?.click()}
												className="flex-1 px-3 py-2 bg-white border rounded text-indigo-900 text-sm"
											>
												Replace
											</button>

											<button
												onClick={clearAll}
												className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border text-red-600 flex-shrink-0"
												aria-label="Clear selected file"
												title="Clear"
											>
												<X size={16} />
											</button>
										</div>
									</div>

									<div className="mt-4 flex flex-col sm:flex-row gap-2">
										<button
											onClick={uploadToServer}
											disabled={!selectedFile || loading}
											className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-900 text-white rounded disabled:opacity-60 justify-center"
										>
											{loading ? 'Uploading...' : 'Summarize & Generate (trial)'}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* results / image panel (stacked below upload) */}
					<aside className="space-y-4">
						<div className="bg-white rounded-lg p-4 shadow-sm">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium text-indigo-900">Result</h3>
								{loading && <div className="text-xs text-gray-500">Processing…</div>}
							</div>

							{error && <div className="mt-3 text-xs text-red-500">{error}</div>}

							{summary ? (
								<pre className="mt-3 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">{summary}</pre>
							) : (
								<div className="mt-3 text-xs text-gray-500">Summary will appear here after upload.</div>
							)}
						</div>

						{imageBase64 && (
							<div className="bg-white rounded-lg p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="text-sm font-medium text-indigo-900">Generated image</h4>
									</div>
									<button onClick={downloadImage} className="px-2 py-1 border rounded bg-white text-indigo-900 inline-flex items-center gap-2 hover:bg-indigo-50">
										<Download size={14} /> Download
									</button>
								</div>
								<div className="mt-3">
									<img
										src={imageBase64}
										alt="generated"
										className="w-full max-h-48 sm:max-h-60 rounded object-contain mx-auto"
									/>
								</div>
							</div>
						)}

						{videoBase64 && (
							<div className="bg-white rounded-lg p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="text-sm font-medium text-indigo-900">Generated video</h4>
									</div>
									<button onClick={downloadVideo} className="px-2 py-1 border rounded bg-white text-indigo-900 inline-flex items-center gap-2 hover:bg-indigo-50">
										<Download size={14} /> Download
									</button>
								</div>
								<div className="mt-3">
									<video src={videoBase64} controls className="w-full max-h-48 sm:max-h-60 rounded object-contain mx-auto" />
								</div>
							</div>
						)}
					</aside>
				</div>
			</div>
		</div>
	);
}
