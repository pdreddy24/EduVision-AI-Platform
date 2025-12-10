import summarizeAxios from '../summarizeAxios';

const SUMMARIZE_PREFIX = import.meta.env.VITE_SUMMARIZE_PREFIX;

export async function summarizePdf(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${SUMMARIZE_PREFIX}/pdf`;

    const response = await summarizeAxios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}
