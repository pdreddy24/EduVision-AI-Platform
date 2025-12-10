import { Link, useNavigate } from "react-router-dom";
import { Home, UploadCloud, LogOut, Menu, X, User } from "lucide-react";
import { authService } from "../../services/Auth/AuthForm/authServices";
import { useState, useEffect } from "react";
import profileService from "../../services/Auth/Profile/authServices";

export default function NavBar() {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [userOpen, setUserOpen] = useState(false);
	const [userName, setUserName] = useState("User");

	const handleLogout = async () => {
		try {
			await authService.logout();
		} catch (err) {
			navigate("/login", { replace: true });
		}
	};

	useEffect(() => {
		let mounted = true;
		async function loadProfile() {
			try {
				const res = await profileService.getProfile();
				if (!mounted) return;
				if (res?.success) {
					const data = res.data || {};
					let name = "";
					if (data.name) {
						name = String(data.name || "").trim();
					}
					if (name) setUserName(name);
				}
			} catch (e) {
			}
		}
		loadProfile();
		return () => { mounted = false; };
	}, []);

	return (
		<nav className="w-full bg-white border-b shadow-sm">
			<div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
				{/* left: logo */}
				<div className="flex items-center gap-2">
					<div className="text-indigo-900 font-semibold text-lg hover:text-indigo-800 transition-colors duration-150">{userName}</div>
				</div>

				{/* desktop: links + user dropdown (right) */}
				<div className="hidden md:flex items-center gap-4 relative">
					<Link
						to="/dashboard"
						className="flex items-center gap-2 text-sm text-indigo-900 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-100"
					>
						<Home size={16} /> <span>Dashboard</span>
					</Link>

					<Link
						to="/upload"
						className="flex items-center gap-2 text-sm text-indigo-900 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-100"
					>
						<UploadCloud size={16} /> <span>Upload</span>
					</Link>

					{/* user avatar / dropdown toggle */}
					<div className="relative">
						<button
							onClick={() => setUserOpen((s) => !s)}
							className="flex items-center gap-2 bg-indigo-900 text-white px-3 py-1 rounded-md hover:bg-indigo-800 hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-200"
							aria-haspopup="true"
							aria-expanded={userOpen}
						>
							<User size={16} /> <span className="sr-only">User menu</span>
						</button>

						{userOpen && (
							<div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-20 overflow-hidden">
								<Link
									to="/profile"
									onClick={() => setUserOpen(false)}
									className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
								>
									Profile
								</Link>
								<button
									onClick={() => {
										setUserOpen(false);
										handleLogout();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
								>
									Logout
								</button>
							</div>
						)}
					</div>
				</div>

				{/* mobile: hamburger */}
				<div className="md:hidden flex items-center">
					<button
						onClick={() => setOpen((s) => !s)}
						aria-label={open ? "Close menu" : "Open menu"}
						className="p-2 rounded-md text-indigo-900 hover:bg-gray-100 transition-colors duration-150"
					>
						{open ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			{/* mobile menu panel */}
			<div className={`md:hidden ${open ? "block" : "hidden"} px-4 pb-4`}>
				<div className="flex flex-col gap-2">
					<Link
						to="/dashboard"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2 text-indigo-900 hover:bg-indigo-50 hover:text-indigo-800 px-3 py-2 rounded-md transition-colors duration-150"
					>
						<Home size={16} /> <span>Dashboard</span>
					</Link>

					<Link
						to="/upload"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2 text-indigo-900 hover:bg-indigo-50 hover:text-indigo-800 px-3 py-2 rounded-md transition-colors duration-150"
					>
						<UploadCloud size={16} /> <span>Upload</span>
					</Link>

					{/* mobile profile + logout entries */}
					<Link
						to="/profile"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2 text-indigo-900 hover:bg-indigo-50 hover:text-indigo-800 px-3 py-2 rounded-md transition-colors duration-150"
					>
						<User size={16} /> <span>Profile</span>
					</Link>

					<button
						onClick={() => {
							setOpen(false);
							handleLogout();
						}}
						className="flex items-center gap-2 bg-indigo-900 text-white px-3 py-2 rounded-md hover:bg-indigo-800 hover:scale-105 transform transition duration-150"
					>
						<LogOut size={16} /> Logout
					</button>
				</div>
			</div>
		</nav>
	);
}
