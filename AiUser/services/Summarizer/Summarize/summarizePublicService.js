const SUMMARIZE_PREFIX = import.meta.env.VITE_SUMMARIZE_PREFIX;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function summarizePdfPublic(file) {
    const url = `${API_BASE}${SUMMARIZE_PREFIX}/pdf`;
    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'omit',
    });

    const text = await resp.text();
    try {
        return JSON.parse(text);
    } catch {
        return { error: `Unexpected response: ${text}` };
    }
}
