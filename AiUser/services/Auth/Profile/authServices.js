import axios from '../authAxios';

const AUTH_PREFIX = import.meta.env.VITE_AUTH_PREFIX;

const profileService = {
	// fetch profile data
	async getProfile() {
		try {
			const response = await axios.get(`${AUTH_PREFIX}/get-profile`);
			return { success: true, data: response.data };
		} catch (error) {
			const serverMessage = error?.response?.data?.message;
			return { success: false, message: serverMessage || 'Failed to fetch profile' };
		}
	},

	// update name
	async changeName(formData) {
		try {
			let name = '';
			if (typeof formData === 'string') {
				name = formData;
			}

			name = String(name || '').trim();

			const response = await axios.put(`${AUTH_PREFIX}/change-name`, { name });
			return { success: true, data: response.data, message: response.data?.message || 'Profile updated' };
		} catch (error) {
			const serverMessage = error?.response?.data?.message;
			return { success: false, message: serverMessage || 'Failed to update profile' };
		}
	},

	// change password endpoint
	async changePassword(currentPassword, newPassword) {
		try {
			const response = await axios.put(`${AUTH_PREFIX}/change-password`, {
				current_password: currentPassword,
				new_password: newPassword,
			});
			return { success: true, message: response.data?.message || 'Password changed' };
		} catch (error) {
			const serverMessage = error?.response?.data?.message;
			return { success: false, message: serverMessage || 'Failed to change password' };
		}
	},
};

export default profileService;
