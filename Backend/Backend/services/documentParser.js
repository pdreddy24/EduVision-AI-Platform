import path from "path";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { createCanvas } from "@napi-rs/canvas";

export const SUPPORTED_DOCUMENT_TYPES = Object.freeze({
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".txt": ["text/plain"],
});

const MIN_NATIVE_TEXT_LENGTH = 20;
let ocrWorkerPromise;

export function getDocumentExtension(filename = "") {
  return path.extname(filename).toLowerCase();
}

export function isSupportedDocument(file) {
  const extension = getDocumentExtension(file?.originalname);
  return Boolean(extension && SUPPORTED_DOCUMENT_TYPES[extension]?.includes(file?.mimetype));
}

function normalizeText(text = "") {
  return text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function makePage(pageNumber, text, extractionMethod) {
  const normalized = normalizeText(text);
  return { pageNumber, text: normalized, extractionMethod: normalized ? extractionMethod : "empty", characterCount: normalized.length };
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker("eng").catch((error) => {
      ocrWorkerPromise = null;
      throw error;
    });
  }
  return ocrWorkerPromise;
}

async function recognizeImage(image) {
  const worker = await getOcrWorker();
  const result = await worker.recognize(image);
  return normalizeText(result?.data?.text ?? "");
}

async function parsePdf(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const nativeText = normalizeText(textContent.items.map((item) => item.str ?? "").join(" "));
    if (nativeText.length >= MIN_NATIVE_TEXT_LENGTH) {
      pages.push(makePage(pageNumber, nativeText, "native"));
      continue;
    }
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const ocrText = await recognizeImage(canvas.toBuffer("image/png"));
    pages.push(makePage(pageNumber, ocrText || nativeText, ocrText ? "ocr" : "native"));
  }
  return pages;
}

async function parseImage(buffer) {
  return [makePage(1, await recognizeImage(buffer), "ocr")];
}

async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return [makePage(1, result.value, "native")];
}

function parseTxt(buffer) {
  return buffer.toString("utf8").split("\f").map((text, index) => makePage(index + 1, text, "native"));
}

export async function parseDocument(file) {
  if (!isSupportedDocument(file)) {
    const error = new Error("Unsupported document type. Use PDF, PNG, JPEG, DOCX, or TXT.");
    error.status = 415;
    throw error;
  }
  const extension = getDocumentExtension(file.originalname);
  let pages;
  if (extension === ".pdf") pages = await parsePdf(file.buffer);
  else if ([".png", ".jpg", ".jpeg"].includes(extension)) pages = await parseImage(file.buffer);
  else if (extension === ".docx") pages = await parseDocx(file.buffer);
  else pages = parseTxt(file.buffer);
  const fullText = pages.map((page) => page.text).filter(Boolean).join("\n\n");
  return { pages, pageCount: pages.length, fullText, characterCount: fullText.length, usedOcr: pages.some((page) => page.extractionMethod === "ocr") };
}
