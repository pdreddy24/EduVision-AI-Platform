import crypto from "node:crypto";
import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client;
function storageDriver() {
  return (process.env.STORAGE_DRIVER || "local").toLowerCase();
}

function s3() {
  if (!client) client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
  return client;
}

function localRoot() {
  return path.resolve(process.env.UPLOAD_STAGING_DIR || "uploads/staging");
}

function safeLocalPath(key) {
  const root = localRoot();
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage key");
  return resolved;
}

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (typeof body.transformToByteArray === "function") return Buffer.from(await body.transformToByteArray());
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function putDocumentObject({ userId, documentId, originalName, mimeType, buffer }) {
  const extension = path.extname(originalName).toLowerCase();
  const key = `${userId}/${documentId}/${crypto.randomUUID()}${extension}`;
  if (storageDriver() === "s3") {
    await s3().send(new PutObjectCommand({
      Bucket: process.env.DOCUMENT_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
      Metadata: { documentid: String(documentId), userid: String(userId) },
    }));
    return { driver: "s3", key };
  }
  const destination = safeLocalPath(key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });
  return { driver: "local", key };
}

export async function getDocumentObject(key) {
  if (storageDriver() === "s3") {
    const response = await s3().send(new GetObjectCommand({ Bucket: process.env.DOCUMENT_BUCKET, Key: key }));
    return streamToBuffer(response.Body);
  }
  return readFile(safeLocalPath(key));
}

export async function deleteDocumentObject(key) {
  if (!key) return;
  if (storageDriver() === "s3") {
    await s3().send(new DeleteObjectCommand({ Bucket: process.env.DOCUMENT_BUCKET, Key: key }));
    return;
  }
  await unlink(safeLocalPath(key)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export function resetStorageClientForTests() {
  client = undefined;
}
