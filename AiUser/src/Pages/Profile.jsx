import { useEffect, useState } from 'react';
import profileService from '../../services/Auth/Profile/authServices';
import { User, Mail, Calendar, Lock, Key, Check, Save, Edit2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfileForm() {
	const [loading, setLoading] = useState(false);
	const [profile, setProfile] = useState({
		name: '',
		email: '',
		joined_at: '',
		avatar_url: '',
	});
	const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
	const [editingName, setEditingName] = useState(false);
	const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

	useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			const res = await profileService.getProfile();
			setLoading(false);
			if (res.success && mounted) {
				const data = res.data || {};
				let name = '';
				if (data.name) {
					name = String(data.name || '').trim();
				} else if (data.first_name || data.firstName || data.last_name || data.lastName) {
					const first = data.first_name || data.firstName || '';
					const last = data.last_name || data.lastName || '';
					name = `${first} ${last}`.trim();
				}

				setProfile({
					name: name,
					email: data.email || '',
					joined_at: data.joined_at || data.created_at || data.createdAt || '',
					avatar_url: data.avatar_url || data.img || '',
				});
				setAvatarPreview(data.avatar_url || data.img || '');
			} else if (!res.success) {
				toast.error(res.message || 'Failed to load profile');
			}
		}
		load();
		return () => { mounted = false; };
	}, []);

	function reloadPage() {
		window.location.reload();
	}

	async function submitName(e) {
		e?.preventDefault();
		setLoading(true);
		const res = await profileService.changeName(profile.name || '');
		setLoading(false);
		if (res.success) {
			toast.success(res.message || 'Name updated');
			const user = res.data?.user || res.data;
			const newName = (user?.name) ? String(user.name).trim() : (profile.name || '');
			setProfile((p) => ({ ...p, name: newName }));
			setEditingName(false);
		} else {
			toast.error(res.message || 'Failed to update name');
		}
	}

	async function submitPassword(e) {
		e.preventDefault();
		if (!pwd.current || !pwd.newPwd || !pwd.confirm) {
			toast.error('Please fill all password fields');
			return;
		}
		if (pwd.newPwd !== pwd.confirm) {
			toast.error('Passwords do not match');
			return;
		}
		setLoading(true);
		const res = await profileService.changePassword(pwd.current, pwd.newPwd);
		setLoading(false);
		if (res.success) {
			toast.success(res.message || 'Password changed');
			setPwd({ current: '', newPwd: '', confirm: '' });
		} else {
			toast.error(res.message || 'Failed to change password');
		}
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Profile</h2>
			</div>

			<div className="flex flex-col gap-6 md:flex-row">
				{/* left: profile info */}
				<div className="md:flex-1 bg-white rounded-lg p-4 shadow">
					<form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
						<div className="flex flex-col">
							<div className="flex items-center justify-between gap-3">
								{editingName ? (
									<>
										<div className="flex-1 relative">
											<User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
											<input
												autoFocus
												value={profile.name}
												onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
												placeholder="Name"
												className="w-full border rounded px-3 py-2 pl-10"
											/>
										</div>

										<button
											type="button"
											onClick={submitName}
											disabled={loading}
											className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded"
										>
											<Save size={14} /> Save
										</button>
										<button
											type="button"
											onClick={() => setEditingName(false)}
											className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-gray-700"
										>
											Cancel
										</button>
									</>
								) : (
									<>
										<div className="flex-1 flex items-center gap-3">
											<div className="relative flex-1">
												<User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
												<input
													value={profile.name || ''}
													readOnly
													className="w-full border rounded px-3 py-2 pl-10 bg-gray-50"
													aria-label="Name"
												/>
											</div>
										</div>

										<button
											type="button"
											onClick={() => setEditingName(true)}
											className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-indigo-900"
											title="Edit name"
										>
											<Edit2 size={16} className="text-indigo-900" />
										</button>
									</>
								)}
							</div>
						</div>

						{/* email read-only*/}
						<div className="flex items-center gap-3">
							<div className="relative flex-1">
								<Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
								<input value={profile.email || ''} readOnly placeholder="Email" className="w-full border rounded px-3 py-2 pl-10 bg-gray-50 cursor-not-allowed" />
							</div>
						</div>

						{/* created date (read-only) */}
						<div className="flex items-center gap-3">
							<div className="relative flex-1">
								<Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
								<input value={profile.joined_at ? new Date(profile.joined_at).toLocaleString() : ''} readOnly className="w-full border rounded px-3 py-2 pl-10 bg-gray-50 cursor-not-allowed" />
							</div>
						</div>
					</form>

					<div className="mt-12 text-sm text-gray-600 flex items-center justify-between gap-3">
						<div>
							If updates are not shown, click Refresh to reload your profile.
						</div>
						<button
							type="button"
							onClick={reloadPage}
							className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-3 py-1.5 rounded"
						>
							<RefreshCw size={14} /> Refresh
						</button>
					</div>
				</div>

				{/* right: change password */}
				<div className="md:flex-1 bg-white rounded-lg p-4 shadow">
					<h3 className="text-lg font-medium mb-3">Change password</h3>
					<form onSubmit={submitPassword} className="flex flex-col gap-3">
						<div className="relative flex items-center">
							<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
							<input
								type={showPwd.current ? 'text' : 'password'}
								placeholder="Current password"
								value={pwd.current}
								onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
								className="w-full border rounded px-3 py-2 pl-10"
							/>
							<button
								type="button"
								onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-900"
								title={showPwd.current ? 'Hide password' : 'Show password'}
							>
								{showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>

						<div className="relative flex items-center">
							<Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
							<input
								type={showPwd.newPwd ? 'text' : 'password'}
								placeholder="New password"
								value={pwd.newPwd}
								onChange={(e) => setPwd((p) => ({ ...p, newPwd: e.target.value }))}
								className="w-full border rounded px-3 py-2 pl-10"
							/>
							<button
								type="button"
								onClick={() => setShowPwd((s) => ({ ...s, newPwd: !s.newPwd }))}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-900"
								title={showPwd.newPwd ? 'Hide password' : 'Show password'}
							>
								{showPwd.newPwd ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>

						<div className="relative flex items-center">
							<Check size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900" />
							<input
								type="password"
								placeholder="Confirm new password"
								value={pwd.confirm}
								onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
								className="w-full border rounded px-3 py-2 pl-10"
							/>
						</div>

						<div className="mt-2">
							<button type="submit" className="inline-flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded" disabled={loading}>
								<Save size={16} /> Change password
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}