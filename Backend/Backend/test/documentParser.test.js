import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentExtension, isSupportedDocument, parseDocument } from "../services/documentParser.js";

test("recognizes all supported document formats", () => {
  const files = [
    ["paper.pdf", "application/pdf"],
    ["scan.png", "image/png"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["notes.txt", "text/plain"],
  ];
  for (const [originalname, mimetype] of files) {
    assert.equal(isSupportedDocument({ originalname, mimetype }), true);
  }
});

test("rejects extension and MIME mismatches", () => {
  assert.equal(isSupportedDocument({ originalname: "attack.exe", mimetype: "text/plain" }), false);
  assert.equal(isSupportedDocument({ originalname: "fake.pdf", mimetype: "image/png" }), false);
});

test("normalizes uppercase extensions", () => {
  assert.equal(getDocumentExtension("LECTURE.PDF"), ".pdf");
});

test("returns page-level TXT results split on form-feed", async () => {
  const parsed = await parseDocument({
    originalname: "lesson.txt",
    mimetype: "text/plain",
    buffer: Buffer.from("Page one\fPage two"),
  });
  assert.equal(parsed.pageCount, 2);
  assert.equal(parsed.pages[0].pageNumber, 1);
  assert.equal(parsed.pages[1].text, "Page two");
  assert.equal(parsed.usedOcr, false);
  assert.match(parsed.fullText, /Page one/);
});
