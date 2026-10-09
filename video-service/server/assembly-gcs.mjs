// Private Cloud Storage staging for final long-form assembly only.
// Make downloads using a time-limited V4 signed URL, then uploads to personal My Drive.
import fs from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { GoogleAuth } from "google-auth-library";

const API_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const STORAGE_API = "https://storage.googleapis.com";
const IAM_API = "https://iamcredentials.googleapis.com";
const SIGNED_URL_SECONDS = 60 * 60;

function rfc3986(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (c) =>
    "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function signedReadURL({ client, bucket, objectName, signerEmail }) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const day = timestamp.slice(0, 8);
  const scope = day + "/auto/storage/goog4_request";
  const resource = "/" + rfc3986(bucket) + "/" + objectName.split("/").map(rfc3986).join("/");
  const parameters = {
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": signerEmail + "/" + scope,
    "X-Goog-Date": timestamp,
    "X-Goog-Expires": String(SIGNED_URL_SECONDS),
    "X-Goog-SignedHeaders": "host",
  };
  const canonicalQuery = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([k, v]) => rfc3986(k) + "=" + rfc3986(v)).join("&");
  const canonicalRequest = "GET\n" + resource + "\n" + canonicalQuery +
    "\nhost:storage.googleapis.com\n\nhost\nUNSIGNED-PAYLOAD";
  const stringToSign = "GOOG4-RSA-SHA256\n" + timestamp + "\n" + scope + "\n" + sha256(canonicalRequest);
  const response = await client.request({
    url: IAM_API + "/v1/projects/-/serviceAccounts/" + encodeURIComponent(signerEmail) + ":signBlob",
    method: "POST",
    data: { payload: Buffer.from(stringToSign, "utf8").toString("base64") },
  });
  const signature = response.data?.signedBlob;
  if (!signature) throw new Error("IAM signBlob returned no signature; check the service account's Token Creator permission");
  const hexSignature = Buffer.from(signature, "base64").toString("hex");
  return {
    download_url: STORAGE_API + resource + "?" + canonicalQuery + "&X-Goog-Signature=" + hexSignature,
    download_expires_at: new Date(now.getTime() + SIGNED_URL_SECONDS * 1000).toISOString(),
  };
}

export async function uploadFinalAssemblyToGCS(filePath, filename, videoId) {
  const bucket = String(process.env.AXLF_ASSEMBLY_GCS_BUCKET || "").trim();
  if (!bucket) throw new Error("AXLF_ASSEMBLY_GCS_BUCKET is not configured");
  if (!/^[a-z0-9][a-z0-9._-]{2,221}[a-z0-9]$/.test(bucket)) {
    throw new Error("Invalid AXLF_ASSEMBLY_GCS_BUCKET name");
  }
  const safeVideoId = String(videoId || "video").replace(/[^A-Za-z0-9_-]/g, "");
  const safeFilename = String(filename || "video_FINAL.mp4").replace(/[^A-Za-z0-9._-]/g, "_");
  const objectName = "final-assembly/" + safeVideoId + "/" + Date.now() + "-" + randomUUID() + "/" + safeFilename;
  const size = fs.statSync(filePath).size;

  const auth = new GoogleAuth({ scopes: [API_SCOPE] });
  const client = await auth.getClient();
  const session = await client.request({
    url: STORAGE_API + "/upload/storage/v1/b/" + rfc3986(bucket) +
      "/o?uploadType=resumable&name=" + rfc3986(objectName) + "&ifGenerationMatch=0",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(size),
    },
    data: { name: objectName, contentType: "video/mp4" },
  });
  const sessionURL = session.headers?.location;
  if (!sessionURL) throw new Error("Cloud Storage did not return a resumable upload session");
  const uploaded = await client.request({
    url: sessionURL,
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    data: fs.createReadStream(filePath),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  if (!uploaded.data?.name) throw new Error("Cloud Storage upload did not return an object name");

  const creds = await auth.getCredentials();
  const signerEmail = String(process.env.AXLF_SIGNER_SERVICE_ACCOUNT_EMAIL || creds.client_email || "").trim();
  if (!signerEmail) throw new Error("Cannot identify Cloud Run service account for V4 signed download URL");

  const signed = await signedReadURL({ client, bucket, objectName, signerEmail });
  return {
    filename: safeFilename,
    size_bytes: size,
    storage_bucket: bucket,
    storage_object: objectName,
    ...signed,
  };
}
