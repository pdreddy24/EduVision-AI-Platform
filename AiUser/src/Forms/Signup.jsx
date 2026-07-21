import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { toast } from 'react-toastify';
import { authService } from '../../services/Auth/AuthForm/authServices';

export default function Signup() {
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		confirm: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const navigate = useNavigate();

	// simple validation
	const validate = () => {
		const e = {};
		if (!form.name || !String(form.name).trim()) e.name = "Name is required";
		if (!form.email) e.email = "Email is required";
		else if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
		if (!form.password) e.password = "Password is required";
		else if (form.password.length < 6) e.password = "Password must be 6+ chars";
		else {
			const complexity = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).+$/;
			if (!complexity.test(form.password)) {
				e.password = "Password must include at least one uppercase letter, one number and one special character";
			}
		}
		if (!form.confirm) e.confirm = "Please confirm your password";
		else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
		return e;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((s) => ({ ...s, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const v = validate();
		setErrors(v);
		if (Object.keys(v).length) {
			const msgs = Object.values(v);
			if (msgs.length) {
				toast.error(msgs[0]);
				for (let i = 1; i < msgs.length; i++) {
					toast.error(msgs[i]);
				}
			}
			return;
		}

		setSubmitting(true);
		try {
			const res = await authService.signup(form.name, form.email, form.password);
			if (res?.success) {
				toast.success(res.message || 'Account created successfully');
				setTimeout(() => navigate('/login'), 800);
			} else {
				const msg = res?.message || 'Signup failed';
				toast.error(msg);
				setErrors({ submit: msg });
			}
		} catch (err) {
			const msg = err?.message || 'Signup failed';
			toast.error(msg);
			setErrors({ submit: msg });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
			<div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
				<h2 className="text-2xl font-semibold text-center text-indigo-900 mb-2">Create account</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Name */}
					<div>
						<label className="text-sm font-medium text-gray-700">Name</label>
						<div className="mt-1 relative">
							<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-900">
								<User size={18} />
							</span>
							<input
								name="name"
								value={form.name}
								onChange={handleChange}
								className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.name ? "border-red-400" : "border-gray-200"
								}`}
								placeholder="Your full name"
								autoComplete="name"
								type="text"
								required
							/>
						</div>
					</div>
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
								className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.email ? "border-red-400" : "border-gray-200"
								}`}
								placeholder="you@example.com"
								autoComplete="email"
								type="email"
								required
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
								className={`block w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.password ? "border-red-400" : "border-gray-200"
								}`}
								placeholder="Enter password"
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								required
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

					{/* Confirm Password */}
					<div>
						<label className="text-sm font-medium text-gray-700">Confirm password</label>
						<div className="mt-1 relative">
							<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-900">
								<Lock size={18} />
							</span>
							<input
								name="confirm"
								value={form.confirm}
								onChange={handleChange}
								className={`block w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-900 ${
									errors.confirm ? "border-red-400" : "border-gray-200"
								}`}
								placeholder="Confirm password"
								type={showConfirm ? "text" : "password"}
								autoComplete="new-password"
								required
							/>
							<button
								type="button"
								onClick={() => setShowConfirm((s) => !s)}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-900"
								aria-label="Toggle confirm password visibility"
							>
								{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
							{submitting ? "Creating..." : "Create account"}
						</button>
					</div>
				</form>

				<div className="mt-4 text-center text-sm text-gray-600">
					Already have an account?{" "}
					<Link to="/login" className="text-indigo-900 hover:underline">
						Sign in
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