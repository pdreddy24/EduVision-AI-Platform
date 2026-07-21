import axios from '../authAxios';

const AUTH_PREFIX = import.meta.env.VITE_AUTH_PREFIX;

const authService = {
    async login(email, password) {
        try {
            const response = await axios.post(`${AUTH_PREFIX}/login`, { email, password });
            const { access_token, id } = response.data || {};
            if (access_token) localStorage.setItem('access_token', access_token);
            if (id) localStorage.setItem('user_id', id);
            return { success: true, message: response.data.message || 'Signed in successfully' };
        } catch (error) {
            const err = error;
            const serverMessage = err?.response?.data?.message;
            if (err?.response?.status === 401) {
                return { success: false, message: serverMessage || "Invalid email or password" };
            }
            return { success: false, message: serverMessage || 'Login failed' };
        }
    },

    async signup(name, email, password) {
        try {
            const payload = { name, email, password };
            const response = await axios.post(`${AUTH_PREFIX}/signup`, payload);
            return { success: true, message: response.data.message || 'Account created successfully' };
        } catch (error) {
            const serverMessage = error?.response?.data?.message;
            return { success: false, message: serverMessage || 'Signup failed' };
        }
    },

    async logout() {
        try {
            await axios.post(`${AUTH_PREFIX}/logout`);
        }
        finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            window.location.replace('/login');
        }
    },
};

export { authService };