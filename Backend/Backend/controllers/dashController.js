import UserStats from "../models/UserStats.js";

// Get user details
export const getDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const stats = await UserStats.findOne({ userId }).lean();

    const HISTORY_LIMIT = 20;
    const rawHistory = stats?.history ?? [];
    let history = rawHistory
      .slice(0, HISTORY_LIMIT)
      .map((h) => ({
        filename: h.filename,
        pdfUrl: h.pdfUrl,
        imageUrl: h.imageUrl ?? null,
        videoUrl: h.videoUrl ?? null,
        uploadedAt: h.uploadedAt,
        summary: h.summary,
      }));

    if (history.length === 0) {
      history = [
        {
          filename: "NA",
          pdfUrl: null,
          uploadedAt: null,
          summary: "NA",
          imageUrl: null,
          videoUrl: null,
        },
      ];
    }

    const response = {
      stats: {
        filesUploaded: stats?.filesUploaded ?? 0,
        totalSummaries: stats?.totalSummaries ?? 0,
        freeTrialsLeft: typeof stats?.freeTrialsLeft === "number" ? stats.freeTrialsLeft : 5,
        history,
      },
    };

    return res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};