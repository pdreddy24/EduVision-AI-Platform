import PDFParser from "pdf2json";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import UserStats from "../models/UserStats.js";
import jwt from "jsonwebtoken";
import { trackBackendEvent } from "../utils/trackBackendEvent.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCESS_TOKEN = process.env.ACCESS_TOKEN_SECRET;

// Extract text from PDF using pdf2json
async function extractPdfText(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) =>
      reject(err?.parserError ?? err)
    );

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const pages = pdfData?.formImage?.Pages ?? pdfData?.Pages ?? [];

      if (!Array.isArray(pages) || pages.length === 0) {
        return reject(new Error("Unable to extract pages from PDF"));
      }

      const extractTextFromPage = (page) => {
        if (!page?.Texts) return "";
        const parts = [];

        for (const txtObj of page.Texts) {
          const fragments = Array.isArray(txtObj.R)
            ? txtObj.R
            : [txtObj.R].filter(Boolean);

          for (const frag of fragments) {
            try {
              if (frag?.T) parts.push(decodeURIComponent(frag.T));
            } catch {}
          }
        }
        return parts.join(" ");
      };

      const fullText = pages
        .map(extractTextFromPage)
        .filter(Boolean)
        .join("\n\n");

      if (!fullText.trim()) {
        return reject(new Error("No readable text extracted from PDF"));
      }

      resolve(fullText.trim());
    });

    pdfParser.parseBuffer(buffer);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countKeywordHits(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of TECH_KEYWORDS) {
    const re = new RegExp(
      `\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
      "g"
    );
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export const summarizePdf = async (req, res) => {
  try {
    // ================
    // FILE VALIDATION
    // ================
    if (!req.file) {
      trackBackendEvent("UPLOAD_FAILED_BACKEND", { reason: "NO_FILE" });
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      trackBackendEvent("UPLOAD_FAILED_BACKEND", { reason: "INVALID_MIMETYPE" });
      return res.status(400).json({ message: "Uploaded file must be a PDF" });
    }

    // SUCCESSFUL FILE UPLOAD EVENT
    trackBackendEvent("FILE_UPLOADED_BACKEND", {
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    // ==========================
    // USER AUTH HANDLING
    // ==========================
    let userId = null;
    try {
      const authHeader = req.headers?.authorization;
      const token =
        authHeader?.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : req.cookies?.accessToken ?? req.body?.access_token ?? null;

      if (token && ACCESS_TOKEN) {
        const decoded = jwt.verify(token, ACCESS_TOKEN);
        userId = decoded?.id ?? null;
      }
    } catch {}

    (async () => {
      try {
        if (userId) {
          await UserStats.findOneAndUpdate(
            { userId },
            { $inc: { filesUploaded: 1 } },
            { upsert: true }
          );
        }
      } catch {}
    })();

    // ======================
    // TEXT EXTRACTION
    // ======================
    let text;
    try {
      text = await extractPdfText(req.file.buffer);
    } catch (err) {
      trackBackendEvent("PDF_TEXT_EXTRACTION_FAILED", { error: err.message });
      return res.status(500).json({
        message: "Failed to extract text from PDF",
        error: err.message,
      });
    }

    if (!text || text.length < 10) {
      trackBackendEvent("PDF_TEXT_EMPTY");
      return res.status(400).json({
        message: "PDF contains no readable text (may be scanned).",
      });
    }

    // ======================
    // TECHNICALITY CHECK
    // ======================
    const keywordHits = countKeywordHits(text);
    const KEYWORD_THRESHOLD = 3;
    const isTechnical = keywordHits >= KEYWORD_THRESHOLD;

    if (!isTechnical) {
      trackBackendEvent("PDF_REJECTED_NON_TECHNICAL", {
        keywordHits,
        threshold: KEYWORD_THRESHOLD,
      });

      return res.status(200).json({
        message: "This PDF is NOT a technical document, kindly upload a technical PDF.",
        reason: `Keyword hits ${keywordHits} < ${KEYWORD_THRESHOLD}`,
      });
    }

    const SUMMARY_MODEL = process.env.SUMMARY_MODEL;
    const IMAGE_MODEL = process.env.IMAGE_MODEL;
    const VIDEO_MODEL = process.env.VIDEO_MODEL;
    const VIDEO_SECONDS =
      parseInt(process.env.VIDEO_SECONDS, 10) || 4;

    if (!SUMMARY_MODEL || !IMAGE_MODEL || !VIDEO_MODEL) {
      return res.status(500).json({
        message:
          "Server misconfiguration: SUMMARY_MODEL, IMAGE_MODEL and VIDEO_MODEL must be set",
      });
    }

    // ======================
    // SUMMARY GENERATION
    // ======================
    const summaryPrompt = `You are a strict assistant. Return ONLY a JSON object like:
{"summary": "..."}

Summarize the following technical text concisely:

${text.slice(0, 50000)}
`;

    let summaryResultText;
    try {
      const chatResp = await openai.chat.completions.create({
        model: SUMMARY_MODEL,
        messages: [
          { role: "system", content: "You produce only JSON with a single key: summary" },
          { role: "user", content: summaryPrompt },
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      summaryResultText =
        chatResp?.choices?.[0]?.message?.content ??
        chatResp?.choices?.[0]?.text;

      if (!summaryResultText)
        throw new Error("Empty response from OpenAI summarization");
    } catch (err) {
      trackBackendEvent("MODEL_SUMMARY_FAILED", { error: err.message });
      return res.status(503).json({
        message: "OpenAI is temporarily unavailable. Please try again later.",
        error: err.message,
      });
    }

    let summary;
    try {
      const start = summaryResultText.indexOf("{");
      const end = summaryResultText.lastIndexOf("}");
      summary = JSON.parse(summaryResultText.slice(start, end + 1)).summary;
    } catch {
      return res.status(500).json({
        message: "Summarization failed. Model returned invalid JSON.",
        rawOutput: summaryResultText,
      });
    }

    // ======================
    // IMAGE GENERATION
    // ======================
    let imageBase64 = null;
    try {
      const imgPrompt = makeImagePrompt(summary);

      const imgResp = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt: imgPrompt,
        size: "1024x1024",
      });

      const imgData = imgResp?.data?.[0]?.b64_json;
      if (imgData) imageBase64 = `data:image/png;base64,${imgData}`;
    } catch (err) {
      trackBackendEvent("IMAGE_GENERATION_FAILED", { error: err.message });
    }

    // ======================
    // VIDEO GENERATION
    // ======================
    let videoBase64 = null;
    try {
      const videoPrompt = makeVideoPrompt(summary, VIDEO_SECONDS);
      let video = await openai.videos.create({
        model: VIDEO_MODEL,
        prompt: videoPrompt,
        seconds: String(VIDEO_SECONDS),
        size: "1280x720",
      });

      while (video.status === "in_progress" || video.status === "queued") {
        await sleep(2000);
        video = await openai.videos.retrieve(video.id);
      }

      if (video.status !== "failed") {
        const content = await openai.videos.downloadContent(video.id);
        const buffer = Buffer.from(await content.arrayBuffer());
        videoBase64 = `data:video/mp4;base64,${buffer.toString("base64")}`;
      }
    } catch (err) {
      trackBackendEvent("VIDEO_GENERATION_FAILED", { error: err.message });
    }

    // ======================
    // SUCCESS EVENT
    // ======================
    trackBackendEvent("CONVERSION_COMPLETED_BACKEND", {
      summary: !!summary,
      image: !!imageBase64,
      video: !!videoBase64,
    });

    // ======================
    // FINAL RESPONSE
    // ======================
    return res.json({ summary, imageBase64, videoBase64 });

  } catch (err) {
    trackBackendEvent("BACKEND_FATAL_ERROR", { error: err.message });

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
