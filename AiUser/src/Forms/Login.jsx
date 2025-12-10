import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/Auth/AuthForm/authServices";

export default function Login() {
	const [form, setForm] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);

	const validate = () => {
		const e = {};
		if (!form.email) e.email = "Email is required";
		else if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
		if (!form.password) e.password = "Password is required";
		return e;
	};

	const handleChange = (evt) => {
		const { name, value } = evt.target;
		setForm((s) => ({ ...s, [name]: value }));
	};

	const handleSubmit = async (evt) => {
		evt.preventDefault();
		const v = validate();
		setErrors(v);
		if (Object.keys(v).length) {
			const msgs = Object.values(v);
			if (msgs.length) {
				toast.error(msgs[0]);
				for (let i = 1; i < msgs.length; i++) toast.error(msgs[i]);
			}
			return;
		}

		setSubmitting(true);
		try {
			const res = await authService.login(form.email, form.password);
			if (res?.success) {
				toast.success(res.message || "Signed in successfully");
				setTimeout(() => window.location.reload(), 300);
			} else {
				const msg = res?.message || "Login failed";
				toast.error(msg);
				setErrors({ submit: msg });
			}
		} catch (err) {
			const msg = err?.message || "Login failed";
			toast.error(msg);
			setErrors({ submit: msg });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
			<div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
				<h2 className="text-2xl font-semibold text-center text-indigo-900 mb-2">Sign in</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Email */}
					<div>
						<label className="text-sm font-medium text-gray-700">Email</label>
						<div className="mt-1 relative">
							<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-900">
								<Mail size={18} />
							</span>
							<input
								name="email"
								value={form.email}
								onChange={handleChange}
								type="email"
								autoComplete="email"
								placeholder="you@example.com"
								className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.email ? "border-red-400" : "border-gray-200"
								}`}
							/>
						</div>
					</div>

					{/* Password */}
					<div>
						<label className="text-sm font-medium text-gray-700">Password</label>
						<div className="mt-1 relative">
							<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-900">
								<Lock size={18} />
							</span>
							<input
								name="password"
								value={form.password}
								onChange={handleChange}
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								placeholder="Enter password"
								className={`block w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.password ? "border-red-400" : "border-gray-200"
								}`}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((s) => !s)}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-900"
								aria-label="Toggle password visibility"
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>

					{/* Submit */}
					<div>
						<button
							type="submit"
							disabled={submitting}
							className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-900 hover:bg-indigo-900 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 disabled:opacity-60"
						>
							{submitting ? "Signing in..." : "Sign in"}
						</button>
					</div>
				</form>

				<div className="mt-4 text-center text-sm text-gray-600">
					Don't have an account?{" "}
					<Link to="/signup" className="text-indigo-900 hover:underline">
						Create one
					</Link>
				</div>

				{/* Public CTA: free trials + home (inline) */}
				<div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-700">
					<span>Enjoy 5 free trial uploads without signing up.</span>
					<div className="flex items-center gap-2">
						<Link to="/" className="inline-flex items-center px-3 py-1 border rounded text-indigo-900 text-sm bg-white hover:bg-indigo-50">
							Home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
