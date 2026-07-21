import axios from 'axios';

const AUTH_PREFIX = import.meta.env.VITE_AUTH_PREFIX ;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const refreshToken = async () => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}${AUTH_PREFIX}/refresh`,
            {},
            { withCredentials: true }
        );
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        return access_token;
    } catch (error) {
        localStorage.removeItem('access_token');
        window.location.replace('/login');
        throw error;
    }
};