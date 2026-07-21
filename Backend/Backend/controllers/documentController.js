import Document from "../models/Document.js";
import { getDocumentExtension } from "../services/documentParser.js";
import { enqueueDocumentParsing } from "../services/documentQueue.js";
import { deleteDocumentObject, putDocumentObject } from "../services/objectStorage.js";

function serialize(document) {
  return { id: document._id, originalName: document.originalName, mimeType: document.mimeType, extension: document.extension, size: document.size, status: document.status, jobId: document.jobId, attempts: document.attempts, pages: document.pages, pageCount: document.pageCount, fullText: document.fullText, characterCount: document.characterCount, usedOcr: document.usedOcr, errorMessage: document.errorMessage, processingStartedAt: document.processingStartedAt, processingCompletedAt: document.processingCompletedAt, createdAt: document.createdAt, updatedAt: document.updatedAt };
}

export async function createDocument(req, res, next) {
  let document;
  try {
    document = await Document.create({ userId: req.user.id, originalName: req.file.originalname, mimeType: req.file.mimetype, extension: getDocumentExtension(req.file.originalname), size: req.file.size, status: "queued" });
    const stored = await putDocumentObject({ userId: req.user.id, documentId: document.id, originalName: req.file.originalname, mimeType: req.file.mimetype, buffer: req.file.buffer });
    document.storageDriver = stored.driver;
    document.storageKey = stored.key;
    const job = await enqueueDocumentParsing({ documentId: document.id, storageKey: stored.key, originalName: req.file.originalname, mimeType: req.file.mimetype });
    document.jobId = job.id;
    await document.save();
    return res.status(202).json({ document: serialize(document) });
  } catch (error) {
    if (document) {
      document.status = "failed";
      document.errorMessage = error.message;
      await document.save().catch(() => {});
    }
    if (document?.storageKey) await deleteDocumentObject(document.storageKey).catch(() => {});
    return next(error);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = await Document.find({ userId: req.user.id }).select("-fullText -pages").sort({ createdAt: -1 }).limit(50);
    return res.json({ documents: documents.map(serialize) });
  } catch (error) { return next(error); }
}

export async function getDocument(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) return res.status(404).json({ message: "Document not found" });
    return res.json({ document: serialize(document) });
  } catch (error) {
    if (error?.name === "CastError") return res.status(404).json({ message: "Document not found" });
    return next(error);
  }
}
