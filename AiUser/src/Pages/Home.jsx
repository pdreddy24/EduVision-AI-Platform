import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, User } from 'lucide-react';

export default function Home() {
	const navigate = useNavigate();
	const token = localStorage.getItem('access_token');

	function startTrial() {
		if (token) {
			navigate('/dashboard');
			return;
		}
		// initialize free trials if missing
		const v = parseInt(localStorage.getItem('free_trials'), 10);
		if (Number.isNaN(v)) localStorage.setItem('free_trials', '5');
		navigate('/trial');
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<main className="max-w-6xl mx-auto px-4 py-12">
				{/* hero */}
				<section className="bg-white rounded-2xl shadow-md p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
					<div>
						<h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 leading-tight">
							Get your PDFs summarized and media generated — images & videos for technical documents
						</h1>
						<p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
							Upload technical PDFs and receive clear, focused summaries + generated images + short videos.
							Try 5 free uploads without creating an account. Sign up for unlimited uploads and to review your summaries, images and videos.
						</p>

						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<button
								onClick={startTrial}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-900 text-white rounded-md shadow-sm hover:bg-indigo-800 transition"
							>
								<UploadCloud size={16} /> Start free trial (5)
							</button>

							<Link
								to="/signup"
								className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-indigo-900 bg-white hover:bg-indigo-50 transition"
							>
								Sign up — unlimited
							</Link>
						</div>

						<ul className="mt-6 text-sm text-gray-500 space-y-1">
							<li>Free: 5 trial uploads.</li>
							<li>Sign up to keep, search and manage your summaries.</li>
						</ul>
					</div>

					{/* quick features / CTA card */}
					<aside className="flex items-center justify-center">
						<div className="w-full sm:w-[420px] bg-indigo-50 rounded-xl p-4 sm:p-6 shadow-inner">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-white rounded-lg">
										<UploadCloud size={24} className="text-indigo-700" />
									</div>
									<div>
										<div className="text-xs text-gray-600">Quick trial</div>
										<div className="text-lg font-semibold text-indigo-900">Upload up to 5 PDFs</div>
									</div>
								</div>
								<Link to="/trial" className="text-indigo-900 text-sm hover:underline">Try now</Link>
							</div>

							<div className="mt-4 grid grid-cols-1 gap-3">
								<div className="flex items-center gap-3 p-3 bg-white rounded">
									<FileText size={18} className="text-indigo-900" />
									<div>
										<div className="text-sm font-medium text-indigo-900">Concise summaries, images & videos</div>
										<div className="text-xs text-gray-600">Optimized for technical content — summaries + generated images + short videos</div>
									</div>
								</div>
							</div>

							<div className="mt-4 text-xs text-gray-500">Already have an account? <Link to="/login" className="text-indigo-900 hover:underline">Sign in</Link></div>
						</div>
					</aside>
				</section>

				{/* features grid responsive */}
				<section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="bg-white p-4 rounded-lg shadow-sm text-center">
						<div className="mx-auto inline-flex items-center justify-center w-10 h-10 rounded-md bg-indigo-50 mb-3">
							<FileText size={18} className="text-indigo-700" />
						</div>
						<h4 className="font-semibold text-indigo-900">Technical focus</h4>
						<p className="text-xs text-gray-600 mt-2">Summaries and generated images tuned for technical documents.</p>
					</div>

					<div className="bg-white p-4 rounded-lg shadow-sm text-center">
						<div className="mx-auto inline-flex items-center justify-center w-10 h-10 rounded-md bg-indigo-50 mb-3">
							<UploadCloud size={18} className="text-indigo-700" />
						</div>
						<h4 className="font-semibold text-indigo-900">Fast uploads</h4>
						<p className="text-xs text-gray-600 mt-2">Drag & drop pdfs.</p>
					</div>

					<div className="bg-white p-4 rounded-lg shadow-sm text-center">
						<div className="mx-auto inline-flex items-center justify-center w-10 h-10 rounded-md bg-indigo-50 mb-3">
							<User size={18} className="text-indigo-700" />
						</div>
						<h4 className="font-semibold text-indigo-900">Account storage</h4>
						<p className="text-xs text-gray-600 mt-2">Sign up to save and manage summaries.</p>
					</div>
				</section>
			</main>

			<footer className="border-t bg-white mt-12 py-6">
				<div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} Get your PDFs summarized</div>
			</footer>
		</div>
	);
}
