import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { optimizeDocument } from "../services/textOptimizationService.js";
import { rankChunks } from "../services/retrievalService.js";
import { countTokens, tokenSavings } from "../services/tokenService.js";

async function ownedDocument(req) {
  return Document.findOne({ _id: req.params.id, userId: req.user.id });
}

export async function optimize(req, res, next) {
  try {
    const document = await ownedDocument(req);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (document.status !== "completed") return res.status(409).json({ message: "Document parsing is not complete" });
    const result = optimizeDocument(document.pages);
    await DocumentChunk.deleteMany({ documentId: document._id, userId: req.user.id });
    if (result.chunks.length) {
      await DocumentChunk.insertMany(result.chunks.map((chunk) => ({ ...chunk, documentId: document._id, userId: req.user.id })));
    }
    document.optimization = { ...result.metrics, optimizedAt: new Date() };
    await document.save();
    return res.json({ optimization: document.optimization, chunks: result.chunks });
  } catch (error) {
    if (error?.name === "CastError") return res.status(404).json({ message: "Document not found" });
    return next(error);
  }
}

export async function retrieve(req, res, next) {
  try {
    const query = String(req.body?.query || "").trim();
    if (query.length < 2 || query.length > 500) return res.status(400).json({ message: "Query must contain 2 to 500 characters" });
    const document = await ownedDocument(req);
    if (!document) return res.status(404).json({ message: "Document not found" });
    const chunks = await DocumentChunk.find({ documentId: document._id, userId: req.user.id }).sort({ chunkIndex: 1 }).lean();
    if (!chunks.length) return res.status(409).json({ message: "Optimize this document before retrieving chunks" });
    const topK = Number.parseInt(req.body?.topK, 10) || 5;
    const ranked = rankChunks(query, chunks, topK);
    const retrievedTokens = ranked.reduce((sum, chunk) => sum + countTokens(chunk.text), 0);
    const originalTokens = document.optimization?.originalTokens || countTokens(document.fullText);
    return res.json({
      query,
      chunks: ranked.map(({ _id, text, tokenCount, pageNumbers, heading, chunkIndex, score }) => ({ id: _id, text, tokenCount, pageNumbers, heading, chunkIndex, score })),
      metrics: {
        ...tokenSavings(originalTokens, retrievedTokens),
        cleanedTokens: document.optimization?.cleanedTokens || null,
        retrievedTokens,
        retrievedChunkCount: ranked.length,
      },
    });
  } catch (error) {
    if (error?.name === "CastError") return res.status(404).json({ message: "Document not found" });
    return next(error);
  }
}
