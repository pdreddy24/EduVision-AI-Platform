import dashAxios from "../dashAxios";

const DASH_PREFIX = import.meta.env.VITE_DASH_PREFIX;

export async function getDashDetails() {
	try {
		const res = await dashAxios.get(`${DASH_PREFIX}/get-details`);
		const data = res.data || {};
		const stats = data.stats || {};

		const totalUploads =
			typeof stats.filesUploaded === "number"
				? stats.filesUploaded
				: Array.isArray(stats.history)
				? stats.history.length
				: 0;
		const totalSummaries = typeof stats.totalSummaries === "number" ? stats.totalSummaries : 0;

		//compute non-tech files
		const nonTechCount = Math.max(0, totalUploads - totalSummaries);

		return {
			totalUploads,
			totalSummaries,
			history: Array.isArray(stats.history) ? stats.history : [],
			nonTechCount,
		};
	} catch (err) {
		throw err;
	}
}