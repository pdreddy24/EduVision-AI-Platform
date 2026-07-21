import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deleteDocumentObject, getDocumentObject, putDocumentObject } from "../services/objectStorage.js";

test("local object storage round trips a document", async () => {
  process.env.STORAGE_DRIVER = "local";
  process.env.UPLOAD_STAGING_DIR = await mkdtemp(path.join(os.tmpdir(), "eduvision-storage-"));
  const stored = await putDocumentObject({ userId: "user", documentId: "doc", originalName: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  assert.equal(stored.driver, "local");
  assert.equal((await getDocumentObject(stored.key)).toString(), "hello");
  assert.equal((await readFile(path.join(process.env.UPLOAD_STAGING_DIR, stored.key))).toString(), "hello");
  await deleteDocumentObject(stored.key);
  await assert.rejects(getDocumentObject(stored.key), { code: "ENOENT" });
});
