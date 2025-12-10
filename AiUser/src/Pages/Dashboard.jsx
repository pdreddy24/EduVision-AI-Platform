import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, FileText, Clock, UploadCloud } from "lucide-react";
import { getDashDetails } from "../../services/Dash/Dashboard/dashServices";

const DASH_PREFIX = import.meta.env.VITE_DASH_PREFIX;

export default function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// metrics
	const [totalUploads, setTotalUploads] = useState(null);
	const [totalSummaries, setTotalSummaries] = useState(null);
	const [nonTechCount, setNonTechCount] = useState(null);

	// recent uploads / history
	const [recentUploads, setRecentUploads] = useState([]);

	// full history state
	const [history, setHistory] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState(null);
	const [historyLoaded, setHistoryLoaded] = useState(false);

	// summary modal
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [selectedSummary, setSelectedSummary] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		getDashDetails()
			.then((res) => {
				if (!mounted) return;
				// res contains { totalUploads, totalSummaries, history, nonTechCount }
				setTotalUploads(res.totalUploads ?? 0);
				setTotalSummaries(res.totalSummaries ?? 0);
				setNonTechCount(res.nonTechCount ?? 0);

				// keep full history and show top 3 initially
				const fullHistory = Array.isArray(res.history) ? res.history : [];
				setHistory(fullHistory);
				setRecentUploads(fullHistory.slice(0, 3));
			})
			.catch((err) => {
				if (!mounted) return;
				setError(err?.response?.data?.message || err.message || "Failed to load details");
			})
			.finally(() => {
				if (!mounted) return;
				setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const loadMoreRecent = async () => {
		setHistoryError(null);
		setHistoryLoading(true);
		try {
			if (historyLoaded) {
				setHistoryError("No more items to load");
				return;
			}
			// Reveal full history (append remaining items)
			setRecentUploads((prev) => {
				// If already showing full history, do nothing
				if (prev.length >= history.length) return prev;
				return history;
			});
			setHistoryLoaded(true);
		} catch (err) {
			setHistoryError(err?.message || "Failed to load more history");
		} finally {
			setHistoryLoading(false);
		}
	};

	const openSummary = async (item) => {
		// item should have filename, summary, pdfUrl, uploadedAt
		setSelectedItem(item);
		setSelectedSummary(null);
		setSummaryOpen(true);

		// Use summary provided by backend if present
		if (item?.summary) {
			setSelectedSummary(item.summary);
			return;
		}

		// Fallback: show message if no summary available (no network call)
		setSelectedSummary("No summary available.");
	};

	const closeSummary = () => {
		setSummaryOpen(false);
		setSelectedSummary(null);
		setSelectedItem(null);
	};

	const formatDate = (iso) => {
		if (!iso) return "-";
		const d = new Date(iso);
		return d.toLocaleString();
	};

	// ensure PDF links open from API host
	const API_BASE = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");
	const normalizePdfUrl = (url) => {
		if (!url) return null;
		try {
			const parsed = new URL(url);
			const path = parsed.pathname + parsed.search + parsed.hash;
			return `${API_BASE}${path}`;
		} catch (e) {
			if (url.startsWith("/")) return `${API_BASE}${url}`;
			return `${API_BASE}/${url}`;
		}
	};

	// determine whether to show the "Load more" button
	const showLoadMore = history.length !== 3 && history.length > recentUploads.length;

	return (
		<div className="min-h-screen bg-gray-50 ">
			<main className="max-w-5xl mx-auto px-4 py-8">
				<header className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-indigo-900">Dashboard</h1>
				</header>

				{loading && <p className="text-gray-600">Loading details...</p>}
				{!loading && error && <p className="text-red-500">{error}</p>}

				{!loading && !error && (
					<>
						{/* Metrics */}
						<section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
								<div className="p-2 bg-indigo-100 rounded-md">
									<BarChart2 size={20} className="text-indigo-900" />
								</div>
								<div>
									<div className="text-sm text-gray-500">Total files uploaded</div>
									<div className="text-xl font-semibold text-indigo-900">{totalUploads ?? "—"}</div>
									<div className="text-xs text-gray-400">All time</div>
								</div>
							</div>

							<div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
								<div className="p-2 bg-indigo-100 rounded-md">
									<FileText size={20} className="text-indigo-900" />
								</div>
								<div>
									<div className="text-sm text-gray-500">Total summaries generated</div>
									<div className="text-xl font-semibold text-indigo-900">{totalSummaries ?? "—"}</div>
									<div className="text-xs text-gray-400">Completed summarize & image-generation jobs</div>
								</div>
							</div>

							{/* files without summaries */}
							<div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
								<div className="p-2 bg-indigo-100 rounded-md">
									<Clock size={20} className="text-indigo-900" />
								</div>
								<div>
									<div className="text-sm text-gray-500">Non Tech files uploaded</div>
									<div className="text-xl font-semibold text-indigo-900">{nonTechCount ?? "—"}</div>
									<div className="text-xs text-gray-400">Uploads not summarized</div>
								</div>
							</div>
						</section>

						{/* Recent history */}
						<section className="bg-white rounded-lg shadow-sm p-6 mb-6 overflow-x-hidden">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-md font-medium text-indigo-900 flex items-center gap-2">
									<FileText size={16} /> Recent history
								</h3>

								{/* Upload shortcut + Load more */}
								<div className="flex items-center gap-2">
									<Link
										to="/upload"
										className="inline-flex items-center gap-2 bg-indigo-900 text-white px-3 py-1 rounded-md hover:bg-indigo-800 transition"
									>
										<UploadCloud size={16} /> Upload
									</Link>

									{/* desktop/tablet: inline button */}
									{showLoadMore && (
										<button
											onClick={loadMoreRecent}
											disabled={historyLoading}
											className="hidden md:inline-flex items-center gap-2 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-md hover:bg-indigo-50 transition"
										>
											{historyLoading ? "Loading..." : "Load more"}
										</button>
									)}
								</div>
							</div>

							{totalSummaries === 0 ? (
								/* When there are no summaries at all, show an explanatory CTA */
								<div className="text-center py-8">
									<div className="text-lg font-medium text-gray-800 mb-2">No hisory yet</div>
									<div className="text-sm text-gray-600 mb-4">Click the Upload button to summarize tech PDFs and generate images.</div>
								</div>
							) : recentUploads.length === 0 ? (
								<p className="text-gray-600">No recent uploads. Upload a PDF to summarize or generate images.</p>
							) : (
								<>
									{/* Desktop / tablet: table view (no horizontal scroller) */}
									<div className="hidden md:block overflow-x-hidden">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-500">File</th>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Preview</th>
													<th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Uploaded</th>
													<th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Controls</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-100">
												{recentUploads.map((it, idx) => (
													<tr key={it.id ?? `${it.filename}-${idx}`}>
														<td className="px-4 py-3 whitespace-nowrap">
															<div className="text-sm font-medium text-gray-900">{it.filename || "Unnamed.pdf"}</div>
															{it.pdfUrl ? (
																<div className="text-xs text-indigo-700">
																	<a
																		href={normalizePdfUrl(it.pdfUrl)}
																		target="_blank"
																		rel="noreferrer"
																		className="underline"
																	>
																		View PDF
																	</a>
																</div>
															) : null}
														</td>

														<td className="px-4 py-3 whitespace-nowrap text-sm">
															{(() => {
																if (it.summary) {
																	return (
																		<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
																			success
																		</span>
																	);
																}
																return (
																	<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
																		pending
																	</span>
																);
															})()}
														</td>

														<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-[220px]">
															{it.summary ? (
																<span className="text-xs text-gray-600 block max-w-[220px] truncate">
																	{String(it.summary).slice(0, 140)}
																</span>
															) : it.imageUrl ? (
																<img
																	src={normalizePdfUrl(it.imageUrl)}
																	alt="thumb"
																	className="h-12 w-28 object-cover rounded"
																/>
															) : it.videoUrl ? (
																<video
																	src={normalizePdfUrl(it.videoUrl)}
																	className="h-12 w-28 object-cover rounded bg-black"
																	controls={false}
																/>
															) : it.pdfUrl ? (
																<span className="text-xs text-gray-500">PDF available</span>
															) : (
																<span className="text-xs text-gray-500">No preview</span>
															)}
														</td>

														<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(it.uploadedAt)}</td>

														<td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
															{it.summary ? (
																<button
																	onClick={() => openSummary(it)}
																	className="inline-flex items-center gap-2 bg-indigo-900 text-white px-3 py-1 rounded-md hover:bg-indigo-800 transition"
																>
																	View summary
																</button>
															) : (
																<button
																	disabled
																	className="opacity-50 cursor-not-allowed inline-flex items-center gap-2 bg-gray-200 text-gray-600 px-3 py-1 rounded-md"
																>
																	View summary
																</button>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Mobile: stacked compact list */}
									<div className="md:hidden space-y-4">
										{recentUploads.map((it, idx) => (
											<div
												key={it.id ?? `${it.filename}-${idx}`}
												className="bg-white p-3 rounded-md shadow-sm border border-gray-100"
											>
												<div className="flex items-start justify-between">
													<div>
														<div className="text-sm font-medium text-gray-900">{it.filename || "Unnamed.pdf"}</div>
														{it.pdfUrl && (
															<div className="text-xs text-indigo-700">
																<a
																	href={normalizePdfUrl(it.pdfUrl)}
																	target="_blank"
																	rel="noreferrer"
																	className="underline"
																>
																	View PDF
																</a>
															</div>
														)}
														<div className="text-xs text-gray-500 mt-1">{formatDate(it.uploadedAt)}</div>

														{/* mobile inline preview */}
														{!it.summary && it.imageUrl && (
															<div className="mt-2">
																<img src={normalizePdfUrl(it.imageUrl)} alt="thumb" className="w-full max-h-36 object-cover rounded" />
															</div>
														)}
														{!it.summary && it.videoUrl && (
															<div className="mt-2">
																<video src={normalizePdfUrl(it.videoUrl)} controls className="w-full max-h-36 rounded object-cover" />
															</div>
														)}
													</div>

													<div className="text-right space-y-2">
														<div>
															{it.summary ? (
																<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
																	success
																</span>
															) : (
																<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
																	pending
																</span>
															)}
														</div>

														<div>
															{it.summary ? (
																<button
																	onClick={() => openSummary(it)}
																	className="inline-flex items-center gap-2 bg-indigo-900 text-white px-3 py-1 text-xs rounded-md hover:bg-indigo-800 transition"
																>
																	View summary
																</button>
															) : (
																<button
																	disabled
																	className="opacity-50 cursor-not-allowed inline-flex items-center gap-2 bg-gray-200 text-gray-600 px-3 py-1 text-xs rounded-md"
																>
																	View summary
																</button>
															)}
														</div>
													</div>
												</div>

												{it.summary && (
													<div className="mt-2 text-xs text-gray-600 truncate">{String(it.summary).slice(0, 160)}</div>
												)}
											</div>
										))}
									</div>

									{/* mobile: full-width Load more button*/}
									{showLoadMore && (
										<div className="md:hidden mt-4">
											<button
												onClick={loadMoreRecent}
												disabled={historyLoading}
												className="w-full inline-flex justify-center items-center gap-2 border border-indigo-200 text-indigo-900 px-4 py-2 rounded-md hover:bg-indigo-50 transition"
											>
												{historyLoading ? "Loading..." : "Load more"}
											</button>
										</div>
									)}
								</>
							)}
						</section>
					</>
				)}
			</main>

			{/* Summary modal */}
			{summaryOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
						<div className="flex items-center justify-between p-4 border-b">
							<div>
								<div className="text-sm font-medium text-gray-700">{selectedItem?.filename}</div>
								<div className="text-xs text-gray-500">{formatDate(selectedItem?.uploadedAt)}</div>
							</div>
						</div>

						<div className="p-4 max-h-[60vh] overflow-auto">
							{summaryLoading ? (
								<p className="text-gray-600">Loading summary...</p>
							) : (
								<>
									{/* media (image/video) */}
									{selectedItem?.imageUrl && (
										<img src={normalizePdfUrl(selectedItem.imageUrl)} alt="generated" className="w-full mb-4 rounded object-contain" />
									)}
									{selectedItem?.videoUrl && (
										<video src={normalizePdfUrl(selectedItem.videoUrl)} controls className="w-full mb-4 rounded object-contain" />
									)}

									<pre className="whitespace-pre-wrap text-sm text-gray-800">{selectedSummary ?? "No summary available."}</pre>
								</>
							)}
						</div>

						<div className="p-4 border-t text-right">
							<button onClick={closeSummary} className="px-4 py-2 bg-gray-100 rounded-md mr-2">
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}